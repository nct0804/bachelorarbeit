#!/usr/bin/env python3
"""Requirement-to-keyword semantic mapping for Robot Framework resources.

This tool maps free-form requirements to executable project keywords using:
- semantic similarity (embedding-based)
- lexical similarity (wording overlap)
- optional NLP preprocessing for requirement type and action extraction
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import importlib.util
import json
import math
import re
import sys
from collections import Counter
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable

try:
    from sentence_transformers import SentenceTransformer

    SENTENCE_TRANSFORMERS_AVAILABLE = True
except Exception:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None


TEXT_SPLIT_PATTERN = re.compile(r"[^a-z0-9]+")
PLACEHOLDER_PATTERN = re.compile(r"[$@&]\{([^}]+)\}")
MULTI_SPACE_PATTERN = re.compile(r"\s+")
LIST_PREFIX_PATTERN = re.compile(r"^\s*(?:[-*•]|\d+[.)])\s+")
MIN_REQUIREMENT_CHARS = 8
OPTIONAL_STOPS = {
    "as",
    "the",
    "a",
    "an",
    "is",
    "are",
    "be",
    "should",
    "can",
    "on",
    "to",
    "of",
    "for",
    "with",
    "using",
    "and",
    "or",
    "my",
    "user",
    "want",
    "wants",
    "perform",
    "please",
    "can",
    "could",
    "would",
    "must",
    "need",
}
DEFAULT_PHRASE_MAP: dict[str, str] = {}
ACTIVE_PHRASE_MAP: dict[str, str] = dict(DEFAULT_PHRASE_MAP)


@dataclass
class KeywordEntry:
    keyword_name: str
    tag_type: str
    module: str
    source_file: str
    documentation: str
    arguments: str
    normalized_text: str


@dataclass
class RequirementEntry:
    req_id: str
    feature: str
    requirement_text: str


class LocalEmbeddingModel:
    """Deterministic local embedding model with hashing + IDF weighting."""

    def __init__(self, dimension: int = 384) -> None:
        if dimension <= 0:
            raise ValueError("Embedding dimension must be positive.")
        self.dimension = dimension
        self.idf_by_token: dict[str, float] = {}
        self.default_idf = 1.0

    def fit(self, texts: Iterable[str]) -> None:
        text_list = list(texts)
        if not text_list:
            return
        doc_count = len(text_list)
        token_document_frequency: Counter[str] = Counter()
        for text in text_list:
            tokens = set(tokenize(text))
            for token in tokens:
                token_document_frequency[token] += 1

        self.idf_by_token = {}
        for token, frequency in token_document_frequency.items():
            self.idf_by_token[token] = math.log((1 + doc_count) / (1 + frequency)) + 1.0
        self.default_idf = math.log(1 + doc_count) + 1.0

    def encode_many(self, texts: Iterable[str]) -> list[list[float]]:
        return [self.encode(text) for text in texts]

    def encode(self, text: str) -> list[float]:
        vector = [0.0] * self.dimension
        token_counts = Counter(tokenize(text))
        if not token_counts:
            return vector

        for token, count in token_counts.items():
            index_hash = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
            sign_hash = hashlib.blake2b(
                f"sign::{token}".encode("utf-8"),
                digest_size=8,
            ).digest()

            index = int.from_bytes(index_hash, "big") % self.dimension
            sign = -1.0 if int.from_bytes(sign_hash, "big") % 2 else 1.0
            idf = self.idf_by_token.get(token, self.default_idf)
            vector[index] += sign * float(count) * idf

        return normalize_vector(vector)


class SentenceTransformerEmbeddingModel:
    """Embedding model backed by sentence-transformers."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise RuntimeError("sentence-transformers is not installed in this environment.")
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def fit(self, texts: Iterable[str]) -> None:
        # SentenceTransformer model is pre-trained; no corpus fitting required.
        _ = texts

    def encode_many(self, texts: Iterable[str]) -> list[list[float]]:
        text_list = list(texts)
        if not text_list:
            return []
        vectors = self.model.encode(text_list, normalize_embeddings=True)
        return [vector.tolist() for vector in vectors]

    def encode(self, text: str) -> list[float]:
        vector = self.model.encode([text], normalize_embeddings=True)[0]
        return vector.tolist()


def normalize_text(text: str, remove_stops: bool = False) -> str:
    text = PLACEHOLDER_PATTERN.sub(r" \1 ", str(text))
    text = text.lower()
    text = apply_phrase_map(text)
    text = TEXT_SPLIT_PATTERN.sub(" ", text)
    text = MULTI_SPACE_PATTERN.sub(" ", text).strip()
    if not remove_stops:
        return text
    filtered = [token for token in text.split() if token not in OPTIONAL_STOPS]
    return " ".join(filtered)


def tokenize(text: str) -> list[str]:
    cleaned = normalize_text(text, remove_stops=True)
    return [token for token in cleaned.split(" ") if token]


def apply_phrase_map(text: str) -> str:
    mapped_text = text
    # Replace longer phrases first to avoid partial overlaps.
    ordered_pairs = sorted(ACTIVE_PHRASE_MAP.items(), key=lambda item: len(item[0]), reverse=True)
    for source, target in ordered_pairs:
        if not source.strip():
            continue
        pattern = r"\b" + re.escape(source.strip().lower()) + r"\b"
        mapped_text = re.sub(pattern, target.strip().lower(), mapped_text)
    return mapped_text


def load_requirement_nlp_processor_class():
    """Dynamically load RequirementNLPProcessor from sibling module."""
    semantic_dir = Path(__file__).resolve().parent
    candidate_paths = [
        semantic_dir / "nlp_processor.py",
        semantic_dir.parent / "nlp_processor.py",
    ]
    module_path = None
    for candidate in candidate_paths:
        if candidate.exists():
            module_path = candidate
            break
    if module_path is None:
        return None
    spec = importlib.util.spec_from_file_location("project_nlp_processor", module_path)
    if spec is None or spec.loader is None:
        return None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return getattr(module, "RequirementNLPProcessor", None)


def load_default_phrase_map_from_nlp() -> dict[str, str]:
    processor_class = load_requirement_nlp_processor_class()
    if processor_class is None:
        return dict(DEFAULT_PHRASE_MAP)
    try:
        processor = processor_class()
    except Exception:
        return dict(DEFAULT_PHRASE_MAP)
    phrase_map = getattr(processor, "phrase_map", None)
    if isinstance(phrase_map, dict):
        return dict(phrase_map)
    return dict(DEFAULT_PHRASE_MAP)


def parse_argument_tokens(argument_line: str) -> list[str]:
    if not argument_line:
        return []
    return [token.strip() for token in re.split(r"\s{2,}", argument_line) if token.strip()]


def extract_embedded_argument_tokens(keyword_name: str) -> list[str]:
    return [f"${{{token}}}" for token in PLACEHOLDER_PATTERN.findall(keyword_name)]


def merge_argument_tokens(*groups: Iterable[str]) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for group in groups:
        for token in group:
            normalized = token.strip()
            if not normalized:
                continue
            key = normalized.lower()
            if key in seen:
                continue
            seen.add(key)
            merged.append(normalized)
    return merged


def resolve_tag_type(resource_path: Path, tags: Iterable[str]) -> str:
    lowered = {tag.strip().lower() for tag in tags if tag.strip()}
    if "gherkin" in lowered or "bdd" in lowered:
        return "Gherkin"
    if "basic" in lowered:
        return "Basic"
    path_parts = {part.lower() for part in resource_path.parts}
    if "common" in path_parts:
        return "Basic"
    if "modules" in path_parts:
        return "Module"
    return "Keyword"


def normalize_vector(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


def dot_product(vector_a: list[float], vector_b: list[float]) -> float:
    return sum(a * b for a, b in zip(vector_a, vector_b))


def calculate_lexical_similarity(source: str, target: str) -> float:
    source_clean = normalize_text(source, remove_stops=True)
    target_clean = normalize_text(target, remove_stops=True)
    if not source_clean or not target_clean:
        return 0.0

    sequence_score = SequenceMatcher(None, source_clean, target_clean).ratio()
    source_tokens = set(source_clean.split())
    target_tokens = set(target_clean.split())
    intersection = source_tokens.intersection(target_tokens)
    union = source_tokens.union(target_tokens)
    jaccard_score = (len(intersection) / len(union)) if union else 0.0
    return (0.6 * sequence_score) + (0.4 * jaccard_score)


def parse_robot_keywords(resource_path: Path) -> list[KeywordEntry]:
    entries: list[KeywordEntry] = []
    lines = resource_path.read_text(encoding="utf-8").splitlines()

    in_keywords_section = False
    current_keyword_name = ""
    current_documentation = ""
    current_argument_tokens: list[str] = []
    current_tags: list[str] = []

    def flush_keyword() -> None:
        nonlocal current_keyword_name
        nonlocal current_documentation
        nonlocal current_argument_tokens
        nonlocal current_tags

        if not current_keyword_name:
            return

        tag_type = resolve_tag_type(resource_path, current_tags)
        embedded_arguments = extract_embedded_argument_tokens(current_keyword_name)
        merged_arguments = merge_argument_tokens(embedded_arguments, current_argument_tokens)
        arguments_text = " ".join(merged_arguments).strip()

        module_name = resource_path.parent.name
        normalized_keyword_text = normalize_text(
            f"{current_keyword_name} {current_documentation} {arguments_text}",
            remove_stops=True,
        )
        entries.append(
            KeywordEntry(
                keyword_name=current_keyword_name,
                tag_type=tag_type,
                module=module_name,
                source_file=str(resource_path),
                documentation=current_documentation,
                arguments=arguments_text,
                normalized_text=normalized_keyword_text,
            )
        )
        current_keyword_name = ""
        current_documentation = ""
        current_argument_tokens = []
        current_tags = []

    for raw_line in lines:
        line = raw_line.rstrip("\n")
        stripped = line.strip()

        if stripped.startswith("***"):
            flush_keyword()
            in_keywords_section = stripped.lower() == "*** keywords ***"
            continue

        if not in_keywords_section:
            continue
        if not stripped:
            continue
        if line.startswith("#"):
            continue

        is_keyword_header = not line.startswith(" ") and not line.startswith("\t")
        if is_keyword_header:
            flush_keyword()
            current_keyword_name = stripped
            continue

        if not current_keyword_name:
            continue

        if stripped.startswith("[Documentation]"):
            current_documentation = stripped.replace("[Documentation]", "", 1).strip()
            continue
        if stripped.startswith("[Arguments]"):
            argument_line = stripped.replace("[Arguments]", "", 1).strip()
            current_argument_tokens.extend(parse_argument_tokens(argument_line))
            continue
        if stripped.startswith("[Tags]"):
            raw_tags = stripped.replace("[Tags]", "", 1).strip()
            split_tags = [tag.strip() for tag in re.split(r"\s{2,}", raw_tags) if tag.strip()]
            current_tags.extend(split_tags)

    flush_keyword()
    return entries


def extract_keyword_catalog(resource_root: Path) -> list[KeywordEntry]:
    catalog: list[KeywordEntry] = []
    for resource_file in sorted(resource_root.rglob("*.resource")):
        if resource_file.name == "__lib.resource":
            continue
        catalog.extend(parse_robot_keywords(resource_file))
    return catalog


def load_requirements(
    requirement_path: Path,
    requirement_text_field: str | None = None,
    requirement_id_prefix: str = "REQ",
) -> list[RequirementEntry]:
    suffix = requirement_path.suffix.lower()
    if suffix in {".txt", ".md"}:
        return load_requirements_from_text(
            requirement_path=requirement_path,
            requirement_id_prefix=requirement_id_prefix,
        )
    if suffix == ".json":
        return load_requirements_from_json(
            requirement_path=requirement_path,
            requirement_text_field=requirement_text_field,
            requirement_id_prefix=requirement_id_prefix,
        )
    if suffix == ".csv":
        return load_requirements_from_csv(
            requirement_path=requirement_path,
            requirement_text_field=requirement_text_field,
            requirement_id_prefix=requirement_id_prefix,
        )
    return load_requirements_from_text(
        requirement_path=requirement_path,
        requirement_id_prefix=requirement_id_prefix,
    )


def load_requirements_from_csv(
    requirement_path: Path,
    requirement_text_field: str | None = None,
    requirement_id_prefix: str = "REQ",
) -> list[RequirementEntry]:
    with requirement_path.open("r", encoding="utf-8") as file_handle:
        reader = csv.DictReader(file_handle)
        rows = list(reader)
        fieldnames = list(reader.fieldnames or [])
    if not fieldnames:
        return load_requirements_from_text(
            requirement_path=requirement_path,
            requirement_id_prefix=requirement_id_prefix,
        )
    requirements: list[RequirementEntry] = []
    for index, row in enumerate(rows, start=1):
        req_id = first_value(
            row,
            ["REQ_ID", "requirement_id", "id", "key", "REQ-KEY"],
            fallback=f"{requirement_id_prefix}-{index:03d}",
        )
        feature = first_value(
            row,
            ["FEATURE", "feature", "module", "epic"],
            fallback="General",
        )
        text = extract_requirement_text(row=row, preferred_field=requirement_text_field)
        if not text.strip():
            continue
        requirements.append(
            RequirementEntry(
                req_id=req_id,
                feature=feature,
                requirement_text=text.strip(),
            )
        )
    if requirements:
        return requirements
    return load_requirements_from_text(
        requirement_path=requirement_path,
        requirement_id_prefix=requirement_id_prefix,
    )


def load_requirements_from_json(
    requirement_path: Path,
    requirement_text_field: str | None = None,
    requirement_id_prefix: str = "REQ",
) -> list[RequirementEntry]:
    content = json.loads(requirement_path.read_text(encoding="utf-8"))
    if isinstance(content, dict):
        content = [content]
    if not isinstance(content, list):
        raise ValueError("JSON requirement dataset must be a list of objects.")
    requirements: list[RequirementEntry] = []
    for index, row in enumerate(content, start=1):
        if isinstance(row, str):
            cleaned = clean_requirement_line(row)
            if cleaned:
                requirements.append(
                    RequirementEntry(
                        req_id=f"{requirement_id_prefix}-{index:03d}",
                        feature="General",
                        requirement_text=cleaned,
                    )
                )
            continue
        if not isinstance(row, dict):
            continue
        req_id = first_value(
            row,
            ["REQ_ID", "requirement_id", "id", "key", "REQ-KEY"],
            fallback=f"{requirement_id_prefix}-{index:03d}",
        )
        feature = first_value(
            row,
            ["FEATURE", "feature", "module", "epic"],
            fallback="General",
        )
        text = extract_requirement_text(row=row, preferred_field=requirement_text_field)
        if not text.strip():
            continue
        requirements.append(
            RequirementEntry(
                req_id=req_id,
                feature=feature,
                requirement_text=text.strip(),
            )
        )
    if requirements:
        return requirements
    return load_requirements_from_text(
        requirement_path=requirement_path,
        requirement_id_prefix=requirement_id_prefix,
    )


def load_requirements_from_text(
    requirement_path: Path,
    requirement_id_prefix: str = "REQ",
) -> list[RequirementEntry]:
    content = requirement_path.read_text(encoding="utf-8")
    raw_lines = content.splitlines()
    requirements: list[RequirementEntry] = []
    index = 1
    for line in raw_lines:
        cleaned = clean_requirement_line(line)
        if not cleaned:
            continue
        requirements.append(
            RequirementEntry(
                req_id=f"{requirement_id_prefix}-{index:03d}",
                feature="General",
                requirement_text=cleaned,
            )
        )
        index += 1
    return requirements


def clean_requirement_line(line: str) -> str:
    text = LIST_PREFIX_PATTERN.sub("", str(line)).strip()
    text = MULTI_SPACE_PATTERN.sub(" ", text)
    if len(text) < MIN_REQUIREMENT_CHARS:
        return ""
    if text.startswith("#"):
        return ""
    return text


def extract_requirement_text(row: dict, preferred_field: str | None = None) -> str:
    if preferred_field and preferred_field in row:
        candidate = str(row.get(preferred_field, "")).strip()
        if candidate:
            return candidate
    candidate = first_value(
        row,
        ["REQUIREMENT_TEXT", "requirement", "text", "title", "description", "story", "user_story"],
        fallback="",
    )
    if candidate:
        return candidate

    # Fallback for free-form tabular input: use the longest textual cell.
    text_cells: list[str] = []
    for value in row.values():
        if value is None:
            continue
        string_value = str(value).strip()
        if len(string_value) >= MIN_REQUIREMENT_CHARS:
            text_cells.append(string_value)
    if not text_cells:
        return ""
    return sorted(text_cells, key=len, reverse=True)[0]


def first_value(row: dict, keys: list[str], fallback: str) -> str:
    for key in keys:
        if key in row and row[key] is not None and str(row[key]).strip():
            return str(row[key]).strip()
    return fallback


def save_keyword_catalog(catalog: list[KeywordEntry], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.writer(file_handle)
        writer.writerow(
            [
                "KEYWORD_NAME",
                "TAG_TYPE",
                "MODULE",
                "SOURCE_FILE",
                "DOCUMENTATION",
                "ARGUMENTS",
                "NORMALIZED_TEXT",
            ]
        )
        for entry in catalog:
            writer.writerow(
                [
                    entry.keyword_name,
                    entry.tag_type,
                    entry.module,
                    entry.source_file,
                    entry.documentation,
                    entry.arguments,
                    entry.normalized_text,
                ]
            )


def filter_catalog_to_executable(catalog: list[KeywordEntry]) -> list[KeywordEntry]:
    return [entry for entry in catalog if entry.tag_type.lower() != "gherkin"]


def map_requirements(
    requirements: list[RequirementEntry],
    catalog: list[KeywordEntry],
    model: LocalEmbeddingModel,
    top_k: int,
    strong_threshold: float,
    review_threshold: float,
    semantic_weight: float,
    lexical_weight: float,
    nlp_processor=None,
) -> tuple[list[dict], list[dict]]:
    keyword_texts = [entry.normalized_text or normalize_text(entry.keyword_name, remove_stops=True) for entry in catalog]
    model.fit(keyword_texts)
    keyword_vectors = model.encode_many(keyword_texts)

    mapping_rows: list[dict] = []
    unmapped_rows: list[dict] = []

    for requirement in requirements:
        requirement_type = "general_requirement"
        nlp_actions_text = ""
        requirement_mapping_text = requirement.requirement_text
        if nlp_processor is not None:
            processed = nlp_processor.preprocess_requirement_text(requirement.requirement_text)
            requirement_type = processed.requirement_type
            nlp_actions_text = " | ".join(action.action_text for action in processed.actions)
            if processed.mapping_text:
                requirement_mapping_text = processed.mapping_text

        requirement_text = normalize_text(requirement_mapping_text, remove_stops=True)
        requirement_vector = model.encode(requirement_text)

        scored: list[tuple[float, KeywordEntry]] = []
        detailed_scores: list[tuple[float, float, float, KeywordEntry]] = []
        for vector, keyword in zip(keyword_vectors, catalog):
            semantic_score = dot_product(requirement_vector, vector)
            lexical_score = calculate_lexical_similarity(
                requirement_mapping_text,
                f"{keyword.keyword_name} {keyword.documentation} {keyword.arguments}",
            )
            final_score = (semantic_weight * semantic_score) + (lexical_weight * lexical_score)
            detailed_scores.append((final_score, semantic_score, lexical_score, keyword))
            scored.append((final_score, keyword))
        detailed_scores.sort(key=lambda item: item[0], reverse=True)
        scored.sort(key=lambda item: item[0], reverse=True)
        top_matches = scored[:top_k]

        best_score = top_matches[0][0] if top_matches else 0.0
        status = "NO_MATCH"
        if best_score >= strong_threshold:
            status = "AUTO_SUGGEST"
        elif best_score >= review_threshold:
            status = "NEEDS_REVIEW"

        row: dict[str, str] = {
            "REQ_ID": requirement.req_id,
            "FEATURE": requirement.feature,
            "REQUIREMENT_TEXT": requirement.requirement_text,
            "REQUIREMENT_TYPE": requirement_type,
            "NLP_ACTIONS": nlp_actions_text,
            "STATUS": status,
        }
        for rank, (score, keyword) in enumerate(top_matches, start=1):
            semantic_score = 0.0
            lexical_score = 0.0
            for current_final, current_semantic, current_lexical, current_keyword in detailed_scores:
                if current_keyword is keyword and abs(current_final - score) < 1e-9:
                    semantic_score = current_semantic
                    lexical_score = current_lexical
                    break
            row[f"MATCH_{rank}_KEYWORD"] = keyword.keyword_name
            row[f"MATCH_{rank}_TAG"] = keyword.tag_type
            row[f"MATCH_{rank}_MODULE"] = keyword.module
            row[f"MATCH_{rank}_SOURCE"] = keyword.source_file
            row[f"MATCH_{rank}_SEMANTIC"] = f"{semantic_score:.4f}"
            row[f"MATCH_{rank}_LEXICAL"] = f"{lexical_score:.4f}"
            row[f"MATCH_{rank}_SCORE"] = f"{score:.4f}"
        mapping_rows.append(row)

        if status == "NO_MATCH":
            unmapped_rows.append(
                {
                    "REQ_ID": requirement.req_id,
                    "FEATURE": requirement.feature,
                    "REQUIREMENT_TEXT": requirement.requirement_text,
                    "REQUIREMENT_TYPE": requirement_type,
                    "NLP_ACTIONS": nlp_actions_text,
                    "BEST_SCORE": f"{best_score:.4f}",
                }
            )

    return mapping_rows, unmapped_rows


def write_mapping_csv(rows: list[dict], output_path: Path, top_k: int) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    headers = [
        "REQ_ID",
        "FEATURE",
        "REQUIREMENT_TEXT",
        "REQUIREMENT_TYPE",
        "NLP_ACTIONS",
        "STATUS",
    ]
    for rank in range(1, top_k + 1):
        headers.extend(
            [
                f"MATCH_{rank}_KEYWORD",
                f"MATCH_{rank}_TAG",
                f"MATCH_{rank}_MODULE",
                f"MATCH_{rank}_SOURCE",
                f"MATCH_{rank}_SEMANTIC",
                f"MATCH_{rank}_LEXICAL",
                f"MATCH_{rank}_SCORE",
            ]
        )
    with output_path.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_unmapped_csv(rows: list[dict], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    headers = [
        "REQ_ID",
        "FEATURE",
        "REQUIREMENT_TEXT",
        "REQUIREMENT_TYPE",
        "NLP_ACTIONS",
        "BEST_SCORE",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_summary_markdown(
    mapping_rows: list[dict],
    catalog_size: int,
    requirements_size: int,
    output_path: Path,
    embedding_backend: str,
    semantic_weight: float,
    lexical_weight: float,
    nlp_enabled: bool,
) -> None:
    status_counter = Counter(row.get("STATUS", "UNKNOWN") for row in mapping_rows)
    type_counter = Counter(row.get("REQUIREMENT_TYPE", "unknown") for row in mapping_rows)
    lines = [
        "# Semantic Mapping Summary",
        "",
        f"- Total requirements: {requirements_size}",
        f"- Total keywords in scope: {catalog_size}",
        f"- Auto suggest: {status_counter.get('AUTO_SUGGEST', 0)}",
        f"- Needs review: {status_counter.get('NEEDS_REVIEW', 0)}",
        f"- No match: {status_counter.get('NO_MATCH', 0)}",
        f"- Embedding backend: {embedding_backend}",
        f"- Semantic weight: {semantic_weight:.2f}",
        f"- Lexical weight: {lexical_weight:.2f}",
        f"- NLP preprocessing: {'enabled' if nlp_enabled else 'disabled'}",
        "",
        "## Requirement Type Distribution",
        f"- user_story: {type_counter.get('user_story', 0)}",
        f"- functional_requirement: {type_counter.get('functional_requirement', 0)}",
        f"- bug_report: {type_counter.get('bug_report', 0)}",
        f"- general_requirement: {type_counter.get('general_requirement', 0)}",
        "",
        "## Notes",
        "- `AUTO_SUGGEST`: best score >= strong threshold.",
        "- `NEEDS_REVIEW`: best score between review and strong threshold.",
        "- `NO_MATCH`: best score below review threshold.",
    ]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Map requirement texts to Robot Framework keywords using local embeddings.",
    )
    parser.add_argument(
        "--requirements",
        required=True,
        help="Path to requirement dataset (TXT, MD, CSV, or JSON).",
    )
    parser.add_argument(
        "--resource-root",
        default="Resource",
        help="Root directory containing Robot resource files.",
    )
    parser.add_argument(
        "--output-dir",
        default="Results/semantic-mapping",
        help="Directory for generated catalog and mapping reports.",
    )
    parser.add_argument(
        "--requirement-text-field",
        default=None,
        help="Optional CSV/JSON field name that contains requirement text.",
    )
    parser.add_argument(
        "--requirement-id-prefix",
        default="REQ",
        help="ID prefix used for generated requirement IDs in free-form input.",
    )
    parser.add_argument(
        "--disable-nlp-preprocess",
        action="store_true",
        help="Disable NLP preprocessing of free-form requirements.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=3,
        help="Top K keyword matches per requirement.",
    )
    parser.add_argument(
        "--embedding-dim",
        type=int,
        default=384,
        help="Vector dimension for local hashing embedding model.",
    )
    parser.add_argument(
        "--embedding-backend",
        default="auto",
        choices=["auto", "local", "sentence-transformers"],
        help="Embedding backend. 'auto' prefers sentence-transformers if available.",
    )
    parser.add_argument(
        "--sentence-model",
        default="all-MiniLM-L6-v2",
        help="SentenceTransformer model name used when backend is sentence-transformers.",
    )
    parser.add_argument(
        "--semantic-weight",
        type=float,
        default=0.85,
        help="Weight for embedding similarity in final score.",
    )
    parser.add_argument(
        "--lexical-weight",
        type=float,
        default=0.15,
        help="Weight for lexical similarity in final score.",
    )
    parser.add_argument(
        "--strong-threshold",
        type=float,
        default=0.45,
        help="Score threshold for AUTO_SUGGEST.",
    )
    parser.add_argument(
        "--review-threshold",
        type=float,
        default=0.30,
        help="Score threshold for NEEDS_REVIEW.",
    )
    return parser


def build_embedding_model(
    backend: str,
    sentence_model: str,
    embedding_dim: int,
) -> tuple[object, str]:
    normalized_backend = backend.strip().lower()
    if normalized_backend == "sentence-transformers":
        return SentenceTransformerEmbeddingModel(model_name=sentence_model), "sentence-transformers"
    if normalized_backend == "local":
        return LocalEmbeddingModel(dimension=embedding_dim), "local"

    if SENTENCE_TRANSFORMERS_AVAILABLE:
        try:
            return SentenceTransformerEmbeddingModel(model_name=sentence_model), "sentence-transformers"
        except Exception:
            pass
    return LocalEmbeddingModel(dimension=embedding_dim), "local"


def main() -> int:
    parser = build_argument_parser()
    args = parser.parse_args()

    requirements_path = Path(args.requirements)
    resource_root = Path(args.resource_root)
    output_dir = Path(args.output_dir)

    if not requirements_path.exists():
        raise SystemExit(f"Requirement dataset not found: {requirements_path}")
    if not resource_root.exists():
        raise SystemExit(f"Resource root not found: {resource_root}")
    if args.top_k <= 0:
        raise SystemExit("--top-k must be a positive integer.")
    if args.review_threshold > args.strong_threshold:
        raise SystemExit("--review-threshold must be less than or equal to --strong-threshold.")
    if args.semantic_weight < 0 or args.lexical_weight < 0:
        raise SystemExit("Similarity weights must be non-negative.")
    if args.semantic_weight == 0 and args.lexical_weight == 0:
        raise SystemExit("At least one of --semantic-weight or --lexical-weight must be > 0.")

    global ACTIVE_PHRASE_MAP
    ACTIVE_PHRASE_MAP = load_default_phrase_map_from_nlp()

    nlp_processor = None
    nlp_enabled = not args.disable_nlp_preprocess
    if nlp_enabled:
        processor_class = load_requirement_nlp_processor_class()
        if processor_class is not None:
            nlp_processor = processor_class(phrase_map=ACTIVE_PHRASE_MAP)
        else:
            nlp_enabled = False

    requirements = load_requirements(
        requirement_path=requirements_path,
        requirement_text_field=args.requirement_text_field,
        requirement_id_prefix=args.requirement_id_prefix,
    )
    if not requirements:
        raise SystemExit("No valid requirements found in the input dataset.")

    catalog = extract_keyword_catalog(resource_root)
    if not catalog:
        raise SystemExit("No keywords found under the resource root.")

    scoped_catalog = filter_catalog_to_executable(catalog)
    if not scoped_catalog:
        raise SystemExit("No executable keywords found under the resource root.")

    model, embedding_backend = build_embedding_model(
        backend=args.embedding_backend,
        sentence_model=args.sentence_model,
        embedding_dim=args.embedding_dim,
    )
    total_weight = args.semantic_weight + args.lexical_weight
    semantic_weight = args.semantic_weight / total_weight
    lexical_weight = args.lexical_weight / total_weight

    mapping_rows, unmapped_rows = map_requirements(
        requirements=requirements,
        catalog=scoped_catalog,
        model=model,
        top_k=args.top_k,
        strong_threshold=args.strong_threshold,
        review_threshold=args.review_threshold,
        semantic_weight=semantic_weight,
        lexical_weight=lexical_weight,
        nlp_processor=nlp_processor,
    )

    keyword_catalog_path = output_dir / "keyword_catalog.csv"
    mapping_report_path = output_dir / "mapping_report.csv"
    unmapped_report_path = output_dir / "unmapped_requirements.csv"
    summary_path = output_dir / "summary.md"

    save_keyword_catalog(scoped_catalog, keyword_catalog_path)
    write_mapping_csv(mapping_rows, mapping_report_path, args.top_k)
    write_unmapped_csv(unmapped_rows, unmapped_report_path)
    write_summary_markdown(
        mapping_rows=mapping_rows,
        catalog_size=len(scoped_catalog),
        requirements_size=len(requirements),
        output_path=summary_path,
        embedding_backend=embedding_backend,
        semantic_weight=semantic_weight,
        lexical_weight=lexical_weight,
        nlp_enabled=nlp_enabled,
    )

    print(f"Requirements processed: {len(requirements)}")
    print(f"Keywords in scope: {len(scoped_catalog)}")
    print(f"Embedding backend: {embedding_backend}")
    print(f"NLP preprocessing: {'enabled' if nlp_enabled else 'disabled'}")
    print(f"Mapping report: {mapping_report_path}")
    print(f"Unmapped report: {unmapped_report_path}")
    print(f"Summary: {summary_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
