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
QUOTED_TEXT_PATTERN = re.compile(r"['\"][^'\"]+['\"]")

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

    DEFAULT_PHRASE_MAP = {    
    "welcome page": "welcomepage", "landing page": "welcomepage", "landing": "welcomepage",
    "login page": "sign in", "log in page": "sign in","signin page": "sign in",
    "sign in page": "sign in", "sign-in page": "sign in",
    "signup page": "sign up", "sign up page": "sign up",
    "sign-up page": "sign up", "register page": "sign up",
    "main learning page": "main page", "main layout": "main page",
    "dashboard": "main page",
    "leaderboard": "ranking",
    "leaderboard page": "ranking",
    "sound page": "pronunciation",
    "sounds page": "pronunciation",
    "speaking page": "speak",
    "review page": "review",
    "notifications": "inbox",
    "error popup": "notification",
    "error message": "notification",
    "message box": "messagebox",
    "text box": "textbox",
    "text field": "textbox",
    "text input": "textbox",
    "input field": "textbox",
    "check box": "checkbox",
    "cta": "button",
    "action button": "button",
    "call to action": "button",
    "table": "list",
    "grid": "list",
    "collection": "list",
    "nav bar": "nav",
    "top bar": "topbar",
    "right bar": "rightbar",
    "side bar": "sidebar",
    "secion": "section",
}

    SYNONYMS = {
        "clicking": "click", "clicks": "click", "clicked": "click",
        "pressing": "press", "presses": "press", "pressed": "press",
        "navigating": "navigate", "navigates": "navigate", "redirected to": "navigate",
        "opens": "open",
        "checking": "check", "checks": "check", "checked": "check",
        "waiting": "wait", "waits": "wait", "waited": "wait",
        "selecting": "select", "selects": "select", "selected": "select",
        "entering": "enter", "enters": "enter", "entered": "enter",
        "scrolling": "scroll", "scrolls": "scroll", "scrolled": "scroll",
        "logging": "log", "logged": "log", "logs": "log", "log into": "log",
    }

    ACTION_PATTERNS = {
        "authenticate": [
            r"\b(sign in|log in|login|authenticate)\b.+\b(email|account|username)\b.+\b(password|pass)\b",
        ],
        'navigate': [
                r'(?:go to page|navigate To Page)\s+(.+)',
                r'open\s+(?:the\s+)?(.+?)(?:\s+page|\s+url)?',
        ],
        'click': [
                r'(?:user\s+)?clicks?\s+(?:on\s+)?(?:the\s+)?["\']?([^"\']+)["\']?\s+(?:button|link|text|checkbox|element)',
                r'click\s+(?:on\s+)?(?:the\s+)?(.+?)(?:\s+button|\s+link|\s+element)?',
                r'press\s+(?:the\s+)?(.+?)(?:\s+button)?',
                r'select\s+(?:the\s+)?(.+?)(?:\s+option)?',
        ],
        'input': [
                r'(?:enter|type|input)\s+["\'](.+?)["\'](?:\s+into|\s+in)?\s+(?:the\s+)?(.+?)(?:\s+field|\s+box)?',
                r'fill\s+(?:in\s+)?(?:the\s+)?(.+?)(?:\s+field|\s+box)?\s+with\s+["\'](.+?)["\']',
                r'set\s+(?:the\s+)?(.+?)\s+to\s+["\'](.+?)["\']',
        ],
        'verify': [
            r'(?:verify|check|ensure|confirm)\s+(?:that\s+)?(.+)',
            r'(?:should\s+see|should\s+contain|should\s+display)\s+(.+)',
            r'(?:shall|should|must)\s+(?:display|show|have|be)\s+(.+)',
            r'(?:should\s+be\s+(?:visible|opened|open|ready|displayed))',
            r'expect\s+(.+)',
            r'assert\s+(.+)',
        ],
        'search': [
            r"\b(search|find|look for)\b.+",
            ]
    }

    def __init__(
        self,
        phrase_map: Dict[str, Any] | None = None,
        ignore_quoted_text: bool = True,
    ) -> None:
        resolved_phrase_map = dict(self.DEFAULT_PHRASE_MAP)
        if phrase_map:
            resolved_phrase_map.update(phrase_map)
        self.phrase_map = self._normalize_phrase_map(resolved_phrase_map)
        self.synonym_map = self._build_synonym_map()
        self.ignore_quoted_text = bool(ignore_quoted_text)

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
        gherkin_intent = self._detect_gherkin_intent(original)
        actions = self._extract_actions(normalized, original_text=original, gherkin_intent=gherkin_intent)

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
        if self.ignore_quoted_text:
            cleaned = QUOTED_TEXT_PATTERN.sub(" ", cleaned)
        cleaned = cleaned.lower()
        cleaned = self._apply_phrase_map(cleaned)
        cleaned = self._apply_synonym_map(cleaned)
        cleaned = TEXT_SPACES.sub(" ", cleaned).strip()
        return cleaned

    def _build_synonym_map(self) -> Dict[str, str]:
        synonym_map: Dict[str, str] = {}
        for canonical, variants in self.SYNONYMS.items():
            canonical_key = str(canonical).lower().strip()
            if not canonical_key:
                continue
            if isinstance(variants, (list, tuple, set)):
                synonym_map[canonical_key] = canonical_key
                for variant in variants:
                    variant_key = str(variant).lower().strip()
                    if variant_key:
                        synonym_map[variant_key] = canonical_key
                continue
            variant_key = str(variants).lower().strip()
            if variant_key:
                synonym_map[canonical_key] = variant_key
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

    def _detect_gherkin_intent(self, text: str) -> str:
        """Detect Gherkin step intent from Given/When/Then keywords."""
        stripped = text.strip().lower()
        if stripped.startswith("given"):
            return "setup"
        if stripped.startswith("when"):
            return "action"
        if stripped.startswith("then"):
            return "assertion"
        if stripped.startswith("and") or stripped.startswith("but"):
            return "inherit"
        return "unknown"

    def _extract_original_quoted_names(self, text: str) -> List[str]:
        """Extract quoted names from original text before phrase normalization."""
        return re.findall(r'["\']([^"\']+)["\']', text)

    def _extract_actions(
        self,
        normalized_text: str,
        original_text: str = "",
        gherkin_intent: str = "unknown",
    ) -> List[RequirementAction]:
        actions: List[RequirementAction] = []

        # Extract quoted names from original text before normalization
        original_quoted_names = self._extract_original_quoted_names(original_text)

        # Split requirement into smaller clauses to capture chained actions.
        clauses = re.split(r";|(?:\band then\b)|(?:\bthen\b)|(?:\bafter\b)|(?:\bwhen\b)", normalized_text)
        for raw_clause in clauses:
            clause = raw_clause.strip()
            if len(clause) < 4:
                continue
            extracted = self._extract_action_from_clause(
                clause,
                original_quoted_names=original_quoted_names,
                gherkin_intent=gherkin_intent,
            )
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

    def _extract_action_from_clause(
        self,
        clause: str,
        original_quoted_names: List[str] | None = None,
        gherkin_intent: str = "unknown",
    ) -> RequirementAction | None:
        # Use first original quoted name if available, otherwise fall back to clause extraction
        original_names = original_quoted_names or []

        # Helper to get the original quoted name (preserves case and original text)
        def get_original_name(index: int = 0) -> str:
            if index < len(original_names):
                return original_names[index]
            # Fallback: extract from normalized clause
            quoted = re.search(r'["\']([^"\']+)["\']', clause)
            return quoted.group(1) if quoted else "${NAME}"

        # Special high-value pattern: explicit login credentials
        login_match = re.search(
            r"\b(sign in|signs in|log in|login)\b.+(?:email|account|username).+(?:password)\b",
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
                    target = (match.group(1) if match.groups() else "").strip(" '\"")
                    target = re.sub(r"\b(page|tab|screen)\b", "", target).strip()
                    target = re.sub(r"^the\s+", "", target).strip()
                    if original_names:
                        target = get_original_name(0)
                    # Browser start intent is common in requirements and should map to browser-open keyword.
                    if re.search(r"\b(browser|firefox|chrome|chromium|webkit|edge)\b", target):
                        browser_type = "firefox" if "firefox" in target else "${BROWSER}"
                        action_text = f"open browser '{browser_type}' session"
                        return RequirementAction(action_type="navigate", action_text=action_text, target=target)
                    action_text = f"navigate to page '{target}'" if target else "navigate to page '${PAGE}'"
                    return RequirementAction(action_type=action_type, action_text=action_text, target=target)
                if action_type == "click":
                    target = (match.group(1) if len(match.groups()) >= 1 else "").strip(" '\"")
                    element_type = "button"
                    if re.search(r"\bcheckbox\b", clause):
                        element_type = "checkbox"
                    elif re.search(r"\blink\b", clause):
                        element_type = "link"
                    elif re.search(r"\btab\b", clause):
                        element_type = "tab"
                    elif re.search(r"\blist item\b|\blist\b", clause):
                        element_type = "list item"
                    elif re.search(r"\btext\b", clause):
                        element_type = "text"
                    target = re.sub(r"\b(button|link|tab|item|menu|list|text|checkbox)\b", "", target).strip()
                    target = re.sub(r"^the\s+", "", target).strip()
                    # Use original quoted name if available
                    if original_names:
                        target = get_original_name(0)
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
                    # For Gherkin assertions (Then/And after Then), boost verification keywords
                    minimum_count = self._extract_minimum_count(clause)
                    if minimum_count is not None and re.search(r"\blist\b", clause):
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"list item '${{NAME}}' count should be at least '{minimum_count}'",
                            target="${NAME}",
                            value=str(minimum_count),
                        )
                    checkbox_state_match = re.search(
                        r"\b(?:state|status)\b.*\b(checked|unchecked|check|uncheck|true|false|on|off)\b",
                        clause,
                    )
                    if "checkbox" in clause and checkbox_state_match:
                        state_value = checkbox_state_match.group(1)
                        element_name = get_original_name(0)
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"checkbox '{element_name}' state should be '{state_value}'",
                            target=element_name,
                            value=state_value,
                        )
                    if re.search(r"\b(contain(s)?|show(s)?|display(s)?|say(s)?|has|with text)\b", clause):
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
                    # Use original quoted name for visibility checks
                    element_name = get_original_name(0)
                    if "checkbox" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"checkbox '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "notification" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"notification '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "messagebox" in clause or "message box" in clause or "modal" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"messagebox '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "section" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"section '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "link" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"link '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "textbox" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"textbox '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "text" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"text '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "button" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"button '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "list" in clause:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"list '{element_name}' should be visible",
                            target=element_name,
                        )
                    if "page" in clause:
                        page_name = get_original_name(0)
                        action_text = (
                            f"validate page '{page_name}' is opened ; "
                            f"'{page_name}' page should be ready"
                        )
                        return RequirementAction(
                            action_type=action_type,
                            action_text=action_text,
                            target=page_name,
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
        if element_type == "checkbox":
            return f"click checkbox '{name_token}'"
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
