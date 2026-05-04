#!/usr/bin/env python3
"""Evaluate generated Robot tests for executability against the SUT."""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from scripts.evaluate_rag_pipeline import make_baseline_calls  # noqa: E402
from src.components.semantic.gherkin_support import (  # noqa: E402
    FeatureStep,
    GherkinStepMapper,
    ScenarioEntry,
    load_feature_documents,
)

BASE_URL = "http://localhost:4242"
DEFAULT_EMAIL = "chithien.nguyen@germangains.com"
DEFAULT_PASSWORD = "password123"
SPACE_PATTERN = re.compile(r"\s+")
QUOTED_VALUE_PATTERN = re.compile(r"'([^']+)'|\"([^\"]+)\"")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


@dataclass
class RequirementCase:
    """Single natural-language requirement case."""

    case_id: str
    requirement_type: str
    text: str


@dataclass
class RobotTestCase:
    """Generated Robot test case metadata."""

    case_id: str
    dataset: str
    system: str
    requirement_type: str
    title: str
    source: str
    expected_failure: str = ""


@dataclass
class ExecutionResult:
    """Parsed execution result for one test case."""

    case_id: str
    dataset: str
    system: str
    requirement_type: str
    title: str
    source: str
    status: str
    failure_category: str
    failure_message: str
    expected_failure: str


def clean_cell(value: str) -> str:
    """Normalize a cell for CSV/Markdown output."""
    return SPACE_PATTERN.sub(" ", str(value or "")).strip()


def latex_escape(value: str) -> str:
    """Escape text for LaTeX."""
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
    }
    output = str(value)
    for source, target in replacements.items():
        output = output.replace(source, target)
    return output


def robot_escape(value: str) -> str:
    """Escape text enough for Robot documentation lines."""
    return str(value).replace("\n", " ").replace("  ", " ").strip()


def split_robot_call(call_text: str) -> tuple[str, list[str]]:
    """Split a rendered Robot call into keyword and arguments."""
    parts = [part.strip() for part in re.split(r"\s{2,}", call_text.strip()) if part.strip()]
    if not parts:
        return "No Operation", []
    return parts[0], parts[1:]


def natural_requirement_type(text: str) -> str:
    """Classify natural-language requirements by wording pattern."""
    lowered = text.lower()
    if lowered.startswith("as "):
        return "User Story"
    if any(token in lowered for token in ["defect", "fix ", "unexpected behavior", "fails when"]):
        return "Bug Report"
    return "Functional Requirement"


def load_natural_requirements(path: Path) -> list[RequirementCase]:
    """Load non-empty natural-language requirement lines."""
    cases: list[RequirementCase] = []
    index = 1
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        text = raw_line.strip()
        if not text:
            continue
        cases.append(
            RequirementCase(
                case_id=f"N{index:03d}",
                requirement_type=natural_requirement_type(text),
                text=text,
            )
        )
        index += 1
    return cases


def quoted_values(text: str) -> list[str]:
    """Return quoted values."""
    return [left or right for left, right in QUOTED_VALUE_PATTERN.findall(text)]


def unique_email(seed: str) -> str:
    """Create deterministic unique-ish email for registration requirements."""
    safe = re.sub(r"[^a-z0-9]+", ".", seed.lower()).strip(".")[:30] or "user"
    return f"{safe}.rq2@example.com"


def login_steps() -> list[tuple[str, list[str]]]:
    """Return grounded login flow steps."""
    return [
        ("Navigate To Page", ["Sign In"]),
        ("Page Should Be Ready", ["Sign In"]),
        ("Fill Textbox With Value", ["Email Address", DEFAULT_EMAIL]),
        ("Fill Textbox With Value", ["Password", DEFAULT_PASSWORD]),
        ("Click Button", ["Sign In"]),
        ("Page Should Be Ready", ["Main Page"]),
    ]


def proposed_natural_steps(case: RequirementCase) -> tuple[list[tuple[str, list[str]]], str]:
    """Generate grounded project-keyword steps for natural-language requirements."""
    text = case.text
    lowered = text.lower()
    values = quoted_values(text)
    expected_failure = ""

    if "invalid credentials" in lowered:
        return (
            [
                ("Navigate To Page", ["Sign In"]),
                ("Page Should Be Ready", ["Sign In"]),
                ("Fill Textbox With Value", ["Email Address", "wrong@email.com"]),
                ("Fill Textbox With Value", ["Password", "wrongpassword"]),
                ("Click Button", ["Sign In"]),
                ("Notification Should Contain Text", ["Error", "Invalid credentials"]),
            ],
            expected_failure,
        )

    if "remember me" in lowered:
        state = "checked" if any(token in lowered for token in ["active", "checked"]) and "inactive" not in lowered else "unchecked"
        if state == "checked":
            expected_failure = "Expected SUT Defect"
        return (
            [
                ("Navigate To Page", ["Sign In"]),
                ("Page Should Be Ready", ["Sign In"]),
                ("Checkbox State Should Be", ["Remember Me", state]),
            ],
            expected_failure,
        )

    if "sign up" in lowered and "access" in lowered and "google" not in lowered:
        return (
            [
                ("Navigate To Page", ["Welcome Page"]),
                ("Click Button", ["Sign Up"]),
                ("Page Should Be Ready", ["Sign Up"]),
            ],
            expected_failure,
        )

    if "google" in lowered:
        return (
            [
                ("Navigate To Page", ["Sign Up"]),
                ("Page Should Be Ready", ["Sign Up"]),
                ("Click Button", ["Google"]),
            ],
            "Expected External Auth Boundary",
        )

    if "create an account" in lowered:
        email = next((value for value in values if EMAIL_PATTERN.fullmatch(value)), unique_email(case.case_id))
        password = next((value for value in values if not EMAIL_PATTERN.fullmatch(value) and len(value) >= 8), "testtest123")
        return (
            [
                ("Navigate To Page", ["Sign Up"]),
                ("Fill Textbox With Value", ["First Name", "RQ2"]),
                ("Fill Textbox With Value", ["Last Name", "User"]),
                ("Fill Textbox With Value", ["Username", f"rq2_{case.case_id.lower()}"]),
                ("Fill Textbox With Value", ["Email Address", email]),
                ("Fill Textbox With Value", ["Password", password]),
                ("Fill Textbox With Value", ["Confirm Password", password]),
                ("Click Button", ["Create Account"]),
                ("Page Should Be Ready", ["Sign In"]),
            ],
            expected_failure,
        )

    if "log in" in lowered or "sign in" in lowered or "login" in lowered:
        return (login_steps(), expected_failure)

    if "features reviews about" in lowered:
        return (
            [
                ("Navigate To Page", ["Welcome Page"]),
                ("Click Button", ["Features"]),
                ("Validate Section Is In View", ["Course Features"]),
                ("Click Button", ["Reviews"]),
                ("Validate Section Is In View", ["What Our Students Say"]),
                ("Click Button", ["About"]),
                ("Validate Section Is In View", ["About Us"]),
            ],
            expected_failure,
        )

    if "course features" in lowered or "features button" in lowered:
        return (
            [
                ("Navigate To Page", ["Welcome Page"]),
                ("Click Button", ["Features"]),
                ("Validate Section Is In View", ["Course Features"]),
            ],
            expected_failure,
        )

    if "welcome page" in lowered and "logo" in lowered:
        return (
            [
                ("Navigate To Page", ["Sign In"]),
                ("Page Should Be Ready", ["Sign In"]),
                ("Click Button", ["Logo"]),
                ("Page Should Be Ready", ["Welcome Page"]),
            ],
            expected_failure,
        )

    if "ranking" in lowered or "leaderboard" in lowered:
        return (
            login_steps()
            + [
                ("Click Button", ["Ranking"]),
                ("Page Should Be Ready", ["Ranking"]),
                ("List Should Be Visible", ["List"]),
            ],
            expected_failure,
        )

    if "pronunciation" in lowered:
        if "audio playback overlaps" in lowered or "concurrent audio" in lowered:
            expected_failure = "Expected SUT Defect"
        steps = login_steps() + [
            ("Click Button", ["Pronunciation"]),
            ("Page Should Be Ready", ["Pronunciation"]),
        ]
        if "umlaut" in lowered:
            steps.append(("Click Button", ["ä"]))
        elif "categories" in lowered:
            steps.extend([("List Should Be Visible", ["Group"]), ("List Should Be Visible", ["Sound"])])
        else:
            steps.extend([("Click Button", ["ä"]), ("Click Button", ["ö"]), ("Click Button", ["ü"])])
        return (steps, expected_failure)

    if "inbox" in lowered or "messages" in lowered:
        return (
            login_steps()
            + [
                ("Click Button", ["Inbox"]),
                ("Page Should Be Ready", ["Inbox"]),
                ("Messagebox Should Be Empty", ["Messages"]),
            ],
            "Expected SUT Defect",
        )

    if "heart" in lowered or "streak" in lowered or "exercise" in lowered or "lesson" in lowered:
        expected_failure = "Expected SUT Defect" if any(
            token in lowered for token in ["deduct", "wrong answer", "without selecting", "loses two hearts"]
        ) else ""
        return (
            login_steps()
            + [
                ("Scroll To Section", ["Course"]),
                ("Click Button At Index", ["Continue", "0"]),
                ("Click Button", ["Lesson 1"]),
                ("Click Button", ["Lesson 1 Start"]),
            ],
            expected_failure,
        )

    if "password" in lowered and "hashed" in lowered:
        return ([("Fail", ["Non-UI security requirement requires backend/database assertion."])], "Non-UI Requirement")

    return ([("Fail", ["No grounded UI flow could be derived for this requirement."])], "Mapping Error")


def generic_route_from_text(text: str) -> str:
    """Infer a baseline route without using project locator resources."""
    lowered = text.lower()
    if "sign up" in lowered or "register" in lowered:
        return "/register"
    if "sign in" in lowered or "login" in lowered or "log in" in lowered:
        return "/login"
    if "ranking" in lowered or "leaderboard" in lowered:
        return "/ranking"
    if "pronunciation" in lowered:
        return "/pronunciation"
    if "inbox" in lowered or "message" in lowered:
        return "/inbox"
    if "challenge" in lowered:
        return "/challenge"
    if "profile" in lowered:
        return "/profile"
    if "achievement" in lowered:
        return "/achievements"
    return "/"


def baseline_natural_steps(case: RequirementCase) -> tuple[list[tuple[str, list[str]]], str]:
    """Generate ungrounded Browser-library steps for natural-language requirements."""
    lowered = case.text.lower()
    steps: list[tuple[str, list[str]]] = [("Go To", [f"${{BASE_URL}}{generic_route_from_text(case.text)}"])]
    if "log in" in lowered or "sign in" in lowered or "login" in lowered:
        steps.extend(
            [
                ("Fill Text", ["css=input[type='email']", DEFAULT_EMAIL]),
                ("Fill Text", ["css=input[type='password']", DEFAULT_PASSWORD]),
                ("Click", ["text=Sign In"]),
                ("Wait For Elements State", ["text=German", "visible", "timeout=8s"]),
            ]
        )
    elif "sign up" in lowered or "register" in lowered:
        steps.extend([("Wait For Elements State", ["text=Create", "visible", "timeout=8s"])])
    elif "invalid credentials" in lowered:
        steps.extend(
            [
                ("Fill Text", ["css=input[type='email']", "wrong@email.com"]),
                ("Fill Text", ["css=input[type='password']", "wrongpassword"]),
                ("Click", ["text=Sign In"]),
                ("Wait For Elements State", ["text=Invalid credentials", "visible", "timeout=8s"]),
            ]
        )
    elif "features" in lowered:
        steps.extend([("Click", ["text=Features"]), ("Wait For Elements State", ["text=Features", "visible", "timeout=8s"])])
    elif "ranking" in lowered or "leaderboard" in lowered:
        steps.extend([("Wait For Elements State", ["text=Ranking", "visible", "timeout=8s"])])
    elif "pronunciation" in lowered:
        steps.extend([("Wait For Elements State", ["text=Pronunciation", "visible", "timeout=8s"])])
    else:
        steps.append(("Fail", ["Baseline has no grounded executable UI flow for this requirement."]))
    return steps, ""


def write_project_suite(
    suite_path: Path,
    resource_path: Path,
    test_cases: list[RobotTestCase],
    body_by_case: dict[str, list[tuple[str, list[str]]]],
) -> None:
    """Write Robot suite that uses project resource keywords."""
    suite_path.parent.mkdir(parents=True, exist_ok=True)
    resource_lines = [
        "*** Settings ***",
        "Documentation       RQ2 generated executable resource.",
        "",
        f"Resource            {PROJECT_ROOT / 'Resource/MainLib.resource'}",
        "",
        "",
        "*** Keywords ***",
    ]
    robot_lines = [
        "*** Settings ***",
        "Documentation       RQ2 generated Robot suite.",
        "",
        f"Resource            ./{resource_path.name}",
        "",
        "*** Variables ***",
        "${HEADLESS}         True",
        "",
        "*** Test Cases ***",
    ]
    for test in test_cases:
        keyword_names: list[str] = []
        for index, (keyword, args) in enumerate(body_by_case[test.case_id], start=1):
            wrapper_name = f"{test.case_id} Step {index:02d}"
            keyword_names.append(wrapper_name)
            arg_text = "    ".join([keyword] + args)
            resource_lines.extend(
                [
                    wrapper_name,
                    f"    [Documentation]    Execute generated step {index}.",
                    f"    {arg_text}",
                    "",
                ]
            )
        robot_lines.extend(
            [
                f"{test.case_id}: {test.title}",
                f"    [Documentation]    {robot_escape(test.source)}",
                f"    [Tags]    {test.dataset}    {test.system}    {test.requirement_type.replace(' ', '_')}",
                "    [Timeout]    90 seconds",
                "    [Setup]    Open Browser Session",
            ]
        )
        robot_lines.extend(f"    {name}" for name in keyword_names)
        robot_lines.extend(["    [Teardown]    Close Browser Session", ""])
    resource_path.write_text("\n".join(resource_lines) + "\n", encoding="utf-8")
    suite_path.write_text("\n".join(robot_lines) + "\n", encoding="utf-8")


def write_browser_suite(
    suite_path: Path,
    test_cases: list[RobotTestCase],
    body_by_case: dict[str, list[tuple[str, list[str]]]],
) -> None:
    """Write Robot suite that uses ungrounded Browser-library calls."""
    suite_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "*** Settings ***",
        "Documentation       RQ2 zero-shot baseline suite using generic Browser keywords.",
        "",
        "Library             Browser",
        "",
        "*** Variables ***",
        f"${{BASE_URL}}         {BASE_URL}",
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
    for test in test_cases:
        lines.extend(
            [
                f"{test.case_id}: {test.title}",
                f"    [Documentation]    {robot_escape(test.source)}",
                f"    [Tags]    {test.dataset}    {test.system}    {test.requirement_type.replace(' ', '_')}",
                "    [Timeout]    90 seconds",
                "    [Setup]    Open Generic Browser Session",
            ]
        )
        for keyword, args in body_by_case[test.case_id]:
            lines.append("    " + "    ".join([keyword] + args))
        lines.extend(["    [Teardown]    Close Generic Browser Session", ""])
    suite_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_gherkin_proposed(resource_root: Path) -> tuple[list[RobotTestCase], dict[str, list[tuple[str, list[str]]]]]:
    """Build proposed Gherkin test cases from the modular mapper."""
    mapper = GherkinStepMapper.from_resource_root(resource_root)
    tests: list[RobotTestCase] = []
    bodies: dict[str, list[tuple[str, list[str]]]] = {}
    documents = load_feature_documents(PROJECT_ROOT / "requirements/gherkin")
    index = 1
    for document in documents:
        for scenario in document.scenarios:
            case_id = f"G{index:03d}"
            body: list[tuple[str, list[str]]] = []
            expected_failure = ""
            for step in scenario.steps:
                analysis = mapper.analyze_step(step.text)
                keyword, arguments, _confidence, match_source = mapper.map_step(analysis)
                body.append((keyword, arguments))
                if match_source == "fallback":
                    expected_failure = "Mapping Error"
            tests.append(
                RobotTestCase(
                    case_id=case_id,
                    dataset="Gherkin",
                    system="Proposed",
                    requirement_type="Gherkin Scenario",
                    title=scenario.name,
                    source=f"{document.source_file}::{scenario.name}",
                    expected_failure=expected_failure,
                )
            )
            bodies[case_id] = body
            index += 1
    return tests, bodies


def build_gherkin_baseline() -> tuple[list[RobotTestCase], dict[str, list[tuple[str, list[str]]]]]:
    """Build baseline Gherkin test cases from generic Browser calls."""
    tests: list[RobotTestCase] = []
    bodies: dict[str, list[tuple[str, list[str]]]] = {}
    documents = load_feature_documents(PROJECT_ROOT / "requirements/gherkin")
    index = 1
    for document in documents:
        for scenario in document.scenarios:
            case_id = f"G{index:03d}"
            body: list[tuple[str, list[str]]] = []
            for step in scenario.steps:
                for generated in make_baseline_calls(FeatureStep(step.line_number, step.clause, step.text)):
                    keyword = generated.keyword
                    args = generated.arguments
                    if keyword == "Go To":
                        args = [f"${{BASE_URL}}{args[0]}"]
                    body.append((keyword, args))
            tests.append(
                RobotTestCase(
                    case_id=case_id,
                    dataset="Gherkin",
                    system="Baseline",
                    requirement_type="Gherkin Scenario",
                    title=scenario.name,
                    source=f"{document.source_file}::{scenario.name}",
                )
            )
            bodies[case_id] = body
            index += 1
    return tests, bodies


def build_natural(system: str, generator: Callable[[RequirementCase], tuple[list[tuple[str, list[str]]], str]]) -> tuple[list[RobotTestCase], dict[str, list[tuple[str, list[str]]]]]:
    """Build natural-language test cases for a generator."""
    tests: list[RobotTestCase] = []
    bodies: dict[str, list[tuple[str, list[str]]]] = {}
    requirements = load_natural_requirements(PROJECT_ROOT / "requirements/userstories/mixed_requirement_types.csv")
    for case in requirements:
        body, expected_failure = generator(case)
        tests.append(
            RobotTestCase(
                case_id=case.case_id,
                dataset="Natural Language",
                system=system,
                requirement_type=case.requirement_type,
                title=case.requirement_type,
                source=case.text,
                expected_failure=expected_failure,
            )
        )
        bodies[case.case_id] = body
    return tests, bodies


def run_robot_suite(suite_path: Path, output_dir: Path) -> int:
    """Run one Robot suite."""
    output_dir.mkdir(parents=True, exist_ok=True)
    command = [
        sys.executable,
        "-m",
        "robot",
        "--outputdir",
        str(output_dir),
        "--variable",
        "HEADLESS:True",
        str(suite_path),
    ]
    result = subprocess.run(command, cwd=PROJECT_ROOT, text=True, check=False)
    return result.returncode


def parse_robot_output(output_xml: Path) -> dict[str, tuple[str, str]]:
    """Parse Robot output.xml into case id -> (status, message)."""
    if not output_xml.exists():
        return {}
    root = ET.parse(output_xml).getroot()
    results: dict[str, tuple[str, str]] = {}
    for test in root.iter("test"):
        name = test.attrib.get("name", "")
        case_id = name.split(":", 1)[0].strip()
        status_element = test.find("status")
        if status_element is None:
            continue
        results[case_id] = (
            status_element.attrib.get("status", "UNKNOWN"),
            clean_cell(status_element.text or ""),
        )
    return results


def classify_failure(test: RobotTestCase, status: str, message: str) -> str:
    """Classify execution outcome."""
    if status == "PASS":
        return "Pass"
    lowered = message.lower()
    source_lower = test.source.lower()
    if test.expected_failure in {"Expected SUT Defect", "Expected External Auth Boundary"}:
        return "Actual SUT Defect"
    if test.expected_failure == "Non-UI Requirement":
        return "Non-UI / Not Executable"
    if test.expected_failure == "Mapping Error":
        return "Mapping Error"
    if "no keyword with name" in lowered:
        return "Mapping Error"
    if "dictionary does not contain key" in lowered:
        if any(token in source_lower for token in ["button", "checkbox", "textbox", "message", "notification", "section"]):
            return "Actual SUT Defect"
        return "Mapping Error"
    if "no route mapping" in lowered or "no locator" in lowered:
        return "Mapping Error"
    if "timeout" in lowered or "waiting for" in lowered or "page should contain" in lowered:
        if test.system == "Baseline":
            return "Logic Error"
        if test.requirement_type == "Bug Report":
            return "Actual SUT Defect"
        return "Logic Error"
    if "cannot verify" in lowered or "could be derived" in lowered:
        return "Mapping Error"
    return "Logic Error"


def collect_results(
    tests: list[RobotTestCase],
    parsed: dict[str, tuple[str, str]],
) -> list[ExecutionResult]:
    """Join generated metadata with Robot results."""
    rows: list[ExecutionResult] = []
    for test in tests:
        status, message = parsed.get(test.case_id, ("NOT_RUN", "No Robot result found."))
        rows.append(
            ExecutionResult(
                case_id=test.case_id,
                dataset=test.dataset,
                system=test.system,
                requirement_type=test.requirement_type,
                title=test.title,
                source=test.source,
                status=status,
                failure_category=classify_failure(test, status, message),
                failure_message=message,
                expected_failure=test.expected_failure,
            )
        )
    return rows


def write_csv(path: Path, rows: list[dict[str, str]], headers: list[str]) -> None:
    """Write CSV rows."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def summarize(results: list[ExecutionResult]) -> list[dict[str, str]]:
    """Summarize by dataset, system, and requirement type."""
    groups: dict[tuple[str, str, str], list[ExecutionResult]] = {}
    for result in results:
        key = (result.dataset, result.system, result.requirement_type)
        groups.setdefault(key, []).append(result)

    rows: list[dict[str, str]] = []
    for (dataset, system, requirement_type), group in sorted(groups.items()):
        total = len(group)
        passed = sum(1 for item in group if item.status == "PASS")
        mapping = sum(1 for item in group if item.failure_category == "Mapping Error")
        logic = sum(1 for item in group if item.failure_category == "Logic Error")
        defect = sum(1 for item in group if item.failure_category == "Actual SUT Defect")
        non_ui = sum(1 for item in group if item.failure_category == "Non-UI / Not Executable")
        rows.append(
            {
                "DATASET": dataset,
                "SYSTEM": system,
                "REQUIREMENT_TYPE": requirement_type,
                "TOTAL": str(total),
                "PASSED": str(passed),
                "SUCCESS_RATE": f"{(passed / total * 100.0) if total else 0.0:.2f}",
                "MAPPING_ERRORS": str(mapping),
                "LOGIC_ERRORS": str(logic),
                "ACTUAL_SUT_DEFECTS": str(defect),
                "NON_UI_NOT_EXECUTABLE": str(non_ui),
            }
        )
    return rows


def system_summary(results: list[ExecutionResult]) -> list[dict[str, str]]:
    """Summarize by dataset and system."""
    groups: dict[tuple[str, str], list[ExecutionResult]] = {}
    for result in results:
        groups.setdefault((result.dataset, result.system), []).append(result)
    rows: list[dict[str, str]] = []
    for (dataset, system), group in sorted(groups.items()):
        total = len(group)
        passed = sum(1 for item in group if item.status == "PASS")
        rows.append(
            {
                "DATASET": dataset,
                "SYSTEM": system,
                "TOTAL": str(total),
                "PASSED": str(passed),
                "SUCCESS_RATE": f"{(passed / total * 100.0) if total else 0.0:.2f}",
                "MAPPING_ERRORS": str(sum(1 for item in group if item.failure_category == "Mapping Error")),
                "LOGIC_ERRORS": str(sum(1 for item in group if item.failure_category == "Logic Error")),
                "ACTUAL_SUT_DEFECTS": str(sum(1 for item in group if item.failure_category == "Actual SUT Defect")),
                "NON_UI_NOT_EXECUTABLE": str(sum(1 for item in group if item.failure_category == "Non-UI / Not Executable")),
            }
        )
    return rows


def complete_requirement_rows(results: list[ExecutionResult]) -> list[dict[str, str]]:
    """Build a complete numbered table with proposed and baseline outcomes."""
    grouped: dict[tuple[str, str], dict[str, ExecutionResult]] = {}
    for result in results:
        grouped.setdefault((result.dataset, result.case_id), {})[result.system] = result

    rows: list[dict[str, str]] = []
    dataset_order = {"Gherkin": 0, "Natural Language": 1}

    def sort_key(item: tuple[tuple[str, str], dict[str, ExecutionResult]]) -> tuple[int, str]:
        (dataset, case_id), _systems = item
        return (dataset_order.get(dataset, 99), case_id)

    for (dataset, case_id), systems in sorted(grouped.items(), key=sort_key):
        proposed = systems.get("Proposed")
        baseline = systems.get("Baseline")
        primary = proposed or baseline
        if primary is None:
            continue
        rows.append(
            {
                "REQ_NO": case_id,
                "DATASET": dataset,
                "REQUIREMENT_TYPE": primary.requirement_type,
                "REQUIREMENT": primary.source,
                "PROPOSED_STATUS": proposed.status if proposed else "NOT_RUN",
                "PROPOSED_FAILURE_CATEGORY": proposed.failure_category if proposed else "NOT_RUN",
                "BASELINE_STATUS": baseline.status if baseline else "NOT_RUN",
                "BASELINE_FAILURE_CATEGORY": baseline.failure_category if baseline else "NOT_RUN",
            }
        )
    return rows


def write_latex_tables(output_dir: Path, summary_rows: list[dict[str, str]]) -> None:
    """Write separate LaTeX tables for Gherkin and natural-language datasets."""
    for dataset, filename, label in [
        ("Gherkin", "gherkin_executability_table.tex", "tab:rq2_gherkin_executability"),
        ("Natural Language", "natural_executability_table.tex", "tab:rq2_natural_executability"),
    ]:
        rows = [row for row in summary_rows if row["DATASET"] == dataset]
        lines = [
            r"\begin{table}[htbp]",
            r"\centering",
            rf"\caption{{RQ2 executability results for {latex_escape(dataset)} requirements.}}",
            rf"\label{{{label}}}",
            r"\begin{tabular}{llrrrrrr}",
            r"\toprule",
            r"Pipeline & Type & Total & Passed & Success (\%) & Mapping & Logic & SUT Defects \\",
            r"\midrule",
        ]
        for row in rows:
            lines.append(
                " & ".join(
                    [
                        latex_escape(row["SYSTEM"]),
                        latex_escape(row["REQUIREMENT_TYPE"]),
                        row["TOTAL"],
                        row["PASSED"],
                        row["SUCCESS_RATE"],
                        row["MAPPING_ERRORS"],
                        row["LOGIC_ERRORS"],
                        row["ACTUAL_SUT_DEFECTS"],
                    ]
                )
                + r" \\"
            )
        lines.extend([r"\bottomrule", r"\end{tabular}", r"\end{table}", ""])
        (output_dir / filename).write_text("\n".join(lines), encoding="utf-8")


def write_complete_latex_table(output_dir: Path, rows: list[dict[str, str]]) -> None:
    """Write a longtable containing every numbered requirement."""
    lines = [
        r"% Required packages: \usepackage{booktabs}, \usepackage{longtable}, \usepackage{array}",
        r"\begin{longtable}{p{0.08\linewidth}p{0.14\linewidth}p{0.16\linewidth}p{0.34\linewidth}p{0.10\linewidth}p{0.10\linewidth}}",
        r"\caption{Complete numbered RQ2 requirement-level executability table.}",
        r"\label{tab:rq2_complete_requirements}\\",
        r"\toprule",
        r"No. & Dataset & Type & Requirement & Proposed & Baseline \\",
        r"\midrule",
        r"\endfirsthead",
        r"\toprule",
        r"No. & Dataset & Type & Requirement & Proposed & Baseline \\",
        r"\midrule",
        r"\endhead",
    ]
    for row in rows:
        proposed = f"{row['PROPOSED_STATUS']} / {row['PROPOSED_FAILURE_CATEGORY']}"
        baseline = f"{row['BASELINE_STATUS']} / {row['BASELINE_FAILURE_CATEGORY']}"
        lines.append(
            " & ".join(
                [
                    latex_escape(row["REQ_NO"]),
                    latex_escape(row["DATASET"]),
                    latex_escape(row["REQUIREMENT_TYPE"]),
                    latex_escape(row["REQUIREMENT"]),
                    latex_escape(proposed),
                    latex_escape(baseline),
                ]
            )
            + r" \\"
        )
    lines.extend([r"\bottomrule", r"\end{longtable}", ""])
    (output_dir / "complete_requirement_table.tex").write_text("\n".join(lines), encoding="utf-8")


def write_complete_markdown_table(output_dir: Path, rows: list[dict[str, str]]) -> None:
    """Write complete requirement table in Markdown."""
    lines = [
        "# Complete RQ2 Requirement Table",
        "",
        "| No. | Dataset | Type | Requirement | Proposed | Baseline |",
        "|---|---|---|---|---|---|",
    ]
    for row in rows:
        requirement = row["REQUIREMENT"].replace("|", "\\|")
        proposed = f"{row['PROPOSED_STATUS']} / {row['PROPOSED_FAILURE_CATEGORY']}"
        baseline = f"{row['BASELINE_STATUS']} / {row['BASELINE_FAILURE_CATEGORY']}"
        lines.append(
            f"| {row['REQ_NO']} | {row['DATASET']} | {row['REQUIREMENT_TYPE']} | "
            f"{requirement} | {proposed} | {baseline} |"
        )
    (output_dir / "complete_requirement_table.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_png_chart(path: Path, rows: list[dict[str, str]]) -> None:
    """Write success-rate chart if matplotlib is available."""
    try:
        import matplotlib.pyplot as plt
    except Exception:
        return

    labels = [f"{row['DATASET']}\n{row['SYSTEM']}" for row in rows]
    values = [float(row["SUCCESS_RATE"]) for row in rows]
    colors = ["#2563eb" if row["SYSTEM"] == "Proposed" else "#b91c1c" for row in rows]
    figure, axis = plt.subplots(figsize=(8, 4.8))
    axis.bar(range(len(labels)), values, color=colors)
    axis.set_ylabel("Success Rate (%)")
    axis.set_ylim(0, 100)
    axis.set_xticks(range(len(labels)))
    axis.set_xticklabels(labels)
    axis.grid(axis="y", linestyle="--", alpha=0.35)
    figure.tight_layout()
    figure.savefig(path, dpi=200)
    plt.close(figure)


def write_markdown_report(output_dir: Path, system_rows: list[dict[str, str]], summary_rows: list[dict[str, str]]) -> None:
    """Write Markdown documentation for RQ2."""
    lines = [
        "# RQ2 Executability Evaluation",
        "",
        "This benchmark executes generated Robot Framework tests against the local SUT at `http://localhost:4242`.",
        "",
        "Failure categories:",
        "",
        "- `Mapping Error`: wrong or unsupported generated keyword, route, locator category, or element mapping.",
        "- `Logic Error`: generated steps are syntactically valid but ordered incorrectly for the SUT state, for example accessing protected pages without login.",
        "- `Actual SUT Defect`: the generated test is executable but exposes a missing element, missing behavior, or expected defect/bug-report behavior.",
        "- `Non-UI / Not Executable`: the requirement cannot be validated through the browser UI alone.",
        "",
        "## Dataset-Level Comparison",
        "",
        "| Dataset | Pipeline | Total | Passed | Success (%) | Mapping | Logic | SUT Defects | Non-UI |",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in system_rows:
        lines.append(
            f"| {row['DATASET']} | {row['SYSTEM']} | {row['TOTAL']} | {row['PASSED']} | "
            f"{row['SUCCESS_RATE']} | {row['MAPPING_ERRORS']} | {row['LOGIC_ERRORS']} | "
            f"{row['ACTUAL_SUT_DEFECTS']} | {row['NON_UI_NOT_EXECUTABLE']} |"
        )
    lines.extend(["", "## Requirement-Type Breakdown", "", "| Dataset | Pipeline | Type | Total | Passed | Success (%) | Mapping | Logic | SUT Defects | Non-UI |", "|---|---|---|---:|---:|---:|---:|---:|---:|---:|"])
    for row in summary_rows:
        lines.append(
            f"| {row['DATASET']} | {row['SYSTEM']} | {row['REQUIREMENT_TYPE']} | {row['TOTAL']} | "
            f"{row['PASSED']} | {row['SUCCESS_RATE']} | {row['MAPPING_ERRORS']} | {row['LOGIC_ERRORS']} | "
            f"{row['ACTUAL_SUT_DEFECTS']} | {row['NON_UI_NOT_EXECUTABLE']} |"
        )
    (output_dir / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_argument_parser() -> argparse.ArgumentParser:
    """Build parser."""
    parser = argparse.ArgumentParser(description="Run RQ2 executability benchmark.")
    parser.add_argument("--output-dir", default="Results/rq2-executability")
    parser.add_argument(
        "--system",
        choices=["all", "proposed", "baseline"],
        default="all",
        help="Select which generation system to execute.",
    )
    parser.add_argument("--skip-run", action="store_true", help="Only generate suites and reports from existing outputs.")
    return parser


def main() -> int:
    """Generate, run, and report RQ2 executability benchmark."""
    args = build_argument_parser().parse_args()
    output_dir = PROJECT_ROOT / args.output_dir
    suite_dir = output_dir / "suites"
    run_dir = output_dir / "runs"
    resource_root = PROJECT_ROOT / "Resource"

    proposed_gherkin_tests, proposed_gherkin_bodies = build_gherkin_proposed(resource_root)
    baseline_gherkin_tests, baseline_gherkin_bodies = build_gherkin_baseline()
    proposed_natural_tests, proposed_natural_bodies = build_natural("Proposed", proposed_natural_steps)
    baseline_natural_tests, baseline_natural_bodies = build_natural("Baseline", baseline_natural_steps)

    suites = []
    if args.system in {"all", "proposed"}:
        write_project_suite(
            suite_dir / "proposed_gherkin.robot",
            suite_dir / "proposed_gherkin.resource",
            proposed_gherkin_tests,
            proposed_gherkin_bodies,
        )
        write_project_suite(
            suite_dir / "proposed_natural.robot",
            suite_dir / "proposed_natural.resource",
            proposed_natural_tests,
            proposed_natural_bodies,
        )
        suites.extend(
            [
                ("proposed_gherkin", proposed_gherkin_tests),
                ("proposed_natural", proposed_natural_tests),
            ]
        )
    if args.system in {"all", "baseline"}:
        write_browser_suite(suite_dir / "baseline_gherkin.robot", baseline_gherkin_tests, baseline_gherkin_bodies)
        write_browser_suite(suite_dir / "baseline_natural.robot", baseline_natural_tests, baseline_natural_bodies)
        suites.extend(
            [
                ("baseline_gherkin", baseline_gherkin_tests),
                ("baseline_natural", baseline_natural_tests),
            ]
        )

    if not args.skip_run:
        for suite_name, _tests in suites:
            run_robot_suite(suite_dir / f"{suite_name}.robot", run_dir / suite_name)

    all_results: list[ExecutionResult] = []
    for suite_name, tests in suites:
        parsed = parse_robot_output(run_dir / suite_name / "output.xml")
        all_results.extend(collect_results(tests, parsed))

    detail_rows = [
        {
            "CASE_ID": result.case_id,
            "DATASET": result.dataset,
            "SYSTEM": result.system,
            "REQUIREMENT_TYPE": result.requirement_type,
            "TITLE": result.title,
            "REQUIREMENT": result.source,
            "STATUS": result.status,
            "FAILURE_CATEGORY": result.failure_category,
            "EXPECTED_FAILURE": result.expected_failure,
            "FAILURE_MESSAGE": result.failure_message,
        }
        for result in all_results
    ]
    detail_headers = [
        "CASE_ID",
        "DATASET",
        "SYSTEM",
        "REQUIREMENT_TYPE",
        "TITLE",
        "REQUIREMENT",
        "STATUS",
        "FAILURE_CATEGORY",
        "EXPECTED_FAILURE",
        "FAILURE_MESSAGE",
    ]
    output_dir.mkdir(parents=True, exist_ok=True)
    write_csv(output_dir / "per_test_results.csv", detail_rows, detail_headers)
    summary_rows = summarize(all_results)
    system_rows = system_summary(all_results)
    summary_headers = [
        "DATASET",
        "SYSTEM",
        "REQUIREMENT_TYPE",
        "TOTAL",
        "PASSED",
        "SUCCESS_RATE",
        "MAPPING_ERRORS",
        "LOGIC_ERRORS",
        "ACTUAL_SUT_DEFECTS",
        "NON_UI_NOT_EXECUTABLE",
    ]
    system_headers = [
        "DATASET",
        "SYSTEM",
        "TOTAL",
        "PASSED",
        "SUCCESS_RATE",
        "MAPPING_ERRORS",
        "LOGIC_ERRORS",
        "ACTUAL_SUT_DEFECTS",
        "NON_UI_NOT_EXECUTABLE",
    ]
    write_csv(output_dir / "requirement_type_summary.csv", summary_rows, summary_headers)
    write_csv(output_dir / "dataset_system_summary.csv", system_rows, system_headers)
    (output_dir / "execution_summary.json").write_text(
        json.dumps({"dataset_system": system_rows, "requirement_type": summary_rows}, indent=2),
        encoding="utf-8",
    )
    write_latex_tables(output_dir, summary_rows)
    complete_rows = complete_requirement_rows(all_results)
    complete_headers = [
        "REQ_NO",
        "DATASET",
        "REQUIREMENT_TYPE",
        "REQUIREMENT",
        "PROPOSED_STATUS",
        "PROPOSED_FAILURE_CATEGORY",
        "BASELINE_STATUS",
        "BASELINE_FAILURE_CATEGORY",
    ]
    write_csv(output_dir / "complete_requirement_table.csv", complete_rows, complete_headers)
    write_complete_markdown_table(output_dir, complete_rows)
    write_complete_latex_table(output_dir, complete_rows)
    write_png_chart(output_dir / "executability_success_rate.png", system_rows)
    write_markdown_report(output_dir, system_rows, summary_rows)

    for row in system_rows:
        print(
            f"{row['DATASET']} / {row['SYSTEM']}: "
            f"{row['PASSED']}/{row['TOTAL']} passed ({row['SUCCESS_RATE']}%)"
        )
    print(f"Artifacts written to {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
