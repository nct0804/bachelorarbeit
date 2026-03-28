#!/usr/bin/env python3
"""Feature-first semantic pipeline for executable Robot Framework generation.

Pipeline stages:
1. Load source `.feature` files from Features directory.
2. Analyze steps with NLP + semantic matching against existing executable keywords.
3. Reserve hooks for future RAG/LLM/prompting enrichment.
4. Generate executable `.robot` and `.resource` files.

This pipeline intentionally ignores legacy `Gherkin` tags and wrappers.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
import shutil
import sys
from collections import Counter
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable

CURRENT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = CURRENT_DIR.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from src.components.semantic.nlp_processor import RequirementNLPProcessor


TEXT_SPLIT_PATTERN = re.compile(r"[^a-z0-9]+")
PLACEHOLDER_PATTERN = re.compile(r"[$@&]\{([^}]+)\}")
QUOTED_TEXT_PATTERN = re.compile(r"['\"][^'\"]+['\"]")
MULTI_SPACE_PATTERN = re.compile(r"\s+")
FEATURE_STEP_PATTERN = re.compile(r"^\s*(Given|When|Then|And|But)\s+(.+?)\s*$", re.IGNORECASE)
QUOTED_VALUE_PATTERN = re.compile(r"'([^']+)'|\"([^\"]+)\"")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
NUMBER_PATTERN = re.compile(r"\b\d+\b")
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
LEGACY_GHERKIN_TOKENS = {"gherkin", "bdd"}
MAINLIB_DEFAULT_LIBRARIES = {"Collections", "OperatingSystem", "String", "Browser"}
DEFAULT_REQUIREMENT_TEXT_FIELD_CANDIDATES = [
    "REQUIREMENT_TEXT",
    "requirement",
    "text",
    "title",
    "description",
    "story",
    "user_story",
]
DEFAULT_PHRASE_MAP: dict[str, str] = {}
ACTIVE_PHRASE_MAP: dict[str, str] = dict(DEFAULT_PHRASE_MAP)
DEFAULT_IGNORE_QUOTED_TEXT = True

# Element types for scoring boost
ELEMENT_TYPES = [
    "button",
    "textbox",
    "text",
    "checkbox",
    "link",
    "section",
    "list",
    "notification",
    "page",
]

# Disambiguation pairs: when source contains key, penalize matches containing values
DISAMBIGUATION_PENALTIES = {
    "sign in": ["sign up", "signup", "register"],
    "sign up": ["sign in", "signin", "login"],
    "textbox": ["text"],  # Prevent textbox matching text-only keywords
    "should be visible": ["toggle", "click", "set", "fill"],  # Verification vs action
    "should be opened": ["go to", "navigate", "open"],  # Verification vs navigation
}


@dataclass
class ArgSpec:
    """Robot keyword argument metadata."""

    name: str
    default_value: str | None = None


@dataclass
class KeywordEntry:
    """Executable keyword catalog entry."""

    keyword_name: str
    source_file: str
    documentation: str
    tags: list[str]
    arguments: list[ArgSpec]
    embedded_arguments: list[ArgSpec]
    normalized_text: str

@dataclass
class FeatureStep:
    """Single parsed feature step."""

    line_number: int
    clause: str
    text: str


@dataclass
class ScenarioEntry:
    """Parsed feature scenario."""

    name: str
    tags: list[str]
    steps: list[FeatureStep]


@dataclass
class FeatureDocument:
    """Parsed feature file model."""

    source_file: str
    feature_name: str
    scenarios: list[ScenarioEntry]


@dataclass
class StepEntities:
    """Structured entities extracted from free-form step text."""

    quoted_values: list[str]
    emails: list[str]
    numbers: list[str]
    browser: str | None
    page: str | None
    section: str | None
    textbox: str | None
    button: str | None
    text_name: str | None
    checkbox: str | None
    checkbox_state: str | None
    notification: str | None
    list_name: str | None
    value: str | None
    expected_text: str | None


@dataclass
class StepAnalysis:
    """Semantic analysis output for one step."""

    original_text: str
    normalized_text: str
    mapping_text: str
    intent: str
    entities: StepEntities
    suggested_libraries: list[str]


@dataclass
class StepExecutionPlan:
    """Mapped execution instruction for one step."""

    source_step: FeatureStep
    generated_keyword_name: str
    mapped_keyword_name: str
    mapped_arguments: list[str]
    confidence: float
    match_source: str
    intent: str
    suggested_libraries: list[str]


def load_default_phrase_map() -> dict[str, str]:
    raw_phrase_map = getattr(RequirementNLPProcessor, "DEFAULT_PHRASE_MAP", None)
    if not isinstance(raw_phrase_map, dict):
        return dict(DEFAULT_PHRASE_MAP)
    normalized: dict[str, str] = {}
    for source, target in raw_phrase_map.items():
        source_text = str(source).strip().lower()
        if not source_text:
            continue
        if isinstance(target, (list, tuple, set)):
            normalized[source_text] = source_text
            for variant in target:
                variant_text = str(variant).strip().lower()
                if variant_text:
                    normalized[variant_text] = source_text
            continue
        target_text = str(target).strip().lower()
        if target_text:
            normalized[source_text] = target_text
    return normalized


def set_active_phrase_map(phrase_map: dict[str, str]) -> None:
    global ACTIVE_PHRASE_MAP
    ACTIVE_PHRASE_MAP = dict(phrase_map or {})


set_active_phrase_map(load_default_phrase_map())


def apply_phrase_map(text: str) -> str:
    mapped_text = text
    ordered_pairs = sorted(ACTIVE_PHRASE_MAP.items(), key=lambda item: len(item[0]), reverse=True)
    for source, target in ordered_pairs:
        if not source.strip():
            continue
        pattern = r"\b" + re.escape(source.strip().lower()) + r"\b"
        mapped_text = re.sub(pattern, target.strip().lower(), mapped_text)
    return mapped_text


def normalize_text(
    text: str,
    remove_stops: bool = True,
    ignore_quoted_text: bool | None = None,
) -> str:
    text_value = str(text or "")
    if ignore_quoted_text is None:
        ignore_quoted_text = DEFAULT_IGNORE_QUOTED_TEXT
    if ignore_quoted_text:
        text_value = QUOTED_TEXT_PATTERN.sub(" ", text_value)
    text_value = PLACEHOLDER_PATTERN.sub(r" \1 ", text_value)
    text_value = text_value.lower()
    text_value = apply_phrase_map(text_value)
    text_value = TEXT_SPLIT_PATTERN.sub(" ", text_value)
    text_value = MULTI_SPACE_PATTERN.sub(" ", text_value).strip()
    if not remove_stops:
        return text_value
    filtered = [token for token in text_value.split() if token not in OPTIONAL_STOPS]
    return " ".join(filtered)


def tokenize(text: str, ignore_quoted_text: bool | None = None) -> list[str]:
    if ignore_quoted_text is None:
        ignore_quoted_text = DEFAULT_IGNORE_QUOTED_TEXT
    cleaned = normalize_text(text, remove_stops=True, ignore_quoted_text=ignore_quoted_text)
    return [token for token in cleaned.split(" ") if token]


def lexical_similarity(
    source: str,
    target: str,
    ignore_quoted_text_source: bool | None = None,
    ignore_quoted_text_target: bool | None = None,
) -> float:
    if ignore_quoted_text_source is None:
        ignore_quoted_text_source = DEFAULT_IGNORE_QUOTED_TEXT
    if ignore_quoted_text_target is None:
        ignore_quoted_text_target = DEFAULT_IGNORE_QUOTED_TEXT
    source_clean = normalize_text(
        source,
        remove_stops=True,
        ignore_quoted_text=ignore_quoted_text_source,
    )
    target_clean = normalize_text(
        target,
        remove_stops=True,
        ignore_quoted_text=ignore_quoted_text_target,
    )
    if not source_clean or not target_clean:
        return 0.0
    sequence_score = SequenceMatcher(None, source_clean, target_clean).ratio()
    source_tokens = set(source_clean.split())
    target_tokens = set(target_clean.split())
    intersection = source_tokens.intersection(target_tokens)
    union = source_tokens.union(target_tokens)
    jaccard_score = (len(intersection) / len(union)) if union else 0.0
    return (0.6 * sequence_score) + (0.4 * jaccard_score)


def calculate_element_type_boost(source: str, target: str) -> float:
    """Calculate boost when source and target share exact element type."""
    source_lower = source.lower()
    target_lower = target.lower()

    boost = 0.0
    for element_type in ELEMENT_TYPES:
        if element_type in source_lower and element_type in target_lower:
            boost += 0.10

    return min(boost, 0.15)


def calculate_disambiguation_penalty(source: str, target: str) -> float:
    """Calculate penalty when source and target have confusing similar terms."""
    source_lower = source.lower()
    target_lower = target.lower()

    penalty = 0.0
    for key, confused_terms in DISAMBIGUATION_PENALTIES.items():
        if key in source_lower:
            for confused in confused_terms:
                if confused in target_lower and key not in target_lower:
                    penalty += 0.15

    return min(penalty, 0.25)


def normalize_vector(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


def dot_product(vector_a: list[float], vector_b: list[float]) -> float:
    return sum(a * b for a, b in zip(vector_a, vector_b))


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
            tokens = set(tokenize(text, ignore_quoted_text=False))
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
        token_counts = Counter(tokenize(text, ignore_quoted_text=False))
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


def parse_arg_specs(argument_line: str) -> list[ArgSpec]:
    tokens = [token.strip() for token in re.split(r"\s{2,}", argument_line) if token.strip()]
    specs: list[ArgSpec] = []
    for token in tokens:
        if "=" in token:
            name, default_value = token.split("=", 1)
            specs.append(ArgSpec(name=name.strip(), default_value=default_value.strip()))
        else:
            specs.append(ArgSpec(name=token.strip(), default_value=None))
    return specs


def parse_embedded_arguments(keyword_name: str) -> list[ArgSpec]:
    embedded_specs: list[ArgSpec] = []
    for match in PLACEHOLDER_PATTERN.finditer(keyword_name):
        placeholder = match.group(0)
        if placeholder:
            embedded_specs.append(ArgSpec(name=placeholder, default_value=None))
    return embedded_specs


def parse_robot_keywords(resource_path: Path) -> list[KeywordEntry]:
    lines = resource_path.read_text(encoding="utf-8").splitlines()

    in_keywords_section = False
    current_keyword_name = ""
    current_doc = ""
    current_tags: list[str] = []
    current_args: list[ArgSpec] = []
    current_arg_lines: list[str] = []
    collecting_arguments = False
    entries: list[KeywordEntry] = []

    def flush_keyword() -> None:
        nonlocal current_keyword_name
        nonlocal current_doc
        nonlocal current_tags
        nonlocal current_args
        nonlocal current_arg_lines
        nonlocal collecting_arguments

        if not current_keyword_name:
            return

        lowered_tags = {tag.strip().lower() for tag in current_tags}
        if LEGACY_GHERKIN_TOKENS.intersection(lowered_tags):
            current_keyword_name = ""
            current_doc = ""
            current_tags = []
            current_args = []
            return

        entry = KeywordEntry(
            keyword_name=current_keyword_name,
            source_file=str(resource_path),
            documentation=current_doc,
            tags=current_tags,
            arguments=list(current_args),
            embedded_arguments=parse_embedded_arguments(current_keyword_name),
            normalized_text=normalize_text(
                f"{current_keyword_name} {current_doc} {' '.join(arg.name for arg in current_args)}",
                remove_stops=True,
                ignore_quoted_text=False,
            ),
        )
        entries.append(entry)
        current_keyword_name = ""
        current_doc = ""
        current_tags = []
        current_args = []
        current_arg_lines = []
        collecting_arguments = False

    for raw_line in lines:
        line = raw_line.rstrip("\n")
        stripped = line.strip()

        if stripped.startswith("***"):
            flush_keyword()
            in_keywords_section = stripped.lower() == "*** keywords ***"
            continue

        if not in_keywords_section or not stripped or line.startswith("#"):
            continue

        is_keyword_header = not line.startswith(" ") and not line.startswith("\t")
        if is_keyword_header:
            flush_keyword()
            current_keyword_name = stripped
            continue

        if not current_keyword_name:
            continue

        if collecting_arguments and stripped.startswith("..."):
            continuation_args = stripped[3:].strip()
            if continuation_args:
                current_arg_lines.append(continuation_args)
                current_args = parse_arg_specs("    ".join(current_arg_lines))
            continue

        collecting_arguments = False

        if stripped.startswith("[Documentation]"):
            current_doc = stripped.replace("[Documentation]", "", 1).strip()
            continue
        if stripped.startswith("[Tags]"):
            raw_tags = stripped.replace("[Tags]", "", 1).strip()
            split_tags = [tag.strip() for tag in re.split(r"\s{2,}", raw_tags) if tag.strip()]
            current_tags.extend(split_tags)
            continue
        if stripped.startswith("[Arguments]"):
            raw_args = stripped.replace("[Arguments]", "", 1).strip()
            current_arg_lines = [raw_args] if raw_args else []
            current_args = parse_arg_specs("    ".join(current_arg_lines))
            collecting_arguments = True
            continue

    flush_keyword()
    return entries


def build_keyword_catalog(resource_root: Path) -> list[KeywordEntry]:
    catalog: list[KeywordEntry] = []
    for resource_file in sorted(resource_root.rglob("*.resource")):
        if resource_file.name == "__lib.resource":
            continue
        catalog.extend(parse_robot_keywords(resource_file))
    return catalog

def parse_feature_file(feature_file: Path) -> FeatureDocument:
    lines = feature_file.read_text(encoding="utf-8").splitlines()
    feature_name = feature_file.stem
    scenarios: list[ScenarioEntry] = []
    pending_tags: list[str] = []
    current_scenario: ScenarioEntry | None = None

    for line_number, raw_line in enumerate(lines, start=1):
        stripped = raw_line.strip()

        if not stripped:
            continue
        if stripped.startswith("#"):
            continue

        if stripped.startswith("@"):
            for token in stripped.split():
                cleaned = token.strip().lstrip("@").strip()
                if cleaned:
                    pending_tags.append(cleaned)
            continue

        if stripped.lower().startswith("feature:"):
            parsed_name = stripped.split(":", 1)[1].strip()
            if parsed_name:
                feature_name = parsed_name
            continue

        if stripped.lower().startswith("scenario:") or stripped.lower().startswith("scenario outline:"):
            if current_scenario is not None:
                scenarios.append(current_scenario)
            scenario_name = stripped.split(":", 1)[1].strip() or f"Scenario {len(scenarios) + 1}"
            current_scenario = ScenarioEntry(name=scenario_name, tags=list(dict.fromkeys(pending_tags)), steps=[])
            pending_tags = []
            continue

        if current_scenario is None:
            continue

        step_match = FEATURE_STEP_PATTERN.match(raw_line)
        if step_match:
            clause = step_match.group(1).title()
            step_text = step_match.group(2).strip()
            if step_text:
                current_scenario.steps.append(FeatureStep(line_number=line_number, clause=clause, text=step_text))
            continue

        if raw_line.startswith(" ") or raw_line.startswith("\t"):
            fallback_step = stripped
            if fallback_step and not fallback_step.startswith("|"):
                current_scenario.steps.append(
                    FeatureStep(line_number=line_number, clause="Step", text=fallback_step)
                )

    if current_scenario is not None:
        scenarios.append(current_scenario)

    return FeatureDocument(
        source_file=str(feature_file),
        feature_name=feature_name,
        scenarios=scenarios,
    )


def load_feature_documents(features_root: Path) -> list[FeatureDocument]:
    documents: list[FeatureDocument] = []
    for feature_file in sorted(features_root.rglob("*.feature")):
        documents.append(parse_feature_file(feature_file))
    return documents


def extract_named_entity(step_text: str, entity_names: str | Iterable[str]) -> str | None:
    names = [entity_names] if isinstance(entity_names, str) else list(entity_names)
    if not names:
        return None

    for entity_name in names:
        escaped_name = re.escape(entity_name)
        before_pattern = re.compile(
            rf"(?:'([^']+)'|\"([^\"]+)\")\s+{escaped_name}\b",
            re.IGNORECASE,
        )
        before_match = before_pattern.search(step_text)
        if before_match:
            return before_match.group(1) or before_match.group(2)

        after_pattern = re.compile(
            rf"\b{escaped_name}\b\s+(?:named\s+)?(?:'([^']+)'|\"([^\"]+)\")",
            re.IGNORECASE,
        )
        after_match = after_pattern.search(step_text)
        if after_match:
            return after_match.group(1) or after_match.group(2)

    return None


def extract_entities(step_text: str) -> StepEntities:
    quoted_values = [left or right for left, right in QUOTED_VALUE_PATTERN.findall(step_text)]
    emails = EMAIL_PATTERN.findall(step_text)
    numbers = NUMBER_PATTERN.findall(step_text)
    lowered = step_text.lower()

    browser = None
    for candidate in ["chromium", "chrome", "firefox", "webkit", "edge"]:
        if re.search(rf"\b{re.escape(candidate)}\b", lowered):
            browser = candidate
            break

    page = None
    page_match = re.search(r"(?:to|on|open)\s+(?:the\s+)?(?:'([^']+)'|\"([^\"]+)\"|([a-z0-9\-\s]+?))\s+page", step_text, re.IGNORECASE)
    if page_match:
        page = next((group for group in page_match.groups() if group), None)
    if page is None:
        validation_page_match = re.search(
            r"(?:validate|verify|confirm)\w*\s+(?:the\s+)?([a-z0-9\-\s]+?)\s+page",
            step_text,
            re.IGNORECASE,
        )
        if validation_page_match:
            page = validation_page_match.group(1)
    if page is None and "page should be opened" in lowered and quoted_values:
        page = quoted_values[0]

    textbox = extract_named_entity(step_text, ["textbox", "field", "input"])
    section = extract_named_entity(step_text, "section")
    button = extract_named_entity(step_text, "button")
    text_name = extract_named_entity(step_text, ["text", "link"])
    checkbox = extract_named_entity(step_text, "checkbox")

    checkbox_state = None
    state_match = re.search(r"\b(checked|unchecked|check|uncheck|true|false|on|off)\b", lowered)
    if state_match:
        checkbox_state = state_match.group(1)

    notification = extract_named_entity(step_text, "notification")
    list_name = extract_named_entity(step_text, "list")

    value = None
    # Remove quoted text before checking for action verbs to avoid matching words inside element names
    lowered_no_quotes = QUOTED_TEXT_PATTERN.sub("", lowered)
    if re.search(r"\bset(?:s)?\s+text\b", lowered_no_quotes) and quoted_values:
        value = quoted_values[0]
    elif re.search(r"\b(enter|type|input)\w*\b", lowered_no_quotes) and len(quoted_values) >= 2:
        value = quoted_values[0]
    elif re.search(r"\bfill\w*\b", lowered_no_quotes) and len(quoted_values) >= 2:
        value = quoted_values[-1]
    else:
        value_match = re.search(r"(?:with|to)\s+(?:'([^']+)'|\"([^\"]+)\")", step_text, re.IGNORECASE)
        if value_match:
            value = value_match.group(1) or value_match.group(2)
        elif len(quoted_values) >= 2:
            value = quoted_values[-1]

    expected_text = None
    expected_match = re.search(r"(?:contain|contains|equals?)\s+(?:'([^']+)'|\"([^\"]+)\")", step_text, re.IGNORECASE)
    if expected_match:
        expected_text = expected_match.group(1) or expected_match.group(2)

    return StepEntities(
        quoted_values=quoted_values,
        emails=emails,
        numbers=numbers,
        browser=browser,
        page=page.strip() if isinstance(page, str) and page.strip() else None,
        section=section,
        textbox=textbox,
        button=button,
        text_name=text_name,
        checkbox=checkbox,
        checkbox_state=checkbox_state,
        notification=notification,
        list_name=list_name,
        value=value,
        expected_text=expected_text,
    )


def detect_intent(step_text: str) -> str:
    lowered = step_text.lower()

    if re.search(r"signs? in.+email.+password", lowered):
        return "sign_in_credentials"
    if re.search(
        r"\bsection\b.+\b(updated?|changed?)\b.+\b(clicking|triggering)\b.+\bbutton\b",
        lowered,
    ):
        return "section_update_after_click"
    if re.search(r"\b(open|start|launch)\w*\b.+\bbrowser\b", lowered):
        return "open_browser"
    if re.search(r"\bclose\b.+\bbrowser\b", lowered):
        return "close_browser"
    if re.search(r"\b(validate|verify|confirm)\w*\b.+\bpage\b.+\b(open|opened)\b", lowered):
        return "validate_page"
    if re.search(r"\bpage\b.+\b(should be opened|is opened|is open)\b", lowered):
        return "validate_page"
    if re.search(r"\b(navigate|go|visit|open|browse|access)\w*\b.+\bpage\b", lowered):
        return "navigate_page"
    if re.search(r"\b(fill|enter|input|type)\w*\b.+\b(textbox|field|input)\b", lowered):
        return "fill_textbox"
    if re.search(r"\bclear\w*\b.+\btextbox\b", lowered):
        return "clear_textbox"
    if re.search(r"\b(trigger|press|tap)\w*\b.+\bbutton\b", lowered):
        return "click_button"
    if re.search(r"\bclick\w*\b.+\bbutton\b", lowered):
        return "click_button"
    if re.search(r"\bclick\w*\b.+\bcheckbox\b", lowered):
        return "click_checkbox"
    if re.search(r"\bcheckbox\b.+\b(state|status)\b.+\b(checked|unchecked|check|uncheck|true|false|on|off)\b", lowered):
        return "checkbox_state_assert"
    if re.search(r"\bverify\w*\b.+\bcheckbox\b.+\b(state|status)\b", lowered):
        return "checkbox_state_assert"
    if re.search(r"\bclick\w*\b.+\b(text|link)\b", lowered):
        return "click_text"
    if re.search(r"\bclick\w*\b", lowered):
        return "click_button"
    if re.search(r"\btextbox\b.+\bcontain", lowered):
        return "textbox_contains"
    if re.search(r"\btextbox\b.+\bvisible\b", lowered):
        return "textbox_visible"
    if re.search(r"\bbutton\b.+\bvisible\b", lowered):
        return "button_visible"
    if re.search(r"\btext\b.+\bvisible\b", lowered):
        return "text_visible"
    if re.search(r"\bcheckbox\b.+\bvisible\b", lowered):
        return "checkbox_visible"
    if re.search(r"\bnotification\b.+\bcontain", lowered):
        return "notification_contains"
    if re.search(r"\bnotification\b.+\bvisible\b", lowered):
        return "notification_visible"
    if re.search(r"\bmessagebox\b.+\bvisible\b", lowered):
        return "messagebox_visible"
    if re.search(r"\blist\b.+\bat least\b", lowered):
        return "list_count"
    if re.search(r"\blist\b.+\bvisible\b", lowered):
        return "list_visible"
    if re.search(r"\b(sign up|signup|register)\b.+\b(with|using)\b", lowered):
        return "sign_up"
    return "generic"


def recommend_libraries(step_text: str) -> list[str]:
    lowered = step_text.lower()
    libraries: list[str] = []

    if any(token in lowered for token in ["api", "endpoint", "request", "response", "rest", "http"]):
        libraries.append("RequestsLibrary")
    if any(token in lowered for token in ["database", "sql", "query", "table", "db"]):
        libraries.append("DatabaseLibrary")
    if any(token in lowered for token in ["mobile", "android", "ios", "appium", "tap", "swipe"]):
        libraries.append("AppiumLibrary")
    if any(token in lowered for token in ["ssh", "shell", "process", "command", "terminal"]):
        libraries.append("Process")
    if any(token in lowered for token in ["browser", "page", "click", "textbox", "button", "notification"]):
        libraries.append("Browser")

    return list(dict.fromkeys(libraries))


def pick_rule_keywords(intent: str) -> list[str]:
    # Use concrete project keyword names so rule mapping stays deterministic.
    rule_map = {
        "open_browser": ["Open Browser Session"],
        "close_browser": ["Close Browser Session"],
        "navigate_page": ["Navigate To Page"],
        "validate_page": ["Page Should Be Ready"],
        "section_update_after_click": ["The section should be updated after clicking the button"],
        "fill_textbox": ["Fill Textbox With Value", "Fill Textbox"],
        "clear_textbox": ["Clear Textbox"],
        "click_button": ["Click Button"],
        "click_checkbox": ["Click Checkbox", "Set Checkbox To State"],
        "click_text": ["Click Text"],
        "textbox_contains": ["Textbox Contain Value"],
        "textbox_visible": ["Textbox Should Be Visible"],
        "button_visible": ["Button Should Be Visible"],
        "text_visible": ["Text Should Be Visible"],
        "checkbox_visible": ["Checkbox Should Be Visible"],
        "checkbox_state_assert": ["Checkbox State Should Be", "Verify If The Checkbox Status Is State"],
        "notification_contains": ["Notification Should Contain Text"],
        "notification_visible": ["Notification Should Be Visible"],
        "messagebox_visible": ["Messagebox Should Be Visible"],
        "list_count": ["List Item Count Should Be At Least"],
        "list_visible": ["List Should Be Visible"],
    }
    return rule_map.get(intent, [])


def argument_name_key(arg_name: str) -> str:
    raw = arg_name.strip()
    raw = raw.replace("${", "").replace("}", "")
    raw = raw.replace("@{", "").replace("&{", "")
    return normalize_text(raw, remove_stops=False, ignore_quoted_text=False).replace(" ", "_").upper()


def infer_argument_value(arg_name: str, analysis: StepAnalysis, quote_cursor: int) -> tuple[str | None, int]:
    key = argument_name_key(arg_name)
    entities = analysis.entities

    def next_quote(default: str | None = None) -> str | None:
        nonlocal quote_cursor
        if quote_cursor < len(entities.quoted_values):
            value = entities.quoted_values[quote_cursor]
            quote_cursor += 1
            return value
        return default

    if key in {"BROWSER", "TYPE", "ENGINE"}:
        return (entities.browser or next_quote("chromium"), quote_cursor)
    if "PAGE" in key:
        return (entities.page or next_quote("Home"), quote_cursor)
    if key in {"EMAIL"}:
        if entities.emails:
            return (entities.emails[0], quote_cursor)
        return (next_quote("test@example.com"), quote_cursor)
    if key in {"PASSWORD", "PASS"}:
        if len(entities.quoted_values) >= 2:
            for quoted in entities.quoted_values:
                if not EMAIL_PATTERN.fullmatch(quoted):
                    return (quoted, quote_cursor)
        return (next_quote("password123"), quote_cursor)
    if key in {"FIRST_NAME"}:
        return (next_quote("First"), quote_cursor)
    if key in {"LAST_NAME"}:
        return (next_quote("Last"), quote_cursor)
    if key in {"USERNAME", "USER_NAME"}:
        return (next_quote("robot.user"), quote_cursor)
    if key in {"SECTION", "SECTION_NAME"}:
        return (entities.section or next_quote("section"), quote_cursor)
    if key in {"TEXTBOX", "FIELD", "INPUT", "NAME"}:
        return (entities.textbox or entities.button or entities.text_name or entities.checkbox or entities.notification or entities.list_name or next_quote("primary"), quote_cursor)
    if key in {"BUTTON", "BUTTON_NAME"}:
        return (entities.button or next_quote("primary"), quote_cursor)
    if key in {"TEXT"}:
        return (entities.expected_text or entities.text_name or next_quote(""), quote_cursor)
    if key in {"CHECKBOX"}:
        return (entities.checkbox or next_quote("primary"), quote_cursor)
    if key in {"NOTIFICATION"}:
        return (entities.notification or next_quote("Container"), quote_cursor)
    if key in {"LIST"}:
        return (entities.list_name or next_quote("primary"), quote_cursor)
    if key in {"VALUE", "EXPECTED_VALUE", "EXPECTED_TEXT"}:
        return (entities.value or entities.expected_text or next_quote(""), quote_cursor)
    if key in {"INDEX"}:
        return (entities.numbers[0] if entities.numbers else "0", quote_cursor)
    if key in {"COUNT", "MIN_COUNT"}:
        return (entities.numbers[0] if entities.numbers else "1", quote_cursor)
    if key in {"STATUS"}:
        return (next_quote("successful"), quote_cursor)
    if key in {"STATE", "EXPECTED_STATE", "TARGET_STATE"}:
        if entities.checkbox_state:
            return (entities.checkbox_state, quote_cursor)
        return (next_quote("checked"), quote_cursor)

    return (next_quote(""), quote_cursor)


def build_embedded_argument_values(
    keyword: KeywordEntry,
    analysis: StepAnalysis,
    quote_cursor: int,
) -> tuple[list[str], int]:
    values: list[str] = []
    defaults_by_name = {
        arg.name: arg.default_value
        for arg in keyword.arguments
        if arg.default_value is not None
    }
    for arg in keyword.embedded_arguments:
        value, quote_cursor = infer_argument_value(arg.name, analysis, quote_cursor)
        if (value is None or value == "") and arg.name in defaults_by_name:
            value = defaults_by_name[arg.name]
        if value is None:
            value = ""
        values.append(value)
    return values, quote_cursor


def build_explicit_argument_values(
    keyword: KeywordEntry,
    analysis: StepAnalysis,
    quote_cursor: int,
    skip_names: set[str] | None = None,
) -> tuple[list[str], int]:
    values: list[str] = []
    for arg in keyword.arguments:
        if skip_names and arg.name in skip_names:
            continue
        value, quote_cursor = infer_argument_value(arg.name, analysis, quote_cursor)
        if (value is None or value == "") and arg.default_value is not None:
            continue
        if value is None:
            value = ""
        values.append(value)
    return values, quote_cursor


def render_keyword_with_embedded_values(
    keyword_name: str,
    embedded_arguments: list[ArgSpec],
    embedded_values: list[str],
) -> str:
    rendered = keyword_name
    for arg, value in zip(embedded_arguments, embedded_values):
        if not value:
            continue
        rendered = rendered.replace(arg.name, value)
    return rendered


def build_keyword_call(keyword: KeywordEntry, analysis: StepAnalysis) -> tuple[str, list[str]]:
    quote_cursor = 0
    embedded_values, quote_cursor = build_embedded_argument_values(keyword, analysis, quote_cursor)
    embedded_names = {arg.name for arg in keyword.embedded_arguments}
    explicit_values, _ = build_explicit_argument_values(
        keyword,
        analysis,
        quote_cursor,
        skip_names=embedded_names,
    )
    rendered_name = render_keyword_with_embedded_values(
        keyword.keyword_name,
        keyword.embedded_arguments,
        embedded_values,
    )
    return rendered_name, explicit_values


def sanitize_keyword_title(text: str) -> str:
    clean = re.sub(r"[^A-Za-z0-9 ]+", " ", text)
    clean = MULTI_SPACE_PATTERN.sub(" ", clean).strip()
    if not clean:
        return "Generated Step"
    return clean.title()


def load_requirements_dataset(requirements_path: Path, requirement_text_field: str | None = None) -> list[str]:
    if not requirements_path.exists():
        return []

    suffix = requirements_path.suffix.lower()
    if suffix in {".txt", ".md"}:
        lines = requirements_path.read_text(encoding="utf-8").splitlines()
        return [line.strip() for line in lines if line.strip() and not line.strip().startswith("#")]

    if suffix == ".json":
        data = json.loads(requirements_path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            data = [data]
        texts: list[str] = []
        if isinstance(data, list):
            for item in data:
                if isinstance(item, str) and item.strip():
                    texts.append(item.strip())
                    continue
                if not isinstance(item, dict):
                    continue
                candidate = ""
                if requirement_text_field and requirement_text_field in item:
                    candidate = str(item.get(requirement_text_field, "")).strip()
                if not candidate:
                    for key in DEFAULT_REQUIREMENT_TEXT_FIELD_CANDIDATES:
                        raw = item.get(key)
                        if raw is not None and str(raw).strip():
                            candidate = str(raw).strip()
                            break
                if candidate:
                    texts.append(candidate)
        return texts

    if suffix == ".csv":
        with requirements_path.open("r", encoding="utf-8") as file_handle:
            reader = csv.DictReader(file_handle)
            rows = list(reader)
        texts: list[str] = []
        for row in rows:
            candidate = ""
            if requirement_text_field and requirement_text_field in row:
                candidate = str(row.get(requirement_text_field, "")).strip()
            if not candidate:
                for key in DEFAULT_REQUIREMENT_TEXT_FIELD_CANDIDATES:
                    raw = row.get(key)
                    if raw is not None and str(raw).strip():
                        candidate = str(raw).strip()
                        break
            if not candidate:
                cells = [str(value).strip() for value in row.values() if value is not None and str(value).strip()]
                if cells:
                    candidate = sorted(cells, key=len, reverse=True)[0]
            if candidate:
                texts.append(candidate)
        return texts

    return []


class FeatureExecutionPipeline:
    """Convert free-form feature files into executable Robot artifacts."""

    def __init__(
        self,
        features_root: Path,
        resource_root: Path,
        output_root: Path,
        analysis_dir: Path,
        requirements_path: Path | None = None,
        requirement_text_field: str | None = None,
        clean_output: bool = True,
        ignore_quoted_text: bool = True,
        semantic_weight: float = 0.85,
        lexical_weight: float = 0.15,
        embedding_dim: int = 384,
    ) -> None:
        self.features_root = features_root
        self.resource_root = resource_root
        self.output_root = output_root
        self.analysis_dir = analysis_dir
        self.requirements_path = requirements_path
        self.requirement_text_field = requirement_text_field
        self.clean_output = clean_output
        self.ignore_quoted_text = bool(ignore_quoted_text)
        if semantic_weight < 0 or lexical_weight < 0:
            raise ValueError("Similarity weights must be non-negative.")
        total_weight = semantic_weight + lexical_weight
        if total_weight <= 0:
            raise ValueError("At least one of semantic_weight or lexical_weight must be > 0.")
        self.semantic_weight = semantic_weight / total_weight
        self.lexical_weight = lexical_weight / total_weight
        self.embedding_dim = embedding_dim

        set_active_phrase_map(load_default_phrase_map())
        self.nlp_processor = RequirementNLPProcessor(
            phrase_map=ACTIVE_PHRASE_MAP,
            ignore_quoted_text=self.ignore_quoted_text,
        )
        self.catalog: list[KeywordEntry] = []
        self.catalog_by_name: dict[str, KeywordEntry] = {}
        self.requirements_context: list[str] = []
        self.embedding_model: LocalEmbeddingModel | None = None
        self.keyword_vectors: list[list[float]] = []
        self.keyword_texts: list[str] = []

    def run(self) -> dict:
        if not self.features_root.exists():
            raise SystemExit(f"Features root not found: {self.features_root}")
        if not self.resource_root.exists():
            raise SystemExit(f"Resource root not found: {self.resource_root}")

        if self.clean_output and self.output_root.exists():
            shutil.rmtree(self.output_root)
        self.output_root.mkdir(parents=True, exist_ok=True)
        self.analysis_dir.mkdir(parents=True, exist_ok=True)

        self.catalog = build_keyword_catalog(self.resource_root)
        self.catalog_by_name = {entry.keyword_name: entry for entry in self.catalog}
        if not self.catalog:
            raise SystemExit("No executable keywords found under resource root.")

        self._prepare_similarity_models()

        if self.requirements_path is not None:
            self.requirements_context = load_requirements_dataset(
                self.requirements_path,
                requirement_text_field=self.requirement_text_field,
            )

        features = load_feature_documents(self.features_root)
        if not features:
            raise SystemExit("No feature files found under features root.")

        aggregate_rows: list[dict] = []
        aggregate_libraries: Counter[str] = Counter()
        total_generated_steps = 0

        for feature_index, feature in enumerate(features, start=1):
            plans, suggested_libraries = self._analyze_feature(feature)
            aggregate_libraries.update(suggested_libraries)
            total_generated_steps += sum(len(plans_per_scenario) for plans_per_scenario in plans)

            robot_path, resource_path = self._write_feature_outputs(feature, plans, suggested_libraries)
            feature_analysis_path = self.analysis_dir / f"{Path(feature.source_file).stem}.analysis.json"
            self._write_feature_analysis_json(feature_analysis_path, feature, plans, suggested_libraries)

            aggregate_rows.append(
                {
                    "FEATURE_INDEX": feature_index,
                    "FEATURE_NAME": feature.feature_name,
                    "SOURCE_FILE": feature.source_file,
                    "SCENARIOS": len(feature.scenarios),
                    "GENERATED_STEPS": sum(len(item) for item in plans),
                    "ROBOT_FILE": str(robot_path),
                    "RESOURCE_FILE": str(resource_path),
                    "SUGGESTED_LIBRARIES": ", ".join(suggested_libraries),
                }
            )

        summary_path = self.analysis_dir / "pipeline_summary.json"
        csv_path = self.analysis_dir / "generated_artifacts.csv"

        summary_payload = {
            "features_root": str(self.features_root),
            "resource_root": str(self.resource_root),
            "output_root": str(self.output_root),
            "analysis_dir": str(self.analysis_dir),
            "requirements_dataset": str(self.requirements_path) if self.requirements_path else "",
            "requirements_loaded": len(self.requirements_context),
            "catalog_size": len(self.catalog),
            "features_processed": len(features),
            "generated_steps": total_generated_steps,
            "suggested_libraries": dict(sorted(aggregate_libraries.items(), key=lambda item: item[0])),
            "pipeline_stages": {
                "semantic": "completed",
                "rag": "reserved_for_future",
                "llm": "reserved_for_future",
                "prompting": "reserved_for_future",
                "generation": "completed",
            },
        }
        summary_path.write_text(json.dumps(summary_payload, indent=2), encoding="utf-8")

        with csv_path.open("w", encoding="utf-8", newline="") as file_handle:
            writer = csv.DictWriter(
                file_handle,
                fieldnames=[
                    "FEATURE_INDEX",
                    "FEATURE_NAME",
                    "SOURCE_FILE",
                    "SCENARIOS",
                    "GENERATED_STEPS",
                    "ROBOT_FILE",
                    "RESOURCE_FILE",
                    "SUGGESTED_LIBRARIES",
                ],
            )
            writer.writeheader()
            for row in aggregate_rows:
                writer.writerow(row)

        return summary_payload

    def _prepare_similarity_models(self) -> None:
        if not self.catalog:
            return

        self.keyword_texts = [
            entry.normalized_text
            or normalize_text(
                f"{entry.keyword_name} {entry.documentation} {' '.join(arg.name for arg in entry.arguments)}",
                remove_stops=True,
                ignore_quoted_text=False,
            )
            for entry in self.catalog
        ]

        if self.semantic_weight <= 0:
            self.embedding_model = None
            self.keyword_vectors = []
            return

        self.embedding_model = LocalEmbeddingModel(dimension=self.embedding_dim)
        self.embedding_model.fit(self.keyword_texts)
        self.keyword_vectors = self.embedding_model.encode_many(self.keyword_texts)

    def _analyze_feature(self, feature: FeatureDocument) -> tuple[list[list[StepExecutionPlan]], list[str]]:
        scenario_plans: list[list[StepExecutionPlan]] = []
        feature_libraries: list[str] = []

        for scenario_index, scenario in enumerate(feature.scenarios, start=1):
            plans: list[StepExecutionPlan] = []
            for step_index, step in enumerate(scenario.steps, start=1):
                analysis = self._analyze_step(step)
                mapped_keyword, mapped_arguments, confidence, source = self._map_step_to_keyword(analysis)
                generated_keyword_name = self._build_generated_keyword_name(
                    scenario_index=scenario_index,
                    step_index=step_index,
                    mapped_keyword=mapped_keyword,
                )
                plans.append(
                    StepExecutionPlan(
                        source_step=step,
                        generated_keyword_name=generated_keyword_name,
                        mapped_keyword_name=mapped_keyword,
                        mapped_arguments=mapped_arguments,
                        confidence=confidence,
                        match_source=source,
                        intent=analysis.intent,
                        suggested_libraries=analysis.suggested_libraries,
                    )
                )
                feature_libraries.extend(analysis.suggested_libraries)

            scenario_plans.append(plans)

        ordered_libraries = list(dict.fromkeys(feature_libraries))
        return scenario_plans, ordered_libraries

    def _analyze_step(self, step: FeatureStep) -> StepAnalysis:
        processed = self.nlp_processor.preprocess_requirement_text(step.text)
        normalized_text = normalize_text(
            step.text,
            remove_stops=True,
            ignore_quoted_text=self.ignore_quoted_text,
        )
        mapping_text = processed.mapping_text.strip() if processed.mapping_text.strip() else step.text
        if self.requirements_context:
            context_hint = self._pick_requirement_context(step.text)
            if context_hint:
                mapping_text = f"{mapping_text} ; context: {context_hint}"
        intent = detect_intent(step.text)
        entities = extract_entities(step.text)
        suggested_libraries = recommend_libraries(step.text)

        return StepAnalysis(
            original_text=step.text,
            normalized_text=normalized_text,
            mapping_text=mapping_text,
            intent=intent,
            entities=entities,
            suggested_libraries=suggested_libraries,
        )

    def _pick_requirement_context(self, step_text: str) -> str | None:
        best_text = None
        best_score = 0.0
        for requirement_text in self.requirements_context:
            score = lexical_similarity(
                step_text,
                requirement_text,
                ignore_quoted_text_source=self.ignore_quoted_text,
                ignore_quoted_text_target=self.ignore_quoted_text,
            )
            if score > best_score:
                best_score = score
                best_text = requirement_text
        if best_text is None or best_score < 0.18:
            return None
        return best_text

    def _map_step_to_keyword(self, analysis: StepAnalysis) -> tuple[str, list[str], float, str]:
        for rule_keyword_name in pick_rule_keywords(analysis.intent):
            if rule_keyword_name in self.catalog_by_name:
                rule_keyword = self.catalog_by_name[rule_keyword_name]
                rendered_name, rule_args = build_keyword_call(rule_keyword, analysis)
                return rendered_name, rule_args, 0.98, "rule"

        requirement_vector: list[float] | None = None
        if self.embedding_model is not None:
            requirement_text = normalize_text(
                analysis.mapping_text,
                remove_stops=True,
                ignore_quoted_text=self.ignore_quoted_text,
            )
            requirement_vector = self.embedding_model.encode(requirement_text)

        best_entry: KeywordEntry | None = None
        best_score = -1.0

        for index, entry in enumerate(self.catalog):
            keyword_text = f"{entry.keyword_name} {entry.documentation} {' '.join(arg.name for arg in entry.arguments)}"
            semantic_score = 0.0
            if requirement_vector is not None and index < len(self.keyword_vectors):
                semantic_score = dot_product(requirement_vector, self.keyword_vectors[index])
            lexical_score = lexical_similarity(
                analysis.mapping_text,
                keyword_text,
                ignore_quoted_text_source=self.ignore_quoted_text,
                ignore_quoted_text_target=self.ignore_quoted_text,
            )
            element_boost = calculate_element_type_boost(analysis.mapping_text, keyword_text)
            disambiguation_penalty = calculate_disambiguation_penalty(analysis.mapping_text, keyword_text)

            base_score = (self.semantic_weight * semantic_score) + (self.lexical_weight * lexical_score)
            score = max(0.0, base_score + element_boost - disambiguation_penalty)

            if analysis.intent != "generic":
                intent_tokens = set(tokenize(analysis.intent.replace("_", " ")))
                keyword_tokens = set(tokenize(entry.keyword_name))
                overlap = len(intent_tokens.intersection(keyword_tokens))
                if overlap:
                    score += min(0.08 * overlap, 0.16)

            if score > best_score:
                best_score = score
                best_entry = entry

        if best_entry is not None and best_score >= 0.24:
            rendered_name, semantic_args = build_keyword_call(best_entry, analysis)
            return rendered_name, semantic_args, round(min(best_score, 0.95), 4), "semantic"

        return "No Operation", [], 0.0, "fallback"

    def _build_generated_keyword_name(self, scenario_index: int, step_index: int, mapped_keyword: str) -> str:
        title = sanitize_keyword_title(mapped_keyword)
        return f"{step_index:02d}: {title}"

    def _write_feature_outputs(
        self,
        feature: FeatureDocument,
        scenario_plans: list[list[StepExecutionPlan]],
        suggested_libraries: list[str],
    ) -> tuple[Path, Path]:
        base_name = Path(feature.source_file).stem
        robot_path = self.output_root / f"{base_name}.robot"
        resource_path = self.output_root / f"{base_name}.resource"

        relative_mainlib = self._as_robot_path(Path("../Resource/MainLib.resource"))
        additional_libraries = [library for library in suggested_libraries if library not in MAINLIB_DEFAULT_LIBRARIES]

        resource_lines: list[str] = []
        resource_lines.append("*** Settings ***")
        resource_lines.append(
            f"Documentation    Auto-generated executable resource for feature '{feature.feature_name}'."
        )
        resource_lines.append(f"Resource    {relative_mainlib}")
        for library in additional_libraries:
            resource_lines.append(f"Library    {library}")
        resource_lines.append("")
        resource_lines.append("*** Keywords ***")

        for scenario_plan in scenario_plans:
            for plan in scenario_plan:
                resource_lines.append(plan.generated_keyword_name)
                resource_lines.append(
                    f"    [Documentation]    Execute source step ({plan.source_step.clause}): {plan.source_step.text}"
                )
                if plan.mapped_keyword_name == "No Operation":
                    resource_lines.append(
                        f"    Log    Unmapped step skipped: {plan.source_step.text}"
                    )
                else:
                    row = [plan.mapped_keyword_name] + plan.mapped_arguments
                    resource_lines.append("    " + "    ".join(row))
                resource_lines.append("")

        robot_lines: list[str] = []
        robot_lines.append("*** Settings ***")
        robot_lines.append(
            f"Documentation    Auto-generated executable tests for feature '{feature.feature_name}'."
        )
        robot_lines.append(f"Resource    ./{resource_path.name}")
        robot_lines.append("")
        robot_lines.append("*** Test Cases ***")

        for scenario, plan in zip(feature.scenarios, scenario_plans):
            robot_lines.append(scenario.name)
            robot_lines.append(
                f"    [Documentation]    Generated from {Path(feature.source_file).name}."
            )
            if scenario.tags:
                tags_row = "    ".join(scenario.tags)
                robot_lines.append(f"    [Tags]    {tags_row}")
            robot_lines.append("    [Teardown]    Close Browser Session")
            for step_plan in plan:
                robot_lines.append(f"    {step_plan.generated_keyword_name}")
            robot_lines.append("")

        resource_path.write_text("\n".join(resource_lines).rstrip() + "\n", encoding="utf-8")
        robot_path.write_text("\n".join(robot_lines).rstrip() + "\n", encoding="utf-8")
        return robot_path, resource_path

    def _write_feature_analysis_json(
        self,
        output_path: Path,
        feature: FeatureDocument,
        scenario_plans: list[list[StepExecutionPlan]],
        suggested_libraries: list[str],
    ) -> None:
        scenarios_payload = []
        for scenario, plan in zip(feature.scenarios, scenario_plans):
            scenarios_payload.append(
                {
                    "name": scenario.name,
                    "tags": scenario.tags,
                    "steps": [
                        {
                            "line": item.source_step.line_number,
                            "clause": item.source_step.clause,
                            "original_text": item.source_step.text,
                            "generated_keyword": item.generated_keyword_name,
                            "mapped_keyword": item.mapped_keyword_name,
                            "mapped_arguments": item.mapped_arguments,
                            "intent": item.intent,
                            "match_source": item.match_source,
                            "confidence": item.confidence,
                            "suggested_libraries": item.suggested_libraries,
                        }
                        for item in plan
                    ],
                }
            )

        payload = {
            "feature_name": feature.feature_name,
            "source_file": feature.source_file,
            "scenario_count": len(feature.scenarios),
            "suggested_libraries": suggested_libraries,
            "scenarios": scenarios_payload,
        }
        output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    @staticmethod
    def _as_robot_path(path: Path) -> str:
        return str(path).replace("\\", "/")


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Feature-first pipeline: semantic analysis over .feature files, then generate executable "
            ".robot/.resource outputs."
        )
    )
    parser.add_argument(
        "--features-root",
        default="Features",
        help="Root folder containing source .feature files.",
    )
    parser.add_argument(
        "--resource-root",
        default="Resource",
        help="Root folder containing existing Robot resources.",
    )
    parser.add_argument(
        "--output-root",
        default="robot-tests",
        help="Output folder for generated executable .robot/.resource files.",
    )
    parser.add_argument(
        "--analysis-dir",
        default="Results/feature-pipeline",
        help="Output folder for semantic analysis artifacts.",
    )
    parser.add_argument(
        "--requirements",
        default=None,
        help="Optional requirements dataset merged into semantic context (txt/md/csv/json).",
    )
    parser.add_argument(
        "--requirement-text-field",
        default=None,
        help="Optional CSV/JSON field that contains requirement text.",
    )
    parser.add_argument(
        "--no-clean-output",
        action="store_true",
        help="Keep existing output-root files and append/overwrite generated files.",
    )
    parser.add_argument(
        "--use-quoted-text",
        dest="ignore_quoted_text",
        action="store_false",
        help="Include quoted values in step similarity scoring.",
    )
    parser.set_defaults(ignore_quoted_text=True)
    parser.add_argument(
        "--embedding-dim",
        type=int,
        default=384,
        help="Vector dimension for local hashing embedding model.",
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
    return parser


def main() -> int:
    parser = build_argument_parser()
    args = parser.parse_args()

    pipeline = FeatureExecutionPipeline(
        features_root=Path(args.features_root),
        resource_root=Path(args.resource_root),
        output_root=Path(args.output_root),
        analysis_dir=Path(args.analysis_dir),
        requirements_path=Path(args.requirements) if args.requirements else None,
        requirement_text_field=args.requirement_text_field,
        clean_output=not args.no_clean_output,
        ignore_quoted_text=args.ignore_quoted_text,
        semantic_weight=args.semantic_weight,
        lexical_weight=args.lexical_weight,
        embedding_dim=args.embedding_dim,
    )
    summary = pipeline.run()

    print(f"Features processed: {summary['features_processed']}")
    print(f"Executable keywords in catalog: {summary['catalog_size']}")
    print(f"Generated steps: {summary['generated_steps']}")
    print(f"Output root: {summary['output_root']}")
    print(f"Analysis dir: {summary['analysis_dir']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
