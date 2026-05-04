#!/usr/bin/env python3
"""Generate zero-shot baseline Robot tests without project keyword grounding."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

from src.components.semantic.semantic_mapper import load_requirements  # noqa: E402

BASE_URL = "http://localhost:4242"
DEFAULT_EMAIL = "chithien.nguyen@germangains.com"
DEFAULT_PASSWORD = "password123"
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
GHERKIN_STEP_PATTERN = re.compile(r"^\s*(Given|When|Then|And|But)\s+(.+)$", re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"\b\d+\b")
QUOTED_VALUE_PATTERN = re.compile(r"'([^']+)'|\"([^\"]+)\"")
SPACE_PATTERN = re.compile(r"\s+")


@dataclass
class GeneratedCall:
    """One baseline Robot keyword call."""

    keyword: str
    arguments: list[str]


def clean_robot_text(value: str) -> str:
    """Normalize text for Robot documentation and arguments."""
    return SPACE_PATTERN.sub(" ", str(value or "")).strip()


def extract_quoted_values(text: str) -> list[str]:
    """Extract single-quoted and double-quoted values."""
    return [left or right for left, right in QUOTED_VALUE_PATTERN.findall(text)]


def first_quoted(text: str, default: str = "Element") -> str:
    """Return the first quoted value or a fallback."""
    values = extract_quoted_values(text)
    return values[0] if values else default


def last_quoted(text: str, default: str = "Value") -> str:
    """Return the last quoted value or a fallback."""
    values = extract_quoted_values(text)
    return values[-1] if values else default


def title_from_text(value: str) -> str:
    """Convert a phrase into naive Title Case."""
    cleaned = SPACE_PATTERN.sub(" ", str(value or "").replace("_", " ")).strip()
    return cleaned.title() if cleaned else "Element"


def page_slug(page_name: str) -> str:
    """Convert a page name into a naive URL slug."""
    cleaned = re.sub(r"[^A-Za-z0-9]+", "-", page_name.strip().lower()).strip("-")
    return f"/{cleaned or 'page'}"


def baseline_calls_for_text(text: str) -> list[GeneratedCall]:
    """Generate ungrounded zero-shot calls from one requirement or Gherkin step."""
    lowered = text.lower()
    quoted_values = extract_quoted_values(text)
    email_values = EMAIL_PATTERN.findall(text)
    number_values = NUMBER_PATTERN.findall(text)

    if re.search(r"\b(signs?|logs?) in\b", lowered):
        email = email_values[0] if email_values else DEFAULT_EMAIL
        password = DEFAULT_PASSWORD
        for value in quoted_values:
            if not EMAIL_PATTERN.fullmatch(value):
                password = value
        return [
            GeneratedCall("Input Text", ["Email Address", email]),
            GeneratedCall("Input Password", ["Password", password]),
            GeneratedCall("Click Element", ["Sign In"]),
        ]

    if re.search(r"\b(navigate|go|open|visit|access)\w*\b.+\bpage\b", lowered):
        return [GeneratedCall("Go To", [f"${{BASE_URL}}{page_slug(first_quoted(text, 'page'))}"])]

    if re.search(r"\b(on|opened|open)\b", lowered) and "page" in lowered:
        return [GeneratedCall("Location Should Contain", [page_slug(first_quoted(text, "page"))])]

    if re.search(r"\b(fill|enter|input|type|set text)\w*\b", lowered) and (
        "textbox" in lowered or "field" in lowered or "input" in lowered
    ):
        target = quoted_values[0] if quoted_values else "Field"
        value = quoted_values[-1] if len(quoted_values) >= 2 else "Value"
        return [GeneratedCall("Input Text", [title_from_text(target), value])]

    if "clear" in lowered and "textbox" in lowered:
        return [GeneratedCall("Clear Element Text", [title_from_text(first_quoted(text, "Field"))])]

    if "checkbox" in lowered and re.search(r"\b(state|status|checked|unchecked)\b", lowered):
        keyword = "Checkbox Should Not Be Selected" if "unchecked" in lowered else "Checkbox Should Be Selected"
        return [GeneratedCall(keyword, [title_from_text(first_quoted(text, "Checkbox"))])]

    if re.search(r"\b(click|trigger|press|tap|select|choose)\w*\b", lowered):
        return [GeneratedCall("Click Element", [title_from_text(first_quoted(text, "Element"))])]

    if "contain" in lowered and "notification" in lowered:
        return [GeneratedCall("Page Should Contain", [last_quoted(text, "Notification")])]

    if "contain" in lowered and "textbox" in lowered:
        target = quoted_values[0] if quoted_values else "Field"
        value = quoted_values[-1] if len(quoted_values) >= 2 else "Value"
        return [GeneratedCall("Textfield Value Should Be", [title_from_text(target), value])]

    if "updated" in lowered or "changed" in lowered:
        return [GeneratedCall("Wait Until Page Contains Element", [title_from_text(first_quoted(text, "Element"))])]

    if "visible" in lowered:
        return [GeneratedCall("Element Should Be Visible", [title_from_text(first_quoted(text, "Element"))])]

    if "at least" in lowered and "list" in lowered:
        target = quoted_values[0] if quoted_values else "List"
        minimum = number_values[-1] if number_values else "1"
        return [
            GeneratedCall("Get Element Count", [title_from_text(target)]),
            GeneratedCall("Should Be True", [f"${{COUNT}} >= {minimum}"]),
        ]

    if "wait" in lowered:
        seconds = number_values[0] if number_values else "1"
        return [GeneratedCall("Sleep", [f"{seconds}s"])]

    return [GeneratedCall("Log", [clean_robot_text(text)])]


def split_requirement_steps(requirement_text: str) -> list[str]:
    """Split a requirement into Gherkin steps or keep it as one natural-language unit."""
    steps: list[str] = []
    for raw_line in requirement_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        step_match = GHERKIN_STEP_PATTERN.match(line)
        steps.append(step_match.group(2).strip() if step_match else line)
    return steps or [requirement_text]


def robot_call(call: GeneratedCall) -> str:
    """Render one Robot Framework keyword call."""
    return "    " + "    ".join([call.keyword] + [clean_robot_text(arg) for arg in call.arguments])


def write_baseline_suite(input_file: Path, output: Path, base_url: str) -> None:
    """Write a zero-shot baseline Robot suite."""
    requirements = load_requirements(input_file)
    if not requirements:
        raise SystemExit(f"No requirements found in {input_file}")

    lines = [
        "*** Settings ***",
        "Documentation       Generated zero-shot baseline tests without project keyword grounding.",
        "Library             Browser",
        "",
        "*** Variables ***",
        f"${{BASE_URL}}         {base_url}",
        "${HEADLESS}         True",
        "",
        "*** Keywords ***",
        "Open Generic Browser Session",
        "    [Documentation]    Open Browser without project keyword resources.",
        "    ${HEADLESS_BOOL}=    Evaluate    str($HEADLESS).lower() in ['true', '1', 'yes']",
        "    New Browser    firefox    headless=${HEADLESS_BOOL}",
        "    New Context",
        "    New Page    ${BASE_URL}/",
        "",
        "Close Generic Browser Session",
        "    [Documentation]    Close Browser if open.",
        "    Run Keyword And Ignore Error    Close Browser",
        "",
        "*** Test Cases ***",
    ]

    for index, requirement in enumerate(requirements, 1):
        test_name = f"Baseline Test Case {index}: {requirement.feature or 'Auto-Generated'}"
        lines.extend(
            [
                test_name,
                f"    [Documentation]    {clean_robot_text(requirement.requirement_text)}",
                "    [Tags]    Baseline    Zero_Shot",
                "    [Timeout]    90 seconds",
                "    [Setup]    Open Generic Browser Session",
            ]
        )
        for step in split_requirement_steps(requirement.requirement_text):
            for call in baseline_calls_for_text(step):
                lines.append(robot_call(call))
        lines.extend(["    [Teardown]    Close Generic Browser Session", ""])

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_argument_parser() -> argparse.ArgumentParser:
    """Build CLI parser."""
    parser = argparse.ArgumentParser(description="Generate zero-shot baseline Robot tests.")
    parser.add_argument("--input-file", required=True, help="Path to requirement file or directory.")
    parser.add_argument("--output", required=True, help="Output .robot suite path.")
    parser.add_argument("--base-url", default=BASE_URL, help="SUT base URL.")
    return parser


def main() -> int:
    """Run baseline generation."""
    args = build_argument_parser().parse_args()
    input_file = Path(args.input_file)
    output = Path(args.output)
    if not input_file.is_absolute():
        input_file = PROJECT_ROOT / input_file
    if not output.is_absolute():
        output = PROJECT_ROOT / output
    write_baseline_suite(input_file=input_file, output=output, base_url=args.base_url)
    print(f"Baseline Robot suite written to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
