#!/usr/bin/env python3
"""NLP preprocessing for free-form requirements.

This module converts human-written requirement text into structured actions
for semantic keyword mapping. (requirement-preprocessing)

text -> phrase_map -> synonyms -> action extraction
"""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any, Dict, List


TEXT_SPACES = re.compile(r"\s+")
LIST_PREFIX = re.compile(r"^\s*(?:[-*•]|\d+[.)])\s+")
BUILTIN_PHRASE_MAP = {
    "page": ["tab", "screen", "view"],
    "home page": ["home tab"],
    "challenge page": ["challenge tab"],
    "ranking page": ["leaderboard tab"],
    "sign in": ["signin", "sign-in", "login", "log in"],
    "sign up": ["signup", "sign-up", "register"],
    "button": ["cta", "action button", "call to action"],
    "textbox": ["input", "field", "text field"],
    "list": ["table", "grid", "collection"],
    "email": ["account", "email"],
    "password": ["password", "pwd", "passcode", "pass"],
    "notification": ["error popup", "error message", "failure message"],
    "issue": ["bug", "defect"],
    "section": ["section", "datagrid", "secion"],
}


@dataclass
class RequirementAction:
    """Single extracted action from free-form requirement text."""

    action_type: str
    action_text: str
    target: str = ""
    value: str = ""


@dataclass
class ProcessedRequirement:
    """Structured representation for semantic mapping."""

    requirement_type: str
    original_text: str
    normalized_text: str
    actions: List[RequirementAction]
    mapping_text: str


class RequirementNLPProcessor:
    """Extracts requirement type and action candidates from free text."""

    DEFAULT_PHRASE_MAP = BUILTIN_PHRASE_MAP

    SYNONYMS = {
        "click": ["click", "press", "tap", "select", "hit","clicks", "presses", "taps", "selects", "hits"],
        "input": ["input", "type", "enter", "fill", "write", "inputs", "types", "enters", "fills", "writes"],
        "verify": ["verify", "check", "assert", "validate", "confirm", "ensure", "expects", "verifies", "checks", "asserts", "validates", "confirms", "ensures"],
        "navigate": ["navigates", "go","goes", "open", "visit", "browse", "access", "reach", "move to", "head to", "jump to", "opens", "visits", "browses", "accesses", "reaches", "moves to", "heads to", "jumps to"],
        "wait": ["wait", "pause", "delay", "sleep", "waits", "pauses", "delays", "sleeps"],
        "close": ["close", "quit", "exit", "terminate", "end", "closes", "quits", "exits", "terminates", "ends"],
        "submit": ["submit", "send", "post", "confirm", "submits", "sends", "posts", "confirms"],
        "scroll": ["scroll", "swipe", "drag", "scrolls", "swipes", "drags","scrolling"],
        "search": ["search", "find", "locate", "query", "lookup", "look for", "seek", "explore", "look up"],
        "login": ["login", "signin", "authenticate", "logon", "sign in", "log in", "sign on", "log on"],
        "logout": ["logout", "signout", "logoff", "sign off", "log off", "sign out", "logs out", "signs out",  "sign offs"],
        "select": ["selects", "chooses","choose", "pick", "picks", "triggers", "trigger"],

    }

    ACTION_PATTERNS = {
        "authenticate": [
            r"\b(sign in|log in|login|authenticate)\b.+\b(email|account|username)\b.+\b(password|pass)\b",
        ],
        "navigate": [
            r"\b(go to|navigate to|open|visit)\s+(?:the\s+)?(.+)$",
        ],
        "click": [
            r"\b(click|press|select|tap)\s+(?:on\s+)?(?:the\s+)?(.+)$",
        ],
        "input": [
            r"\b(fill|enter|type|input|set)\b.+",
        ],
        "verify": [
            r"\b(should|must|verify|check|confirm|ensure|expect)\b.+",
        ],
        'search': [
            r"\b(search|find|look for)\b.+",
            ]
    }

    def __init__(self, phrase_map: Dict[str, Any] | None = None) -> None:
        resolved_phrase_map = dict(self.DEFAULT_PHRASE_MAP)
        if phrase_map:
            resolved_phrase_map.update(phrase_map)
        self.phrase_map = self._normalize_phrase_map(resolved_phrase_map)
        self.synonym_map = self._build_synonym_map()

    def _normalize_phrase_map(self, raw_phrase_map: Dict[str, Any]) -> Dict[str, str]:
        normalized: Dict[str, str] = {}
        for source, target in raw_phrase_map.items():
            canonical = str(source).lower().strip()
            if not canonical:
                continue

            if isinstance(target, str):
                target_text = target.lower().strip()
                if target_text:
                    normalized[canonical] = target_text
                continue

            # Support canonical -> [synonym, ...] style phrase maps.
            if isinstance(target, (list, tuple, set)):
                normalized[canonical] = canonical
                for raw_variant in target:
                    variant = str(raw_variant).lower().strip()
                    if variant:
                        normalized[variant] = canonical
                continue

            target_text = str(target).lower().strip()
            if target_text:
                normalized[canonical] = target_text

        return normalized

    def preprocess_requirement_text(self, text: str) -> ProcessedRequirement:
        """Convert requirement text to a normalized, action-augmented mapping text."""
        original = str(text or "").strip()
        normalized = self._normalize_text(original)
        requirement_type = self._detect_requirement_type(normalized)
        actions = self._extract_actions(normalized)

        # Keep original wording for traceability and append extracted actions for stronger matching.
        action_fragments = [action.action_text for action in actions]
        if action_fragments:
            mapping_text = f"{original} ; extracted actions: " + " ; ".join(action_fragments)
        else:
            mapping_text = original

        return ProcessedRequirement(
            requirement_type=requirement_type,
            original_text=original,
            normalized_text=normalized,
            actions=actions,
            mapping_text=mapping_text.strip(),
        )

    def _normalize_text(self, text: str) -> str:
        cleaned = LIST_PREFIX.sub("", text.strip())
        cleaned = cleaned.lower()
        cleaned = self._apply_phrase_map(cleaned)
        cleaned = self._apply_synonym_map(cleaned)
        cleaned = TEXT_SPACES.sub(" ", cleaned).strip()
        return cleaned

    def _build_synonym_map(self) -> Dict[str, str]:
        synonym_map: Dict[str, str] = {}
        for canonical, variants in self.SYNONYMS.items():
            canonical_key = canonical.lower().strip()
            if not canonical_key:
                continue
            synonym_map[canonical_key] = canonical_key
            for variant in variants:
                variant_key = str(variant).lower().strip()
                if variant_key:
                    synonym_map[variant_key] = canonical_key
        return synonym_map

    def _apply_phrase_map(self, text: str) -> str:
        mapped = text
        ordered_pairs = sorted(self.phrase_map.items(), key=lambda item: len(item[0]), reverse=True)
        for source, target in ordered_pairs:
            if not source:
                continue
            pattern = r"\b" + re.escape(source) + r"\b"
            mapped = re.sub(pattern, target, mapped)
        return mapped

    def _apply_synonym_map(self, text: str) -> str:
        mapped = text
        ordered_pairs = sorted(self.synonym_map.items(), key=lambda item: len(item[0]), reverse=True)
        for source, target in ordered_pairs:
            if not source:
                continue
            pattern = r"\b" + re.escape(source) + r"\b"
            mapped = re.sub(pattern, target, mapped)
        return mapped

    def _detect_requirement_type(self, normalized_text: str) -> str:
        # User Story patterns
        if re.search(r"\bas a\b.+\bi want\b", normalized_text):
            return "user_story"
        # Bug report patterns
        if re.search(r"\b(bug|defect|issue|error|fails|failure|unexpected)\b", normalized_text):
            return "bug_report"
        # Functional requirement patterns
        if re.search(r"\b(shall|must|should|system should|the system)\b", normalized_text):
            return "functional_requirement"
        return "general_requirement"

    def _extract_actions(self, normalized_text: str) -> List[RequirementAction]:
        actions: List[RequirementAction] = []

        # Split requirement into smaller clauses to capture chained actions.
        clauses = re.split(r"[.;]|(?:\band then\b)|(?:\bthen\b)|(?:\bafter\b)|(?:\bwhen\b)", normalized_text)
        for raw_clause in clauses:
            clause = raw_clause.strip()
            if len(clause) < 4:
                continue
            extracted = self._extract_action_from_clause(clause)
            if extracted:
                actions.append(extracted)

        # De-duplicate by action text while preserving order.
        seen = set()
        unique_actions: List[RequirementAction] = []
        for action in actions:
            key = (action.action_type, action.action_text)
            if key in seen:
                continue
            seen.add(key)
            unique_actions.append(action)
        return unique_actions

    def _extract_action_from_clause(self, clause: str) -> RequirementAction | None:
        # Special high-value pattern: explicit login credentials
        login_match = re.search(
            r"\b(sign in|log in|login)\b.+(?:email|account|username).+(?:password)\b",
            clause,
        )
        if login_match:
            return RequirementAction(
                action_type="authenticate",
                action_text=(
                    "fill textbox '${NAME}' with value '${VALUE}' for email and password ; "
                    "click button '${NAME}'"
                ),
                target="sign in",
            )

        for action_type, patterns in self.ACTION_PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, clause)
                if not match:
                    continue
                if action_type == "navigate":
                    target = (match.group(2) if len(match.groups()) >= 2 else "").strip(" '\"")
                    target = re.sub(r"\b(page|tab|screen)\b", "", target).strip()
                    target = re.sub(r"^the\s+", "", target).strip()
                    # Browser start intent is common in requirements and should map to browser-open keyword.
                    if re.search(r"\b(browser|firefox|chrome|chromium|webkit|edge)\b", target):
                        browser_type = "firefox" if "firefox" in target else "${BROWSER}"
                        action_text = f"open browser '{browser_type}' session"
                        return RequirementAction(action_type="navigate", action_text=action_text, target=target)
                    action_text = f"navigate to page '{target}'" if target else "navigate to page '${PAGE}'"
                    return RequirementAction(action_type=action_type, action_text=action_text, target=target)
                if action_type == "click":
                    target = (match.group(2) if len(match.groups()) >= 2 else "").strip(" '\"")
                    element_type = "button"
                    if re.search(r"\blink\b", clause):
                        element_type = "link"
                    elif re.search(r"\btab\b", clause):
                        element_type = "tab"
                    elif re.search(r"\blist item\b|\blist\b", clause):
                        element_type = "list item"
                    elif re.search(r"\btext\b", clause):
                        element_type = "text"
                    target = re.sub(r"\b(button|link|tab|item|menu|list|text)\b", "", target).strip()
                    target = re.sub(r"^the\s+", "", target).strip()
                    index_value = self._extract_index_value(clause)
                    keyword_base = self._format_click_keyword(element_type, target, index_value)
                    action_text = keyword_base
                    return RequirementAction(action_type=action_type, action_text=action_text, target=target)
                if action_type == "input":
                    return RequirementAction(
                        action_type=action_type,
                        action_text="fill textbox '${NAME}' with value '${VALUE}'",
                    )
                if action_type == "verify":
                    minimum_count = self._extract_minimum_count(clause)
                    if minimum_count is not None and re.search(r"\blist\b", clause):
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"list item '${{NAME}}' count should be at least '{minimum_count}'",
                            target="${NAME}",
                            value=str(minimum_count),
                        )
                    if re.search(r"\bcontain(s)?\b", clause):
                        if re.search(r"\btextbox\b|\bfield\b", clause):
                            return RequirementAction(
                                action_type=action_type,
                                action_text="textbox '${NAME}' value should contain '${EXPECTED_VALUE}'",
                                target="${NAME}",
                                value="${EXPECTED_VALUE}",
                            )
                        if "notification" in clause:
                            return RequirementAction(
                                action_type=action_type,
                                action_text="notification '${NAME}' should contain text '${EXPECTED_TEXT}'",
                                target="${NAME}",
                                value="${EXPECTED_TEXT}",
                            )
                        if "messagebox" in clause or "message box" in clause or "modal" in clause:
                            return RequirementAction(
                                action_type=action_type,
                                action_text="messagebox '${NAME}' should contain text '${EXPECTED_TEXT}'",
                                target="${NAME}",
                                value="${EXPECTED_TEXT}",
                            )
                        if "section" in clause:
                            return RequirementAction(
                                action_type=action_type,
                                action_text="section '${NAME}' should contain text '${EXPECTED_TEXT}'",
                                target="${NAME}",
                                value="${EXPECTED_TEXT}",
                            )
                        if "link" in clause:
                            return RequirementAction(
                                action_type=action_type,
                                action_text="link '${NAME}' should contain text '${EXPECTED_TEXT}'",
                                target="${NAME}",
                                value="${EXPECTED_TEXT}",
                            )
                        if "text" in clause:
                            return RequirementAction(
                                action_type=action_type,
                                action_text="text '${NAME}' should contain text '${EXPECTED_TEXT}'",
                                target="${NAME}",
                                value="${EXPECTED_TEXT}",
                            )
                    quoted = re.search(r"['\"]([^'\"]+)['\"]", clause)
                    if "checkbox" in clause:
                        checkbox_name = quoted.group(1) if quoted else "${NAME}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"checkbox '{checkbox_name}' should be visible",
                            target=checkbox_name,
                        )
                    if "notification" in clause:
                        note_name = quoted.group(1) if quoted else "${NAME}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"notification '{note_name}' should be visible",
                            target=note_name,
                        )
                    if "messagebox" in clause or "message box" in clause or "modal" in clause:
                        message_name = quoted.group(1) if quoted else "${NAME}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"messagebox '{message_name}' should be visible",
                            target=message_name,
                        )
                    if "section" in clause:
                        section_name = quoted.group(1) if quoted else "${NAME}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"section '{section_name}' should be visible",
                            target=section_name,
                        )
                    if "link" in clause:
                        link_name = quoted.group(1) if quoted else "${NAME}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"link '{link_name}' should be visible",
                            target=link_name,
                        )
                    if "text" in clause:
                        text_name = quoted.group(1) if quoted else "${NAME}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"text '{text_name}' should be visible",
                            target=text_name,
                        )
                    if "button" in clause:
                        button_name = quoted.group(1) if quoted else "${NAME}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"button '{button_name}' should be visible",
                            target=button_name,
                        )
                    if "list" in clause:
                        list_name = quoted.group(1) if quoted else "${NAME}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"list '{list_name}' should be visible",
                            target=list_name,
                        )
                    if "page" in clause:
                        state = "ready" if "ready" in clause else "opened"
                        if state == "ready":
                            return RequirementAction(
                                action_type=action_type,
                                action_text="validate page '${PAGE}' is opened",
                            )
                        return RequirementAction(
                            action_type=action_type,
                            action_text="validate page '${PAGE}' is opened",
                        )
                    return None
                return RequirementAction(action_type=action_type, action_text=clause)
        return None

    def _extract_index_value(self, clause: str) -> int | None:
        lower_clause = clause.lower()
        if "first" in lower_clause:
            return 0
        if "second" in lower_clause:
            return 1
        if "third" in lower_clause:
            return 2
        if "fourth" in lower_clause:
            return 3
        match = re.search(r"\bindex\s*(\d+)\b", lower_clause)
        if match:
            return max(int(match.group(1)), 0)
        return None

    def _format_click_keyword(self, element_type: str, target: str, index_value: int | None) -> str:
        name_token = target or "${NAME}"
        if element_type == "link":
            return f"click link '{name_token}'"
        if element_type == "tab":
            return f"click tab '{name_token}'"
        if element_type == "list item":
            if index_value is not None:
                return f"click list item '{name_token}' at index '{index_value}'"
            return f"click list item '{name_token}'"
        if element_type == "text":
            return f"click text '{name_token}'"
        if index_value is not None:
            return f"click button '{name_token}' at index '{index_value}'"
        return f"click button '{name_token}'"

    def _extract_minimum_count(self, clause: str) -> int | None:
        match = re.search(r"\bat least\s+(\d+)\b", clause)
        if match:
            return int(match.group(1))
        return None
