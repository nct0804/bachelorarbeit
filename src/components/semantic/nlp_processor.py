#!/usr/bin/env python3
"""NLP preprocessing for free-form requirements.

This module converts human-written requirement text into structured actions
for semantic keyword mapping. It is tuned to the current Robot Framework
resource library (no TAGS and no duplicated wrapper keywords).
"""

from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import Any, Dict, List


TEXT_SPACES = re.compile(r"\s+")
LIST_PREFIX = re.compile(r"^\s*(?:[-*•]|\d+[.)])\s+")
GHERKIN_STEP = re.compile(r"^\s*(given|when|then|and|but)\s+", re.IGNORECASE)
USER_STORY = re.compile(r"\bas a\b.+?\bi want\b\s+(?P<want>.+?)(?:\s+so that\b|$)", re.IGNORECASE)


STEM_MAP = {
    "clicking": "click", "clicks": "click", "clicked": "click",
    "pressing": "press", "presses": "press", "pressed": "press",
    "navigating": "navigate","redirected to":"navigate",
    "checking": "check", "checks": "check", "checked": "check",
    "waiting": "wait", "waits": "wait", "waited": "wait",
    "selecting": "select", "selects": "select", "selected": "select",
    "entering": "enter", "enters": "enter", "entered": "enter",
    "scrolling": "scroll", "scrolls": "scroll", "scrolled": "scroll",
    "logging": "log", "logged": "log","logs": "log", "log into": "log",
}


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
    "nav bar": "nav",
    "top bar": "topbar",
    "right bar": "rightbar",
    "side bar": "sidebar",
    "secion": "section",
}


DEFAULT_PAGE_ALIASES = {
    "welcomepage": "Welcome Page", "landing": "Welcome Page", "landing page": "Welcome Page",
    "sign in": "Sign In", "signin": "Sign In", "log in": "Sign In",
    "login": "Sign In", "sign up": "Sign Up",
    "signup": "Sign Up", "register": "Sign Up",
    "main page": "Main Page",
    "main learning page": "Main Page",
    "main layout": "Main Page",
    "home": "Main Page",
    "dashboard": "Main Page",
    "challenge": "Challenge",
    "challenge page": "Challenge",
    "ranking": "Ranking",
    "leaderboard": "Ranking",
    "pronunciation": "Pronunciation",
    "sounds": "Pronunciation",
    "speak": "Speak",
    "speaking": "Speak",
    "review": "Review",
    "inbox": "Inbox",
    "notifications": "Inbox",
    "achievements": "Achievements",
    "badges": "Achievements",
    "about": "About Us",
    "about us": "About Us",
    "profile": "Profile",
    "user profile": "Profile",
    "learn": "Learn",
    "learning": "Learn",
}


SYNONYMS = {
    "click": ["click", "press", "tap", "select", "hit"],
    "input": ["input", "type", "enter", "fill", "write"],
    "verify": ["verify", "check", "assert", "validate", "confirm", "ensure", "expect"],
    "navigate": ["redirected to","navigate", "go", "open", "visit", "browse", "access", "reach"],
    "wait": ["wait", "pause", "delay", "sleep"],
    "close": ["close", "quit", "exit", "terminate", "end"],
    "submit": ["submit", "send", "post", "confirm"],
    "scroll": ["scroll", "swipe", "drag"],
    "search": ["search", "find", "locate", "query", "lookup", "look for"],
    "login": ["login", "signin", "sign in", "log in", "authenticate", "logon"],
    "logout": ["logout", "signout", "sign out", "log out", "logoff"],
    "select": ["select", "choose", "pick", "trigger"],
}


ELEMENT_TYPE_HINTS = {
    "button": ["button", "cta", "submit", "save", "start"],
    "link": ["link"],
    "tab": ["tab"],
    "list": ["list", "table", "grid"],
    "section": ["section", "panel", "card"],
    "modal": ["modal", "dialog", "popup"],
    "notification": ["notification", "toast", "alert"],
    "messagebox": ["message", "error", "warning"],
    "textbox": ["textbox", "input", "field"],
    "checkbox": ["checkbox", "toggle", "switch"],
}


VISIBILITY_KEYWORDS = {
    "button": "Button Should Be Visible",
    "link": "Link Should Be Visible",
    "tab": "Tab Should Be Visible",
    "list": "List Should Be Visible",
    "section": "Section Should Be Visible",
    "notification": "Notification Should Be Visible",
    "messagebox": "Messagebox Should Be Visible",
    "modal": "Modal Should Be Visible",
    "textbox": "Textbox Should Be Visible",
    "checkbox": "Checkbox Should Be Visible",
}

NEG_VISIBILITY_KEYWORDS = {
    "notification": "Notification Should Not Be Visible",
    "messagebox": "Messagebox Should Not Be Visible",
    "modal": "Modal Should Not Be Visible",
}

CLICK_KEYWORDS = {
    "button": "Click Button",
    "link": "Click Link",
    "tab": "Click Tab",
    "list": "Click List Item",
}

INPUT_KEYWORD = "Fill Textbox"
NAVIGATE_KEYWORD = "Navigate To Page"
BROWSER_OPEN_KEYWORD = "Open Browser Session"
BROWSER_CLOSE_KEYWORD = "Close Browser Session"

TITLE_OVERRIDES = {
    "xp": "XP",
    "ui": "UI",
    "api": "API",
    "jwt": "JWT",
    "cta": "CTA",
}


@dataclass
class RequirementAction:
    """Single extracted action from free-form requirement text."""

    action_type: str
    action_text: str
    target: str = ""
    value: str = ""
    keyword_hints: List[str] = field(default_factory=list)


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

    ACTION_PATTERNS = {
        "navigate": [
            r"\b(?:go to|navigate to|open|visit|browse|access|reach)\b\s+(?:the\s+)?(?P<target>.+)$",
            r"\bis on\b\s+(?:the\s+)?(?P<target>.+?)\s+(?:page|screen|view)\b",
        ],
        "click": [
            r"\b(?:click|press|tap|select|choose|pick|trigger)\b\s+(?:on\s+)?(?:the\s+)?(?P<target>.+)$",
        ],
        "input": [
            r"\b(?:enter|type|input)\b\s+[\"'](?P<value>.+?)[\"']\s+(?:into|in|to)\s+(?:the\s+)?(?P<target>.+)$",
            r"\bfill\b\s+(?:in\s+)?(?:the\s+)?(?P<target>.+?)\s+with\s+[\"'](?P<value>.+?)[\"']",
            r"\bset\b\s+(?:the\s+)?(?P<target>.+?)\s+to\s+(?P<value>.+)$",
        ],
        "verify": [
            r"\b(?:verify|check|ensure|confirm|expect|assert)\b\s+(?:that\s+)?(?P<target>.+)$",
            r"\b(?:should|must)\b\s+(?:be\s+)?(?P<target>.+)$",
        ],
        "submit": [
            r"\bsubmit\b(?:\s+the\s+)?(?P<target>.+)?$",
        ],
        "scroll": [
            r"\b(?:scroll|swipe|drag)\b\s+(?:to\s+)?(?:the\s+)?(?P<target>.+)?$",
        ],
        "wait": [
            r"\b(?:wait|pause|delay|sleep)\b(?:\s+for\s+)?(?P<target>.+)?$",
        ],
        "search": [
            r"\b(?:search|find|look for|lookup)\b\s+(?:for\s+)?(?P<value>.+)$",
        ],
    }

    def __init__(
        self,
        phrase_map: Dict[str, Any] | None = None,
        page_aliases: Dict[str, str] | None = None,
    ) -> None:
        resolved_phrase_map = dict(DEFAULT_PHRASE_MAP)
        if phrase_map:
            resolved_phrase_map.update(phrase_map)
        self.phrase_map = self._normalize_phrase_map(resolved_phrase_map)
        self.synonym_map = self._build_synonym_map()
        resolved_page_aliases = dict(DEFAULT_PAGE_ALIASES)
        if page_aliases:
            resolved_page_aliases.update(page_aliases)
        self.page_aliases = {key.lower(): value for key, value in resolved_page_aliases.items()}

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
        requirement_type = self._detect_requirement_type(original, normalized)
        actions = self._extract_actions(original)

        action_fragments: list[str] = []
        for action in actions:
            if action.action_text:
                action_fragments.append(action.action_text)
            action_fragments.extend(action.keyword_hints)
        mapping_text = original
        if action_fragments:
            deduped = list(dict.fromkeys(action_fragments))
            mapping_text = f"{original} ; extracted actions: " + " ; ".join(deduped)

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
        cleaned = self._apply_stem_map(cleaned)
        return cleaned

    def _apply_stem_map(self, text: str) -> str:
        tokens = [STEM_MAP.get(token, token) for token in text.split()]
        return " ".join(tokens)

    def _build_synonym_map(self) -> Dict[str, str]:
        synonym_map: Dict[str, str] = {}
        for canonical, variants in SYNONYMS.items():
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

    def _detect_requirement_type(self, original_text: str, normalized_text: str) -> str:
        if self._looks_like_gherkin(original_text):
            return "gherkin"
        if USER_STORY.search(original_text):
            return "user_story"
        if re.search(r"\b(bug|defect|issue|error|fails|failure|unexpected)\b", normalized_text):
            return "bug_report"
        if re.search(r"\b(shall|must|should|system should|the system)\b", normalized_text):
            return "functional_requirement"
        return "general_requirement"

    def _looks_like_gherkin(self, text: str) -> bool:
        if re.search(r"^\s*scenario:", text, re.IGNORECASE | re.MULTILINE):
            return True
        for line in text.splitlines():
            if GHERKIN_STEP.match(line):
                return True
        return False

    def _extract_actions(self, text: str) -> List[RequirementAction]:
        actions: List[RequirementAction] = []

        clauses = self._split_into_clauses(text)
        for raw_clause in clauses:
            clause = raw_clause.strip()
            if len(clause) < 3:
                continue
            extracted = self._extract_action_from_clause(clause)
            if extracted:
                actions.append(extracted)

        seen = set()
        unique_actions: List[RequirementAction] = []
        for action in actions:
            key = (action.action_type, action.action_text)
            if key in seen:
                continue
            seen.add(key)
            unique_actions.append(action)
        return unique_actions

    def _split_into_clauses(self, text: str) -> List[str]:
        if self._looks_like_gherkin(text):
            clauses: List[str] = []
            for line in text.splitlines():
                match = GHERKIN_STEP.match(line)
                if not match:
                    continue
                clause = GHERKIN_STEP.sub("", line).strip()
                if clause:
                    clauses.append(clause)
            return clauses

        user_story_match = USER_STORY.search(text)
        if user_story_match:
            want_clause = user_story_match.group("want").strip()
            if want_clause:
                return [want_clause]

        normalized_text = self._normalize_text(text)
        return [
            clause.strip()
            for clause in re.split(
                r"[.;]|(?:\band then\b)|(?:\bthen\b)|(?:\bafter\b)|(?:\bwhen\b)",
                normalized_text,
            )
            if clause.strip()
        ]

    def _extract_action_from_clause(self, clause: str) -> RequirementAction | None:
        raw_clause = clause.strip()
        normalized_clause = self._normalize_text(raw_clause)
        login_related = re.search(r"\b(sign in|log in|login|logging in|signing in)\b", normalized_clause)

        if re.search(r"\b(sign in|log in|login)\b.+\b(email|account|username)\b.+\b(password|pass)\b", normalized_clause):
            return RequirementAction(
                action_type="authenticate",
                action_text="Sign In With Credentials ${Email} ${Password}",
                target="Sign In",
                keyword_hints=["Go To Sign In Page", "Sign In Page Should Be Ready"],
            )
        if login_related:
            if not re.search(r"\b(go to|goto|navigate)\b", normalized_clause):
                return RequirementAction(
                    action_type="authenticate",
                    action_text="Sign In With Credentials ${Email} ${Password}",
                    target="Sign In",
                    keyword_hints=["Go To Sign In Page", "Sign In Page Should Be Ready"],
                )

        if re.search(r"\b(open|launch|start)\b.+\b(browser|firefox|chrome|chromium|edge|webkit)\b", raw_clause, re.IGNORECASE):
            browser_type = "firefox" if "firefox" in raw_clause.lower() else "${BROWSER}"
            return RequirementAction(
                action_type="navigate",
                action_text=f"{BROWSER_OPEN_KEYWORD} {browser_type}",
                target=browser_type,
            )

        if re.search(r"\b(close|quit|exit)\b.+\b(browser|firefox|chrome|chromium|edge|webkit)\b", raw_clause, re.IGNORECASE):
            return RequirementAction(
                action_type="close",
                action_text=BROWSER_CLOSE_KEYWORD,
            )

        page_target = self._find_page_target(normalized_clause)
        if page_target and re.search(r"\bis on\b|\bon\b.+\bpage\b|\bpage\b", normalized_clause):
            return RequirementAction(
                action_type="verify",
                action_text=f"Validate Page Is Opened {page_target}",
                target=page_target,
                keyword_hints=[f"{NAVIGATE_KEYWORD} {page_target}"],
            )

        for action_type, patterns in self.ACTION_PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, normalized_clause)
                if not match:
                    continue

                if action_type == "navigate":
                    target_text = match.groupdict().get("target", "").strip()
                    page_name = self._resolve_page_name(target_text, normalized_clause)
                    target = page_name or self._title_case(target_text)
                    action_text = f"{NAVIGATE_KEYWORD} {target}" if target else f"{NAVIGATE_KEYWORD} ${'{PAGE}'}"
                    hints = [f"Validate Page Is Opened {target}"] if target else []
                    return RequirementAction(
                        action_type=action_type,
                        action_text=action_text,
                        target=target,
                        keyword_hints=hints,
                    )

                if action_type == "click":
                    raw_target = match.groupdict().get("target", "").strip()
                    target = self._normalize_target(raw_target)
                    element_type = self._detect_element_type(raw_clause)
                    keyword = CLICK_KEYWORDS.get(element_type, CLICK_KEYWORDS["button"])
                    action_text = f"{keyword} {target}" if target else f"{keyword} ${'{Button}'}"
                    return RequirementAction(
                        action_type=action_type,
                        action_text=action_text,
                        target=target,
                    )

                if action_type == "input":
                    target_text = match.groupdict().get("target", "").strip()
                    value_text = match.groupdict().get("value", "").strip()
                    target = self._normalize_target(target_text)
                    value = value_text.strip("'\"")
                    action_text = (
                        f"{INPUT_KEYWORD} {target} {value}"
                        if target
                        else f"{INPUT_KEYWORD} ${'{Textbox}'} ${'{Value}'}"
                    )
                    return RequirementAction(
                        action_type=action_type,
                        action_text=action_text,
                        target=target,
                        value=value,
                    )

                if action_type == "verify":
                    element_type = self._detect_element_type(raw_clause)
                    negative = bool(re.search(r"\bnot\b|\bno\b", normalized_clause)) and bool(
                        re.search(r"\bvisible\b|\bshown\b|\bdisplayed\b", normalized_clause)
                    )
                    page_name = self._resolve_page_name(match.groupdict().get("target", ""), normalized_clause)
                    if page_name:
                        return RequirementAction(
                            action_type=action_type,
                            action_text=f"Validate Page Is Opened {page_name}",
                            target=page_name,
                        )
                    target = self._extract_quoted_or_target(raw_clause, match.groupdict().get("target", ""))
                    target = self._normalize_target(target)
                    if negative and element_type in NEG_VISIBILITY_KEYWORDS:
                        keyword = NEG_VISIBILITY_KEYWORDS[element_type]
                        action_text = f"{keyword} {target}" if target else f"{keyword} ${'{Name}'}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=action_text,
                            target=target,
                        )
                    keyword = VISIBILITY_KEYWORDS.get(element_type)
                    if keyword:
                        action_text = f"{keyword} {target}" if target else f"{keyword} ${'{Name}'}"
                        return RequirementAction(
                            action_type=action_type,
                            action_text=action_text,
                            target=target,
                        )
                    return None

                if action_type == "submit":
                    target = self._normalize_target(match.groupdict().get("target", "") or "Submit")
                    action_text = f"Click Button {target}"
                    return RequirementAction(
                        action_type="click",
                        action_text=action_text,
                        target=target,
                    )

                if action_type == "scroll":
                    target = self._normalize_target(match.groupdict().get("target", ""))
                    if "section" in normalized_clause or self._detect_element_type(raw_clause) == "section":
                        action_text = f"Scroll To Section {target}" if target else f"Scroll To Section ${'{Section}'}"
                    else:
                        action_text = f"Scroll Into Element {target}" if target else "Scroll Into Element ${Element}"
                    return RequirementAction(
                        action_type=action_type,
                        action_text=action_text,
                        target=target,
                    )

                if action_type == "wait":
                    return RequirementAction(
                        action_type=action_type,
                        action_text="Wait For Load State",
                    )

                if action_type == "search":
                    value = match.groupdict().get("value", "").strip("'\"")
                    action_text = f"{INPUT_KEYWORD} Search {value}" if value else f"{INPUT_KEYWORD} Search ${'{Value}'}"
                    return RequirementAction(
                        action_type="input",
                        action_text=action_text,
                        target="Search",
                        value=value,
                        keyword_hints=["Click Button Search"],
                    )

        if re.search(r"\b(sign out|log out|logout)\b", normalized_clause):
            return RequirementAction(
                action_type="click",
                action_text="Click Button Logout",
                target="Logout",
                keyword_hints=["Cancel Logout From Main Menu", "Confirm Logout From Main Menu"],
            )

        return None

    def _find_page_target(self, normalized_clause: str) -> str:
        for alias in sorted(self.page_aliases, key=len, reverse=True):
            if alias and alias in normalized_clause:
                return self.page_aliases[alias]
        return ""

    def _resolve_page_name(self, raw_target: str, normalized_clause: str) -> str:
        normalized_target = self._normalize_text(raw_target)
        if normalized_target in self.page_aliases:
            return self.page_aliases[normalized_target]
        clause_target = self._find_page_target(normalized_clause)
        if clause_target:
            return clause_target
        return self._title_case(normalized_target) if normalized_target else ""

    def _detect_element_type(self, clause: str) -> str:
        clause_lower = clause.lower()
        for element_type, hints in ELEMENT_TYPE_HINTS.items():
            if any(hint in clause_lower for hint in hints):
                return element_type
        return "button"

    def _extract_quoted_or_target(self, raw_clause: str, fallback: str) -> str:
        quoted = re.search(r"[\"']([^\"']+)[\"']", raw_clause)
        if quoted:
            return quoted.group(1)
        return fallback

    def _normalize_target(self, raw_target: str) -> str:
        if not raw_target:
            return ""
        cleaned = raw_target.strip().strip("'\"")
        cleaned = re.sub(r"\b(button|link|tab|item|menu|page|screen|view|field|textbox|input)\b", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"^the\s+", "", cleaned, flags=re.IGNORECASE).strip()
        if not cleaned:
            return ""
        return self._title_case(cleaned)

    def _title_case(self, text: str) -> str:
        words = []
        for raw_word in text.split():
            word = raw_word.strip()
            if not word:
                continue
            lower = word.lower()
            if lower in TITLE_OVERRIDES:
                words.append(TITLE_OVERRIDES[lower])
            else:
                words.append(lower.capitalize())
        return " ".join(words)
