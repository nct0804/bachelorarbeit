#!/usr/bin/env python3
"""Support utilities for mapping Gherkin feature steps to Robot keywords."""

from __future__ import annotations

import hashlib
import math
import re
from collections import Counter
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable


TEXT_SPLIT_PATTERN = re.compile(r"[^a-z0-9]+")
PLACEHOLDER_PATTERN = re.compile(r"[$@&]\{([^}]+)\}")
QUOTED_TEXT_PATTERN = re.compile(r"['\"][^'\"]+['\"]")
MULTI_SPACE_PATTERN = re.compile(r"\s+")
FEATURE_STEP_PATTERN = re.compile(r"^\s*(Given|When|Then|And|But)\s+(.+?)\s*$", re.IGNORECASE)
QUOTED_VALUE_PATTERN = re.compile(r"'([^']+)'|\"([^\"]+)\"")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
NUMBER_PATTERN = re.compile(r"\b\d+\b")

OPTIONAL_STOPS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "be",
    "can",
    "could",
    "for",
    "is",
    "must",
    "my",
    "need",
    "of",
    "on",
    "or",
    "perform",
    "please",
    "should",
    "the",
    "to",
    "user",
    "using",
    "want",
    "wants",
    "with",
    "would",
}

GHERKIN_PHRASE_MAP = {
    "check box": "checkbox",
    "dashboard": "main page",
    "input field": "textbox",
    "landing": "welcomepage",
    "landing page": "welcomepage",
    "leaderboard": "ranking",
    "leaderboard page": "ranking",
    "log in page": "sign in",
    "login page": "sign in",
    "main layout": "main page",
    "main learning page": "main page",
    "message box": "messagebox",
    "notifications": "inbox",
    "register page": "sign up",
    "secion": "section",
    "signin page": "sign in",
    "sign in page": "sign in",
    "sign-in page": "sign in",
    "signup page": "sign up",
    "sign up page": "sign up",
    "sign-up page": "sign up",
    "text box": "textbox",
    "text field": "textbox",
    "text input": "textbox",
    "welcome page": "welcomepage",
}

LEGACY_GHERKIN_TOKENS = {"bdd", "gherkin"}

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

DISAMBIGUATION_PENALTIES = {
    "sign in": ["sign up", "signup", "register"],
    "sign up": ["sign in", "signin", "login"],
    "textbox": ["text"],
    "should be opened": ["go to", "navigate", "open"],
    "should be visible": ["toggle", "click", "set", "fill"],
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


def apply_phrase_map(text: str) -> str:
    mapped_text = text
    for source, target in sorted(GHERKIN_PHRASE_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        pattern = r"\b" + re.escape(source) + r"\b"
        mapped_text = re.sub(pattern, target, mapped_text)
    return mapped_text


def normalize_text(
    text: str,
    remove_stops: bool = True,
    ignore_quoted_text: bool = True,
) -> str:
    text_value = str(text or "")
    if ignore_quoted_text:
        text_value = QUOTED_TEXT_PATTERN.sub(" ", text_value)
    text_value = PLACEHOLDER_PATTERN.sub(r" \1 ", text_value)
    text_value = text_value.lower()
    text_value = apply_phrase_map(text_value)
    text_value = TEXT_SPLIT_PATTERN.sub(" ", text_value)
    text_value = MULTI_SPACE_PATTERN.sub(" ", text_value).strip()
    if not remove_stops:
        return text_value
    return " ".join(token for token in text_value.split() if token not in OPTIONAL_STOPS)


def tokenize(text: str, ignore_quoted_text: bool = True) -> list[str]:
    cleaned = normalize_text(text, remove_stops=True, ignore_quoted_text=ignore_quoted_text)
    return [token for token in cleaned.split(" ") if token]


def lexical_similarity(
    source: str,
    target: str,
    ignore_quoted_text_source: bool = True,
    ignore_quoted_text_target: bool = True,
) -> float:
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
    union = source_tokens.union(target_tokens)
    jaccard_score = (len(source_tokens.intersection(target_tokens)) / len(union)) if union else 0.0
    return (0.6 * sequence_score) + (0.4 * jaccard_score)


def calculate_element_type_boost(source: str, target: str) -> float:
    source_lower = source.lower()
    target_lower = target.lower()

    boost = 0.0
    for element_type in ELEMENT_TYPES:
        if element_type in source_lower and element_type in target_lower:
            boost += 0.10
    return min(boost, 0.15)


def calculate_disambiguation_penalty(source: str, target: str) -> float:
    source_lower = source.lower()
    target_lower = target.lower()

    penalty = 0.0
    for key, confused_terms in DISAMBIGUATION_PENALTIES.items():
        if key not in source_lower:
            continue
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
    """Deterministic local embedding model with hashing and IDF weighting."""

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
            for token in set(tokenize(text, ignore_quoted_text=False)):
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
            sign_hash = hashlib.blake2b(f"sign::{token}".encode("utf-8"), digest_size=8).digest()
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
    return [ArgSpec(name=match.group(0), default_value=None) for match in PLACEHOLDER_PATTERN.finditer(keyword_name)]


def parse_robot_keywords(resource_path: Path) -> list[KeywordEntry]:
    lines = resource_path.read_text(encoding="utf-8").splitlines()
    entries: list[KeywordEntry] = []

    in_keywords_section = False
    current_keyword_name = ""
    current_doc = ""
    current_tags: list[str] = []
    current_args: list[ArgSpec] = []
    current_arg_lines: list[str] = []
    collecting_arguments = False

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
        if not LEGACY_GHERKIN_TOKENS.intersection(lowered_tags):
            entries.append(
                KeywordEntry(
                    keyword_name=current_keyword_name,
                    source_file=str(resource_path),
                    documentation=current_doc,
                    tags=list(current_tags),
                    arguments=list(current_args),
                    embedded_arguments=parse_embedded_arguments(current_keyword_name),
                    normalized_text=normalize_text(
                        f"{current_keyword_name} {current_doc} {' '.join(arg.name for arg in current_args)}",
                        remove_stops=True,
                        ignore_quoted_text=False,
                    ),
                )
            )

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

        if not line.startswith((" ", "\t")):
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
            current_tags.extend(tag.strip() for tag in re.split(r"\s{2,}", raw_tags) if tag.strip())
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
        if not stripped or stripped.startswith("#"):
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

        if stripped.lower().startswith(("scenario:", "scenario outline:")):
            if current_scenario is not None:
                scenarios.append(current_scenario)
            scenario_name = stripped.split(":", 1)[1].strip() or f"Scenario {len(scenarios) + 1}"
            current_scenario = ScenarioEntry(
                name=scenario_name,
                tags=list(dict.fromkeys(pending_tags)),
                steps=[],
            )
            pending_tags = []
            continue

        if current_scenario is None:
            continue

        step_match = FEATURE_STEP_PATTERN.match(raw_line)
        if step_match:
            clause = step_match.group(1).title()
            step_text = step_match.group(2).strip()
            if step_text:
                current_scenario.steps.append(
                    FeatureStep(line_number=line_number, clause=clause, text=step_text)
                )
            continue

        if raw_line.startswith((" ", "\t")) and not stripped.startswith("|"):
            current_scenario.steps.append(
                FeatureStep(line_number=line_number, clause="Step", text=stripped)
            )

    if current_scenario is not None:
        scenarios.append(current_scenario)

    return FeatureDocument(
        source_file=str(feature_file),
        feature_name=feature_name,
        scenarios=scenarios,
    )


def load_feature_documents(features_root: Path) -> list[FeatureDocument]:
    return [parse_feature_file(feature_file) for feature_file in sorted(features_root.rglob("*.feature"))]


def extract_named_entity(step_text: str, entity_names: str | Iterable[str]) -> str | None:
    names = [entity_names] if isinstance(entity_names, str) else list(entity_names)
    for entity_name in names:
        escaped_name = re.escape(entity_name)
        before_match = re.search(
            rf"(?:'([^']+)'|\"([^\"]+)\")\s+{escaped_name}\b",
            step_text,
            re.IGNORECASE,
        )
        if before_match:
            return before_match.group(1) or before_match.group(2)

        after_match = re.search(
            rf"\b{escaped_name}\b\s+(?:named\s+)?(?:'([^']+)'|\"([^\"]+)\")",
            step_text,
            re.IGNORECASE,
        )
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
    page_match = re.search(
        r"(?:to|on|open)\s+(?:the\s+)?(?:'([^']+)'|\"([^\"]+)\"|([a-z0-9\-\s]+?))\s+page",
        step_text,
        re.IGNORECASE,
    )
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
    notification = extract_named_entity(step_text, "notification")
    list_name = extract_named_entity(step_text, "list")

    checkbox_state = None
    state_match = re.search(r"\b(checked|unchecked|check|uncheck|true|false|on|off)\b", lowered)
    if state_match:
        checkbox_state = state_match.group(1)

    lowered_no_quotes = QUOTED_TEXT_PATTERN.sub("", lowered)
    value = None
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
    expected_match = re.search(
        r"(?:contain|contains|equals?)\s+(?:'([^']+)'|\"([^\"]+)\")",
        step_text,
        re.IGNORECASE,
    )
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
    if re.search(r"(logs? in|signs? in).+credentials", lowered):
        return "sign_in_credentials"
    if re.search(r"\bsection\b.+\b(updated?|changed?)\b.+\b(clicking|triggering)\b.+\bbutton\b", lowered):
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
    if re.search(r"\b(select|choose|pick|click)\w*\b.+\blist item\b.+\bindex\b", lowered):
        return "click_list_item_at_index"
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
    if re.search(r"\bwait\b.+\b(?:\d+|second)", lowered):
        return "wait"
    return "generic"


def pick_rule_keywords(intent: str) -> list[str]:
    rule_map = {
        "button_visible": ["Button Should Be Visible"],
        "checkbox_state_assert": ["Checkbox State Should Be", "Verify If The Checkbox Status Is State"],
        "checkbox_visible": ["Checkbox Should Be Visible"],
        "clear_textbox": ["Clear Textbox"],
        "click_button": ["Click Button"],
        "click_checkbox": ["Click Checkbox", "Set Checkbox To State"],
        "click_list_item_at_index": ["Click List Item At Index"],
        "click_text": ["Click Text"],
        "close_browser": ["Close Browser Session"],
        "fill_textbox": ["Fill Textbox With Value", "Fill Textbox"],
        "list_count": ["List Item Count Should Be At Least"],
        "list_visible": ["List Should Be Visible"],
        "messagebox_visible": ["Messagebox Should Be Visible"],
        "navigate_page": ["Navigate To Page"],
        "notification_contains": ["Notification Should Contain Text"],
        "notification_visible": ["Notification Should Be Visible"],
        "open_browser": ["Open Browser Session"],
        "section_update_after_click": ["The section should be updated after clicking the button"],
        "textbox_contains": ["Textbox Contain Value"],
        "textbox_visible": ["Textbox Should Be Visible"],
        "text_visible": ["Text Should Be Visible"],
        "validate_page": ["Page Should Be Ready"],
        "sign_in_credentials": ["Sign In With Credentials", "Fill Sign In Form"],
        "wait": ["Wait For Second"],
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
        return entities.browser or next_quote("chromium"), quote_cursor
    if "PAGE" in key:
        return entities.page or next_quote("Home"), quote_cursor
    if key == "EMAIL":
        return (entities.emails[0] if entities.emails else next_quote("test@example.com")), quote_cursor
    if key in {"PASSWORD", "PASS"}:
        if len(entities.quoted_values) >= 2:
            for quoted in entities.quoted_values:
                if not EMAIL_PATTERN.fullmatch(quoted):
                    return quoted, quote_cursor
        return next_quote("password123"), quote_cursor
    if key == "FIRST_NAME":
        return next_quote("First"), quote_cursor
    if key == "LAST_NAME":
        return next_quote("Last"), quote_cursor
    if key in {"USERNAME", "USER_NAME"}:
        return next_quote("robot.user"), quote_cursor
    if key in {"SECTION", "SECTION_NAME"}:
        return entities.section or next_quote("section"), quote_cursor
    if key in {"TEXTBOX", "FIELD", "INPUT", "NAME"}:
        return (
            entities.textbox
            or entities.button
            or entities.text_name
            or entities.checkbox
            or entities.notification
            or entities.list_name
            or next_quote("primary")
        ), quote_cursor
    if key in {"BUTTON", "BUTTON_NAME"}:
        return entities.button or next_quote("primary"), quote_cursor
    if key == "TEXT":
        return entities.expected_text or entities.text_name or next_quote(""), quote_cursor
    if key == "CHECKBOX":
        return entities.checkbox or next_quote("primary"), quote_cursor
    if key == "NOTIFICATION":
        return entities.notification or next_quote("Container"), quote_cursor
    if key == "LIST":
        return entities.list_name or next_quote("primary"), quote_cursor
    if key in {"VALUE", "EXPECTED_VALUE", "EXPECTED_TEXT"}:
        return entities.value or entities.expected_text or next_quote(""), quote_cursor
    if key == "INDEX":
        return entities.numbers[0] if entities.numbers else "0", quote_cursor
    if key in {"COUNT", "MIN_COUNT"}:
        return entities.numbers[0] if entities.numbers else "1", quote_cursor
    if key == "STATUS":
        return next_quote("successful"), quote_cursor
    if key in {"STATE", "EXPECTED_STATE", "TARGET_STATE"}:
        return entities.checkbox_state or next_quote("checked"), quote_cursor
    return next_quote(""), quote_cursor


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
        values.append(value or "")
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
        values.append(value or "")
    return values, quote_cursor


def render_keyword_with_embedded_values(
    keyword_name: str,
    embedded_arguments: list[ArgSpec],
    embedded_values: list[str],
) -> str:
    rendered = keyword_name
    for arg, value in zip(embedded_arguments, embedded_values):
        if value:
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
    return clean.title() if clean else "Generated Step"


class GherkinStepMapper:
    """Map parsed Gherkin steps to executable Robot keywords."""

    def __init__(
        self,
        catalog: list[KeywordEntry],
        ignore_quoted_text: bool = True,
        semantic_weight: float = 0.85,
        lexical_weight: float = 0.15,
        embedding_dim: int = 384,
    ) -> None:
        if semantic_weight < 0 or lexical_weight < 0:
            raise ValueError("Similarity weights must be non-negative.")

        total_weight = semantic_weight + lexical_weight
        if total_weight <= 0:
            raise ValueError("At least one of semantic_weight or lexical_weight must be > 0.")
        if not catalog:
            raise ValueError("Keyword catalog cannot be empty.")

        self.catalog = catalog
        self.catalog_by_name = {entry.keyword_name: entry for entry in catalog}
        self.ignore_quoted_text = bool(ignore_quoted_text)
        self.semantic_weight = semantic_weight / total_weight
        self.lexical_weight = lexical_weight / total_weight
        self.embedding_dim = embedding_dim

        self.embedding_model = LocalEmbeddingModel(dimension=embedding_dim)
        self.keyword_texts = [
            entry.normalized_text
            or normalize_text(
                f"{entry.keyword_name} {entry.documentation} {' '.join(arg.name for arg in entry.arguments)}",
                remove_stops=True,
                ignore_quoted_text=False,
            )
            for entry in self.catalog
        ]
        self.embedding_model.fit(self.keyword_texts)
        self.keyword_vectors = self.embedding_model.encode_many(self.keyword_texts)

    @classmethod
    def from_resource_root(
        cls,
        resource_root: Path,
        ignore_quoted_text: bool = True,
        semantic_weight: float = 0.85,
        lexical_weight: float = 0.15,
        embedding_dim: int = 384,
    ) -> GherkinStepMapper:
        return cls(
            catalog=build_keyword_catalog(resource_root),
            ignore_quoted_text=ignore_quoted_text,
            semantic_weight=semantic_weight,
            lexical_weight=lexical_weight,
            embedding_dim=embedding_dim,
        )

    def analyze_step(self, step_text: str) -> StepAnalysis:
        return StepAnalysis(
            original_text=step_text,
            normalized_text=normalize_text(
                step_text,
                remove_stops=True,
                ignore_quoted_text=self.ignore_quoted_text,
            ),
            mapping_text=step_text,
            intent=detect_intent(step_text),
            entities=extract_entities(step_text),
        )

    def map_step(self, analysis: StepAnalysis) -> tuple[str, list[str], float, str]:
        for rule_keyword_name in pick_rule_keywords(analysis.intent):
            rule_keyword = self.catalog_by_name.get(rule_keyword_name)
            if rule_keyword is None:
                continue
            rendered_name, rule_args = build_keyword_call(rule_keyword, analysis)
            return rendered_name, rule_args, 0.98, "rule"

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
