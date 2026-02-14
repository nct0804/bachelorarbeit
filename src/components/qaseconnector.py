#!/usr/bin/env python3
"""Pull Qase TestOps suites/cases and run gherkin2robotframework.

Outputs:
- gherkin2robotframework output folder (Robot Framework files)
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Pull Qase cases and run gherkin2robotframework.")
    parser.add_argument("--config", default="qase.config.json", help="Path to qase.config.json")
    parser.add_argument("--base-url", default=os.getenv("QASE_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--project", default=os.getenv("QASE_PROJECT"))
    parser.add_argument("--token", default=os.getenv("QASE_TOKEN"))
    parser.add_argument("--g2rf-out", default="tests/qase_from_gherkin", help="Output folder for gherkin2robotframework.")
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

    suites = _fetch_paginated(args.base_url, token, "suite", project, ssl_context)
    cases = _fetch_paginated(args.base_url, token, "case", project, ssl_context)

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
            case_title = case.get("title") or case.get("name") or f"Case {case.get('id')}"
            feature_lines.append(f"Scenario: {case_title}\n")
            if case.get("description"):
                for line in str(case.get("description")).splitlines():
                    feature_lines.append(f"  # {line}\n")

            steps = _normalize_steps(case)
            feature_steps = []

            for idx, step in enumerate(steps, start=1):
                action = step.get("action") or step.get("content") or step.get("name") or f"Step {idx}"
                sentences = _split_gherkin_sentences(action)
                if not sentences:
                    sentences = [(None, action)]

                for keyword, sentence in sentences:
                    if keyword:
                        feature_step = f"{keyword.capitalize()} {sentence}"
                    else:
                        fallback = "given" if not feature_steps else "and"
                        feature_step = f"{fallback.capitalize()} {sentence}"
                    feature_steps.append(feature_step)

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

    print(f"Generated {len(cases)} cases across {len(cases_by_suite)} suite folders.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
