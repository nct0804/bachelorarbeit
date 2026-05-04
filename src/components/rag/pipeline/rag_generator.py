#!/usr/bin/env python3
"""Modular RAG pipeline that bridges semantic mapping with generative LLM."""

import argparse
import json
import os
from pathlib import Path
import re
import sys
from dataclasses import dataclass
from typing import Any

project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.append(str(project_root))

from src.components.semantic.nlp_processor import RequirementNLPProcessor
from src.components.semantic.semantic_mapper import (
    LocalEmbeddingModel,
    SentenceTransformerEmbeddingModel,
    extract_keyword_catalog,
    filter_catalog_by_scope,
    normalize_text,
    dot_product,
    calculate_lexical_similarity,
    calculate_element_type_boost,
    calculate_disambiguation_penalty,
    RequirementEntry,
    load_requirements
)
from src.components.rag.llm.llm_client import GeminiClient


LOCATOR_CATEGORIES = {
    "button",
    "checkbox",
    "link",
    "list",
    "messagebox",
    "modal",
    "notification",
    "section",
    "tab",
    "text",
    "textbox",
}

CORE_LOCATOR_NAMES = {
    "button": {
        "Create Account",
        "Login",
        "Sign In",
        "Sign Up",
    },
    "checkbox": {
        "Remember Me",
    },
    "messagebox": {
        "Error",
        "Registration Error",
    },
    "notification": {
        "Container",
        "Error",
        "Message",
        "Title",
    },
    "textbox": {
        "Confirm Password",
        "Email",
        "Email Address",
        "First Name",
        "Last Name",
        "Password",
        "Username",
    },
}


@dataclass
class LocatorEntry:
    """Single logical locator entry from a page __Locators.json file."""

    page_name: str
    page_aliases: tuple[str, ...]
    category: str
    name: str
    selector: str
    module: str
    source_file: str
    json_path: str
    normalized_text: str


def _stringify_locator_value(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    return json.dumps(value, ensure_ascii=True).strip()


def _dedupe_preserving_order(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        clean_value = str(value).strip()
        if not clean_value or clean_value in seen:
            continue
        seen.add(clean_value)
        result.append(clean_value)
    return result


def _coerce_aliases(value: Any) -> list[str]:
    if isinstance(value, list):
        return _dedupe_preserving_order([str(item) for item in value])
    if value:
        return _dedupe_preserving_order([str(value)])
    return []


def _choose_page_name(aliases: list[str], module_name: str) -> str:
    for alias in aliases:
        if "page" in alias.lower() and alias[:1].isupper():
            return alias
    for alias in aliases:
        if alias[:1].isupper():
            return alias
    return aliases[0] if aliases else module_name.replace("_", " ").title()


def _locator_entry_text(
    page_name: str,
    page_aliases: tuple[str, ...],
    category: str,
    name: str,
    selector: str,
    module: str,
) -> str:
    selector_text = re.sub(r"[^A-Za-z0-9]+", " ", selector)
    return normalize_text(
        " ".join(
            [
                module,
                page_name,
                " ".join(page_aliases),
                category,
                name,
                selector_text,
            ]
        ),
        remove_stops=True,
    )


def extract_locator_catalog(resource_root: Path) -> list[LocatorEntry]:
    """Extract logical locator names from every __Locators.json under Resource."""
    catalog: list[LocatorEntry] = []

    for locator_file in sorted(resource_root.rglob("__Locators.json")):
        content = json.loads(locator_file.read_text(encoding="utf-8"))
        if not isinstance(content, dict):
            continue

        module_name = locator_file.parent.name
        aliases = _coerce_aliases(content.get("page"))
        page_name = _choose_page_name(aliases, module_name)
        page_aliases = tuple(aliases or [page_name])
        root_selector = _stringify_locator_value(content.get("root", ""))
        catalog.append(
            LocatorEntry(
                page_name=page_name,
                page_aliases=page_aliases,
                category="page",
                name=page_name,
                selector=root_selector,
                module=module_name,
                source_file=str(locator_file),
                json_path="page",
                normalized_text=_locator_entry_text(
                    page_name,
                    page_aliases,
                    "page",
                    page_name,
                    root_selector,
                    module_name,
                ),
            )
        )

        for category, value in content.items():
            if category in {"meta", "page", "root"}:
                continue
            if category not in LOCATOR_CATEGORIES or not isinstance(value, dict):
                continue

            for entry_name, selector in value.items():
                name = str(entry_name).strip()
                selector_text = _stringify_locator_value(selector)
                if not name or not selector_text:
                    continue
                catalog.append(
                    LocatorEntry(
                        page_name=page_name,
                        page_aliases=page_aliases,
                        category=category,
                        name=name,
                        selector=selector_text,
                        module=module_name,
                        source_file=str(locator_file),
                        json_path=f"{category}.{name}",
                        normalized_text=_locator_entry_text(
                            page_name,
                            page_aliases,
                            category,
                            name,
                            selector_text,
                            module_name,
                        ),
                    )
                )

    return catalog


def _infer_keyword_locator_categories(keyword) -> list[str]:
    keyword_text = f"{keyword.keyword_name} {keyword.documentation} {keyword.arguments}".lower()
    categories = []
    for category in sorted(LOCATOR_CATEGORIES):
        if re.search(rf"\b{re.escape(category)}\b", keyword_text):
            categories.append(category)
    if re.search(r"\bpage\b", keyword_text):
        categories.append("page")
    return _dedupe_preserving_order(categories)


def format_tool_dictionary(scored_keywords, locator_context: list[LocatorEntry] | None = None) -> str:
    """Formats top mapped keywords into a readable dictionary for the LLM context."""
    lines = []
    lines.append("Robot Keyword Dictionary:")
    for score, keyword in scored_keywords:
        lines.append(f"- Keyword Name: {keyword.keyword_name}")
        if keyword.arguments:
            lines.append(f"  Arguments: {keyword.arguments}")
        if keyword.documentation:
            lines.append(f"  Documentation: {keyword.documentation}")
        locator_categories = _infer_keyword_locator_categories(keyword)
        if locator_categories:
            lines.append(f"  Locator argument categories: {', '.join(locator_categories)}")
        lines.append("")
    if locator_context:
        lines.append(format_locator_dictionary(locator_context))
    return "\n".join(lines)


def _locator_exact_match_boost(requirement_text: str, locator: LocatorEntry) -> float:
    requirement_lower = requirement_text.lower()
    boost = 0.0
    if locator.name.lower() in requirement_lower:
        boost += 0.18
    if locator.category in requirement_lower:
        boost += 0.08
    for alias in locator.page_aliases:
        if alias.lower() in requirement_lower:
            boost += 0.12
            break
    return min(boost, 0.28)


def map_locators_for_generation(
    requirement: RequirementEntry,
    locator_catalog: list[LocatorEntry],
    model,
    top_k: int,
    nlp_processor,
    ignore_quoted_text: bool = True,
) -> list[tuple[float, LocatorEntry]]:
    """Retrieve locator names relevant to a requirement for argument grounding."""
    if not locator_catalog:
        return []

    locator_texts = [
        entry.normalized_text
        or normalize_text(
            f"{entry.page_name} {' '.join(entry.page_aliases)} {entry.category} {entry.name}",
            remove_stops=True,
        )
        for entry in locator_catalog
    ]
    model.fit(locator_texts)
    locator_vectors = model.encode_many(locator_texts)

    requirement_mapping_text = requirement.requirement_text
    if nlp_processor is not None:
        processed = nlp_processor.preprocess_requirement_text(requirement.requirement_text)
        if processed.mapping_text:
            requirement_mapping_text = processed.mapping_text

    normalized_requirement = normalize_text(
        requirement_mapping_text,
        remove_stops=True,
        ignore_quoted_text=ignore_quoted_text,
    )
    requirement_vector = model.encode(normalized_requirement)

    scored: list[tuple[float, LocatorEntry]] = []
    for vector, locator in zip(locator_vectors, locator_catalog):
        locator_text = (
            f"{locator.page_name} {' '.join(locator.page_aliases)} "
            f"{locator.category} {locator.name} {locator.selector}"
        )
        semantic_score = dot_product(requirement_vector, vector)
        lexical_score = calculate_lexical_similarity(
            requirement_mapping_text,
            locator_text,
            ignore_quoted_text_source=ignore_quoted_text,
        )
        exact_boost = _locator_exact_match_boost(requirement_mapping_text, locator)
        score = max(0.0, (0.70 * semantic_score) + (0.30 * lexical_score) + exact_boost)
        scored.append((score, locator))

    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[:top_k]


def _is_core_locator(locator: LocatorEntry) -> bool:
    if locator.category == "page":
        return True
    return locator.name in CORE_LOCATOR_NAMES.get(locator.category, set())


def _merge_locator_context(
    locator_catalog: list[LocatorEntry],
    scored_locators: list[tuple[float, LocatorEntry]],
) -> list[LocatorEntry]:
    selected: list[LocatorEntry] = []
    seen = set()

    def add(locator: LocatorEntry) -> None:
        key = (locator.source_file, locator.category, locator.name)
        if key in seen:
            return
        seen.add(key)
        selected.append(locator)

    for locator in locator_catalog:
        if _is_core_locator(locator):
            add(locator)
    for _, locator in scored_locators:
        add(locator)

    return selected


def retrieve_locator_context_for_generation(
    requirement_text: str,
    locator_catalog: list[LocatorEntry],
    model,
    nlp_processor,
    top_k: int,
) -> list[LocatorEntry]:
    if not locator_catalog:
        return []
    requirement = RequirementEntry(
        req_id="RAG-LOCATOR",
        feature="General",
        requirement_text=requirement_text,
    )
    scored_locators = map_locators_for_generation(
        requirement=requirement,
        locator_catalog=locator_catalog,
        model=model,
        top_k=top_k,
        nlp_processor=nlp_processor,
        ignore_quoted_text=False,
    )
    return _merge_locator_context(locator_catalog, scored_locators)


def _append_name(category_map: dict[str, list[tuple[str, str]]], category: str, name: str, selector: str) -> None:
    entries = category_map.setdefault(category, [])
    if all(existing_name != name for existing_name, _ in entries):
        entries.append((name, selector))


def format_locator_dictionary(locator_context: list[LocatorEntry]) -> str:
    """Formats locator entries as allowed argument values for generated calls."""
    grouped: dict[str, dict[str, Any]] = {}
    for locator in locator_context:
        group = grouped.setdefault(
            locator.source_file,
            {
                "page_name": locator.page_name,
                "aliases": list(locator.page_aliases),
                "categories": {},
            },
        )
        if locator.category == "page":
            for alias in locator.page_aliases:
                if alias not in group["aliases"]:
                    group["aliases"].append(alias)
            continue
        _append_name(group["categories"], locator.category, locator.name, locator.selector)

    lines = [
        "Locator Argument Dictionary:",
        "- Use only these logical names as UI/page arguments.",
        "- Do not pass CSS selectors as arguments; selectors are shown only to prove the JSON source.",
        "- Locator entries are arguments, not callable Robot keywords.",
    ]
    for group in sorted(grouped.values(), key=lambda item: item["page_name"].lower()):
        alias_text = ", ".join(group["aliases"])
        lines.append(f"- Page: {group['page_name']}")
        lines.append(f"  Page arguments: {alias_text}")
        for category in sorted(group["categories"]):
            entries = group["categories"][category]
            entry_text = "; ".join(f"{name} => {selector}" for name, selector in entries)
            lines.append(f"  {category} arguments: {entry_text}")
    return "\n".join(lines)


def map_requirements_for_generation(requirements, catalog, model, top_k, semantic_weight, lexical_weight, nlp_processor, ignore_quoted_text=True):
    """Custom mapping loop to extract the raw Top-K scored candidates for LLM tuning."""
    keyword_texts = [
        entry.normalized_text or normalize_text(entry.keyword_name, remove_stops=True)
        for entry in catalog
    ]
    model.fit(keyword_texts)
    keyword_vectors = model.encode_many(keyword_texts)

    scored_details_list = []

    for requirement in requirements:
        requirement_mapping_text = requirement.requirement_text
        if nlp_processor is not None:
            processed = nlp_processor.preprocess_requirement_text(requirement.requirement_text)
            if processed.mapping_text:
                requirement_mapping_text = processed.mapping_text

        requirement_text = normalize_text(
            requirement_mapping_text,
            remove_stops=True,
            ignore_quoted_text=ignore_quoted_text,
        )
        requirement_vector = model.encode(requirement_text)

        scored = []
        for vector, keyword in zip(keyword_vectors, catalog):
            semantic_score = dot_product(requirement_vector, vector)
            lexical_score = calculate_lexical_similarity(
                requirement_mapping_text,
                f"{keyword.keyword_name} {keyword.documentation} {keyword.arguments}",
                ignore_quoted_text_source=ignore_quoted_text,
            )
            keyword_text = f"{keyword.keyword_name} {keyword.documentation}"
            element_boost = calculate_element_type_boost(requirement_mapping_text, keyword_text)
            disambiguation_penalty = calculate_disambiguation_penalty(requirement_mapping_text, keyword_text)

            base_score = (semantic_weight * semantic_score) + (lexical_weight * lexical_score)
            final_score = max(0.0, base_score + element_boost - disambiguation_penalty)

            scored.append((final_score, keyword))
        
        scored.sort(key=lambda item: item[0], reverse=True)
        scored_details_list.append(scored[:top_k])
        
    return scored_details_list

# Specially developed for Gherkin steps
def generate_robot_test(
    requirement_text: str,
    full_catalog: list,
    locator_catalog: list[LocatorEntry],
    model,
    nlp,
    client,
    top_k: int = 10,
    locator_top_k: int = 60,
    resource_root: Path | None = None,
) -> str:
    is_gherkin = bool(re.search(r'^\s*(Given|When|Then|And)\s', requirement_text, re.IGNORECASE | re.MULTILINE))
    
    if is_gherkin:
        from src.components.semantic.gherkin_support import GherkinStepMapper
        
        resource_dir = resource_root or Path("Resource")
        mapper = GherkinStepMapper.from_resource_root(resource_dir)
        
        mapped_lines = []
        for line in requirement_text.splitlines():
            line = line.strip()
            # when we pulling Gherkin test cases from sources, they will be saved as .feature files, and will be defined with @,#,senerios tags..., and we want to keep those lines as they are without mapping, as they are important for the structure of the feature files.
            if not line or line.startswith("#") or line.startswith("@") or line.lower().startswith("feature:") or line.lower().startswith("scenario:"):
                if line and not line.lower().startswith(("feature:", "scenario:", "@")):
                    pass
                else:
                    continue
                
            analysis = mapper.analyze_step(line)
            rendered_name, args, conf, src = mapper.map_step(analysis)
            
            if conf >= 0.85 or src == "rule":
                arg_str = "    ".join([rendered_name] + args)
                mapped_lines.append(arg_str)
            else:
                req_entries = [RequirementEntry(req_id="RAG-GEN", feature="General", requirement_text=line)]
                scored_details = map_requirements_for_generation(
                    requirements=req_entries,
                    catalog=full_catalog,
                    model=model,
                    top_k=top_k,
                    semantic_weight=0.85,
                    lexical_weight=0.15,
                    nlp_processor=nlp,
                    ignore_quoted_text=True
                )
                locator_context = retrieve_locator_context_for_generation(
                    line,
                    locator_catalog,
                    model,
                    nlp,
                    locator_top_k,
                )
                tool_dict_str = (
                    format_tool_dictionary(scored_details[0], locator_context)
                    if (scored_details and scored_details[0])
                    else "No tools available."
                )
                ai_generated = client.generate_gherkin_scenario_with_prompt(line, tool_dict_str)
                ai_generated = ai_generated.replace("```robot", "").replace("```gherkin", "").replace("```", "").strip()
                mapped_lines.extend([l.strip() for l in ai_generated.splitlines() if l.strip()])
                
        return "\n".join(["    " + line for line in mapped_lines])

    # NATURAL LANGUAGE PATH
    req_entries = [RequirementEntry(req_id="RAG-GEN", feature="General", requirement_text=requirement_text)]
    scored_details = map_requirements_for_generation(
        requirements=req_entries,
        catalog=full_catalog,
        model=model,
        top_k=top_k,
        semantic_weight=0.85,
        lexical_weight=0.15,
        nlp_processor=nlp,
        ignore_quoted_text=True
    )
    
    if not scored_details or not scored_details[0]:
        return "    Log To  Console    No keywords mapped."
        
    locator_context = retrieve_locator_context_for_generation(
        requirement_text,
        locator_catalog,
        model,
        nlp,
        locator_top_k,
    )
    tool_dict_str = format_tool_dictionary(scored_details[0], locator_context)
    generated_scenario = client.generate_natural_language_scenario_with_prompt(requirement_text, tool_dict_str)
    generated_scenario = generated_scenario.replace("```robot", "").replace("```gherkin", "").replace("```", "").strip()
    return "\n".join(["    " + line for line in generated_scenario.splitlines() if line.strip()])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Robot tests using Semantic Mapping and LLM")
    parser.add_argument("--requirement", type=str, help="Natural language requirement text")
    parser.add_argument("--input-file", type=str, help="Path to a text/csv file of requirements to batch run")
    parser.add_argument("--resource-root", type=str, default="Resource", help="Path to resource directory")
    parser.add_argument("--top-k", type=int, default=10, help="Number of keywords to fetch as context")
    parser.add_argument("--locator-top-k", type=int, default=60, help="Number of locator entries to fetch as argument context")
    parser.add_argument("--output", type=str, help="Output .robot file path")
    args = parser.parse_args()
    
    from dotenv import load_dotenv
    load_dotenv(project_root / ".env")
    
    if not args.requirement and not args.input_file:
        print("Error: Must provide either --requirement or --input-file")
        sys.exit(1)
    nlp = RequirementNLPProcessor(ignore_quoted_text=True)
    model = SentenceTransformerEmbeddingModel()
    try:
        client = GeminiClient()
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
        
    print(f"Extracting Keyword Context")
    resource_root = project_root / args.resource_root
    full_catalog = extract_keyword_catalog(resource_root)
    common_catalog = filter_catalog_by_scope(full_catalog, "common")
    locator_catalog = extract_locator_catalog(resource_root)
    print(f"Extracted {len(locator_catalog)} locator argument entries")
    
    requirements_to_process = []
    if args.input_file:
        input_path = project_root / args.input_file if not Path(args.input_file).is_absolute() else Path(args.input_file)
        print(f"Loading from file: {input_path}")
        reqs = load_requirements(input_path)
        requirements_to_process = reqs
    else:
        reqs = [RequirementEntry(req_id="RAG-GEN", feature="General", requirement_text=args.requirement)]
        requirements_to_process = reqs

    print(f"Generating {len(requirements_to_process)} test case(s)...")
    
    feature_name = Path(args.output).stem if args.output else "generated"
    # Really important import 
    robot_code = f"*** Settings ***\nDocumentation    Generated feature tests from RAG Pipeline.\nResource    ./{feature_name}.resource\n\n*** Test Cases ***\n"
    resource_code = f"*** Settings ***\nDocumentation    Auto-generated executable resource.\nResource    ../Resource/MainLib.resource\n\n*** Keywords ***\n"
    
    for idx, req in enumerate(requirements_to_process, 1):
        req_text = req.requirement_text
        print(f"   Processing [{idx}/{len(requirements_to_process)}]")
        try:
            output_steps = generate_robot_test(
                req_text,
                common_catalog,
                locator_catalog,
                model,
                nlp,
                client,
                args.top_k,
                args.locator_top_k,
                resource_root,
            )
            test_name = f"Test Case {idx}: {req.feature}" if req.feature and req.feature != "General" else f"Test Case {idx}: Auto-Generated"
            
            # Format documentation to handle multi-line Feature tests
            doc_lines = req_text.splitlines()
            doc_block = f"    [Documentation]    {doc_lines[0]}\n"
            for dline in doc_lines[1:]:
                doc_block += f"    ...    {dline}\n"
                
            robot_code = robot_code + f"{test_name}\n{doc_block}    [Setup]    Open Browser Session\n"
            
            step_lines = output_steps.splitlines()
            for i, raw_step in enumerate(step_lines, 1):
                step = raw_step.strip()
                if not step: continue
                # We extract the first word logic to make a nice name
                keyword_alias = f"{idx:02d}_{i:02d}: AI Generative Step" 
                
                robot_code=robot_code + f"    {keyword_alias}\n"
                resource_code= resource_code + f"{keyword_alias}\n    [Documentation]    Execute source step\n    {step}\n\n"
                
            robot_code = robot_code + "    [Teardown]    Close Browser Session\n\n"
            
        except Exception as e:
            error_msg = str(e)
            print(f"   ! Error generating for requirement {idx}: {error_msg}")
            robot_code = robot_code + "Test Case {}: Auto-Generated\n    [Documentation]    {}\n    Log    GENERATION FAILED: {}\n\n".format(idx, req_text, error_msg)
            
    if args.output:
        out_path = Path(args.output)
        if not out_path.is_absolute():
            out_path = project_root / out_path
            
        print(f"Output: {out_path}")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(robot_code, encoding="utf-8")
        
        resource_path = out_path.with_suffix(".resource")
        resource_path.write_text(resource_code, encoding="utf-8")
