#!/usr/bin/env python3
"""Modular RAG pipeline that bridges semantic mapping with generative LLM."""

import argparse
import sys
import os
from pathlib import Path
import re
import sys

project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.append(str(project_root))

from src.components.semantic.nlp_processor import RequirementNLPProcessor
from src.components.semantic.semantic_mapper import (
    LocalEmbeddingModel,
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

def format_tool_dictionary(scored_keywords) -> str:
    """Formats top mapped keywords into a readable dictionary for the LLM context."""
    lines = []
    for score, keyword in scored_keywords:
        lines.append(f"- Keyword Name: {keyword.keyword_name}")
        if keyword.arguments:
            lines.append(f"  Arguments: {keyword.arguments}")
        if keyword.documentation:
            lines.append(f"  Documentation: {keyword.documentation}")
        lines.append("")
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
def generate_robot_test(requirement_text: str, full_catalog: list, model, nlp, client, top_k: int = 10) -> str:
    is_gherkin = bool(re.search(r'^\s*(Given|When|Then|And)\s', requirement_text, re.IGNORECASE | re.MULTILINE))
    
    if is_gherkin:
        from src.components.semantic.gherkin_support import GherkinStepMapper
        
        resource_dir = Path("Resource")  # Defaulting, or could pass from arg
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
                tool_dict_str = format_tool_dictionary(scored_details[0]) if (scored_details and scored_details[0]) else "No tools available."
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
        
    tool_dict_str = format_tool_dictionary(scored_details[0])
    generated_scenario = client.generate_natural_language_scenario_with_prompt(requirement_text, tool_dict_str)
    generated_scenario = generated_scenario.replace("```robot", "").replace("```gherkin", "").replace("```", "").strip()
    return "\n".join(["    " + line for line in generated_scenario.splitlines() if line.strip()])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Robot tests using Semantic Mapping and LLM")
    parser.add_argument("--requirement", type=str, help="Natural language requirement text")
    parser.add_argument("--input-file", type=str, help="Path to a text/csv file of requirements to batch run")
    parser.add_argument("--resource-root", type=str, default="Resource", help="Path to resource directory")
    parser.add_argument("--top-k", type=int, default=10, help="Number of keywords to fetch as context")
    parser.add_argument("--output", type=str, help="Output .robot file path")
    args = parser.parse_args()
    
    from dotenv import load_dotenv
    load_dotenv(project_root / ".env")
    
    if not args.requirement and not args.input_file:
        print("Error: Must provide either --requirement or --input-file")
        sys.exit(1)
    nlp = RequirementNLPProcessor(ignore_quoted_text=True)
    model = LocalEmbeddingModel()
    try:
        client = GeminiClient()
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
        
    print(f"Extracting Keyword Context")
    full_catalog = extract_keyword_catalog(project_root / args.resource_root)
    common_catalog = filter_catalog_by_scope(full_catalog, "common")
    
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
            output_steps = generate_robot_test(req_text, common_catalog, model, nlp, client, args.top_k)
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
                keyword_alias = f"{idx:02d}_{i:02d}: RAG Generative Step" 
                
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
