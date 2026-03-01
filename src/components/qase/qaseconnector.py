#!/usr/bin/env python3
"""Pull Qase TestOps suites/cases and run gherkin2robotframework.

Outputs:
- gherkin2robotframework output folder (Robot Framework files)


RUN: python3 /Users/ChiThien/Saveloads/HDA/PPundBA/Website-to-learn-german/src/components/qase/qaseconnector.py --insecure

"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import ssl
import tempfile
import urllib.request

DEFAULT_BASE_URL = "https://api.qase.io"
DEFAULT_LIMIT = 100


def _read_config(config_path: str) -> dict:
    if not os.path.isfile(config_path):
        return {}
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _get_config_value(config: dict, *path, default=None):
    cur = config
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return default
        cur = cur[key]
    return cur


def _request_json(url: str, token: str, ssl_context: ssl.SSLContext | None) -> dict:
    req = urllib.request.Request(url)
    req.add_header("Token", token)
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=60, context=ssl_context) as resp:
        data = resp.read().decode("utf-8")
    return json.loads(data)


def _fetch_paginated(base_url: str, token: str, path: str, code: str, ssl_context: ssl.SSLContext | None) -> list:
    entities = []
    offset = 0
    limit = DEFAULT_LIMIT
    while True:
        url = f"{base_url}/v1/{path}/{code}?limit={limit}&offset={offset}"
        payload = _request_json(url, token, ssl_context)
        result = payload.get("result", payload)
        page_items = None

        if isinstance(result, dict):
            if "entities" in result and isinstance(result["entities"], list):
                page_items = result["entities"]
            elif "suites" in result and isinstance(result["suites"], list):
                page_items = result["suites"]
            elif "cases" in result and isinstance(result["cases"], list):
                page_items = result["cases"]
        elif isinstance(result, list):
            page_items = result

        if not page_items:
            break

        entities.extend(page_items)

        total = None
        if isinstance(result, dict):
            total = result.get("total") or result.get("filtered")
        count = len(page_items)
        if total is not None and offset + count >= total:
            break
        if count < limit:
            break
        offset += limit

    return entities


def _slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text or "unnamed"


def _split_gherkin_sentences(text: str) -> list[tuple[str | None, str]]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    # Split on canonical Gherkin keywords. The post-processing merger handles
    # specific cases like "...email... And password..." as one domain keyword.
    pattern = re.compile(r"\b(given|when|then|and|but)\b", re.IGNORECASE)
    matches = list(pattern.finditer(text))
    if not matches:
        return [(None, text)]
    segments: list[tuple[str | None, str]] = []
    for idx, match in enumerate(matches):
        end = match.end()
        next_start = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        sentence = text[end:next_start].strip()
        keyword = match.group(1).lower()
        if sentence:
            segments.append((keyword, sentence))
    return segments


def _normalize_quotes(text: str) -> str:
    return text.replace('"', "'")


def _sanitize_step_sentence(text: str) -> str:
    return text.strip().rstrip("#").strip()


def _merge_sign_in_steps(feature_steps: list[str]) -> list[str]:
    merged: list[str] = []
    index = 0
    sign_in_pattern = re.compile(
        r"^(Given|When|Then|And|But)\s+the user signs in with email\s+'([^']+)'$",
        re.IGNORECASE,
    )
    password_pattern = re.compile(
        r"^(Given|When|Then|And|But)\s+password\s+'([^']+)'$",
        re.IGNORECASE,
    )

    while index < len(feature_steps):
        current = feature_steps[index]
        if index + 1 < len(feature_steps):
            current_match = sign_in_pattern.match(current)
            next_match = password_pattern.match(feature_steps[index + 1])
            if current_match and next_match:
                keyword = current_match.group(1).capitalize()
                email = current_match.group(2)
                password = next_match.group(2)
                merged.append(
                    f"{keyword} the user signs in with email '{email}' and password '{password}'"
                )
                index += 2
                continue
        merged.append(current)
        index += 1

    return merged


def _suite_path(suite_id: int | None, suite_map: dict) -> list[str]:
    path = []
    current = suite_map.get(suite_id)
    seen = set()
    while current and current.get("id") not in seen:
        seen.add(current.get("id"))
        title = current.get("title") or current.get("name") or f"suite_{current.get('id')}"
        path.append(_slugify(title))
        parent_id = current.get("parent_id") or current.get("parentId") or current.get("parent")
        if parent_id in (0, "0"):
            parent_id = None
        current = suite_map.get(parent_id)
    return list(reversed(path))


def _safe_filename(text: str, fallback: str) -> str:
    name = _slugify(text)
    return name if name else fallback


def _write_text(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def _normalize_steps(case: dict) -> list[dict]:
    steps = case.get("steps")
    if isinstance(steps, list):
        return steps
    if isinstance(steps, str) and steps.strip():
        return [{"action": steps.strip(), "expected_result": ""}]
    return []


def _build_suite_outputs(cases: list[dict]) -> dict:
    suites = {}
    for case in cases:
        suite_id = case.get("suite_id") or case.get("suiteId") or case.get("suite")
        suites.setdefault(suite_id, []).append(case)
    return suites


def _parse_suite_ids(raw_suite_ids: list) -> set[int]:
    suite_ids: set[int] = set()
    for raw in raw_suite_ids:
        try:
            suite_ids.add(int(raw))
        except (TypeError, ValueError):
            continue
    return suite_ids


def _parse_suite_names(raw_suite_names: list) -> set[str]:
    suite_names: set[str] = set()
    for raw in raw_suite_names:
        if raw is None:
            continue
        name = str(raw).strip()
        if name:
            suite_names.add(name.lower())
    return suite_names


def _parse_case_ids(raw_case_ids: list) -> set[int]:
    case_ids: set[int] = set()
    for raw in raw_case_ids:
        try:
            case_ids.add(int(raw))
        except (TypeError, ValueError):
            continue
    return case_ids


def _get_case_suite_id(case: dict) -> int | None:
    suite_id = case.get("suite_id") or case.get("suiteId") or case.get("suite")
    try:
        return int(suite_id)
    except (TypeError, ValueError):
        return None


def _get_suite_id(suite: dict) -> int | None:
    suite_id = suite.get("id")
    try:
        return int(suite_id)
    except (TypeError, ValueError):
        return None


def _get_case_id(case: dict) -> int | None:
    case_id = case.get("id") or case.get("case_id") or case.get("caseId")
    try:
        return int(case_id)
    except (TypeError, ValueError):
        return None


def _load_pull_config(pull_config_path: str | None) -> tuple[set[int], set[str], set[int], bool]:
    if not pull_config_path:
        return set(), set(), set(), True
    config = _read_config(pull_config_path)
    suite_ids = _parse_suite_ids(config.get("suite_ids", []))
    suite_names = _parse_suite_names(config.get("suite_names", []))
    case_ids = _parse_case_ids(config.get("case_ids", []))
    pull_all_when_empty = bool(config.get("pull_all_when_empty", False))
    return suite_ids, suite_names, case_ids, pull_all_when_empty


def _get_suite_name(suite: dict) -> str:
    name = suite.get("title") or suite.get("name") or ""
    return str(name).strip().lower()


def _resolve_suite_ids_by_name(suites: list[dict], wanted_names: set[str]) -> tuple[set[int], set[str]]:
    if not wanted_names:
        return set(), set()
    resolved: set[int] = set()
    unresolved = set(wanted_names)
    for suite in suites:
        suite_name = _get_suite_name(suite)
        suite_id = _get_suite_id(suite)
        if suite_name in wanted_names and suite_id is not None:
            resolved.add(suite_id)
            unresolved.discard(suite_name)
    return resolved, unresolved


def main() -> int:
    parser = argparse.ArgumentParser(description="Pull Qase cases and run gherkin2robotframework.")
    parser.add_argument("--config", default="qase.config.json", help="Path to qase.config.json")
    parser.add_argument("--base-url", default=os.getenv("QASE_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument(
        "--project",
        default=os.getenv("QASE_PROJECT") or os.getenv("QASE_TESTOPS_PROJECT"),
    )
    parser.add_argument(
        "--token",
        default=os.getenv("QASE_TOKEN") or os.getenv("QASE_TESTOPS_API_TOKEN"),
    )
    parser.add_argument("--g2rf-out", default="robot-tests", help="Output folder for gherkin2robotframework.")
    parser.add_argument(
        "--pull-config",
        default=None,
        help="Path to pull config JSON containing suite_ids/suite_names/case_ids.",
    )
    parser.add_argument(
        "--suite-ids",
        nargs="*",
        default=[],
        help="Optional suite IDs to pull. Example: --suite-ids 12 19",
    )
    parser.add_argument(
        "--case-ids",
        nargs="*",
        default=[],
        help="Optional case IDs to pull. Example: --case-ids 120 152",
    )
    parser.add_argument(
        "--suite-names",
        nargs="*",
        default=[],
        help='Optional suite names to pull. Example: --suite-names "Smoke Tests"',
    )
    parser.add_argument("--insecure", action="store_true", help="Disable SSL verification (use only for local MITM/corporate proxies).")
    args = parser.parse_args()

    config = _read_config(args.config)
    project = args.project or _get_config_value(config, "testops", "project")
    token = args.token or _get_config_value(config, "testops", "api", "token")

    if not project:
        print("Missing project code. Provide --project or set in qase.config.json", file=sys.stderr)
        return 2
    if not token:
        print("Missing API token. Provide --token or set in qase.config.json", file=sys.stderr)
        return 2

    ssl_context = None
    if args.insecure:
        ssl_context = ssl._create_unverified_context()

    configured_suite_ids, configured_suite_names, configured_case_ids, pull_all_when_empty = _load_pull_config(args.pull_config)
    cli_suite_ids = _parse_suite_ids(args.suite_ids)
    cli_case_ids = _parse_case_ids(args.case_ids)
    cli_suite_names = _parse_suite_names(args.suite_names)
    selected_suite_ids = configured_suite_ids.union(cli_suite_ids)
    selected_suite_names = configured_suite_names.union(cli_suite_names)
    selected_case_ids = configured_case_ids.union(cli_case_ids)
    if not selected_suite_ids and not selected_suite_names and not selected_case_ids and not pull_all_when_empty:
        print(
            "No suite_ids/suite_names/case_ids configured. Define in pull config or pass --suite-ids/--suite-names/--case-ids.",
            file=sys.stderr,
        )
        return 2

    suites = _fetch_paginated(args.base_url, token, "suite", project, ssl_context)
    resolved_ids, unresolved_names = _resolve_suite_ids_by_name(suites, selected_suite_names)
    if unresolved_names:
        print(
            f"Suite names not found: {sorted(unresolved_names)}.",
            file=sys.stderr,
        )
        return 4
    selected_suite_ids = selected_suite_ids.union(resolved_ids)
    cases = _fetch_paginated(args.base_url, token, "case", project, ssl_context)
    if selected_suite_ids:
        suites = [suite for suite in suites if _get_suite_id(suite) in selected_suite_ids]
        cases = [case for case in cases if _get_case_suite_id(case) in selected_suite_ids]
    if selected_case_ids:
        cases = [case for case in cases if _get_case_id(case) in selected_case_ids]

    if not cases:
        active_filters = []
        if selected_suite_ids:
            active_filters.append(f"suite_ids={sorted(selected_suite_ids)}")
        if selected_case_ids:
            active_filters.append(f"case_ids={sorted(selected_case_ids)}")
        if selected_suite_names:
            active_filters.append(f"suite_names={sorted(selected_suite_names)}")
        filter_text = ", ".join(active_filters) if active_filters else "no filters"
        print(
            f"No Qase cases found for {filter_text}.",
            file=sys.stderr,
        )
        return 4

    suite_map = {s.get("id"): s for s in suites if isinstance(s, dict)}
    cases_by_suite = _build_suite_outputs(cases)

    feature_root = tempfile.mkdtemp(prefix="qase_features_")

    for suite_id, suite_cases in cases_by_suite.items():
        suite_path_parts = _suite_path(suite_id, suite_map)
        suite_info = suite_map.get(suite_id, {}) if suite_id is not None else {}
        suite_title = suite_info.get("title") or suite_info.get("name") or "unsorted"
        if not suite_path_parts:
            suite_path_parts = ["unsorted"]

        suite_slug = _safe_filename(suite_title, "suite")
        feature_dir = os.path.join(feature_root, *suite_path_parts)
        feature_file = os.path.join(feature_dir, f"{suite_slug}.feature")

        feature_lines = []
        feature_lines.append(f"Feature: {suite_title}\n\n")

        for case in suite_cases:
            case_id = _get_case_id(case)
            case_title = case.get("title") or case.get("name") or f"Case {case.get('id')}"
            if case_id is not None:
                feature_lines.append(f"@Q-{case_id}\n")
            feature_lines.append(f"Scenario: {_normalize_quotes(case_title)}\n")
            if case.get("description"):
                for line in str(case.get("description")).splitlines():
                    feature_lines.append(f"  # {_normalize_quotes(line)}\n")

            steps = _normalize_steps(case)
            feature_steps = []

            for idx, step in enumerate(steps, start=1):
                action = step.get("action") or step.get("content") or step.get("name") or f"Step {idx}"
                action = _normalize_quotes(action)
                sentences = _split_gherkin_sentences(action)
                if not sentences:
                    sentences = [(None, action)]

                for keyword, sentence in sentences:
                    sentence = _sanitize_step_sentence(sentence)
                    if not sentence:
                        continue
                    if keyword:
                        feature_step = f"{keyword.capitalize()} {sentence}"
                    else:
                        fallback = "given" if not feature_steps else "and"
                        feature_step = f"{fallback.capitalize()} {sentence}"
                    feature_steps.append(feature_step)

            feature_steps = _merge_sign_in_steps(feature_steps)
            for step_line in feature_steps:
                feature_lines.append(f"  {step_line}\n")
            feature_lines.append("\n")

        _write_text(feature_file, "".join(feature_lines))

    out_root = os.path.abspath(args.g2rf_out)
    os.makedirs(out_root, exist_ok=True)

    module_spec = importlib.util.find_spec("gherkin2robotframework")
    if module_spec is not None:
        cmd = [sys.executable, "-m", "gherkin2robotframework", feature_root, out_root]
    else:
        exe = shutil.which("gherkin2robotframework")
        if not exe:
            print("gherkin2robotframework is not available. Install it in the active venv.", file=sys.stderr)
            return 3
        cmd = [exe, feature_root, out_root]

    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        print("gherkin2robotframework failed.", file=sys.stderr)
        return result.returncode

    settings_block = "*** Settings ***\nResource            ../../Resource/MainLib.resource\n\n"
    for resource_path in Path(out_root).rglob("*.resource"):
        content = resource_path.read_text(encoding="utf-8")
        if "Resource            ../../Resource/MainLib.resource" in content:
            continue
        if "*** Settings ***" in content:
            parts = content.split("*** Settings ***", 1)
            after = parts[1].lstrip("\n") if len(parts) > 1 else ""
            content = parts[0] + settings_block + after
        else:
            content = settings_block + content
        resource_path.write_text(content, encoding="utf-8")

    # Prevent autogenerated failing step-definition stubs from shadowing real project keywords.
    for robot_path in Path(out_root).rglob("*.robot"):
        content = robot_path.read_text(encoding="utf-8")
        lines = content.splitlines()
        filtered_lines: list[str] = []
        inserted_mainlib = False
        rel_mainlib = os.path.relpath(Path("Resource/MainLib.resource"), robot_path.parent)
        rel_mainlib = rel_mainlib.replace("\\", "/")
        mainlib_line = f"Resource    {rel_mainlib}"

        for line in lines:
            if "_step_definitions.resource" in line:
                continue
            filtered_lines.append(line)
            if line.strip() == "*** Settings ***":
                filtered_lines.append(mainlib_line)
                inserted_mainlib = True

        if not inserted_mainlib:
            filtered_lines = ["*** Settings ***", mainlib_line, ""] + filtered_lines

        robot_path.write_text("\n".join(filtered_lines) + "\n", encoding="utf-8")

    print(f"Generated {len(cases)} cases across {len(cases_by_suite)} suite folders.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
