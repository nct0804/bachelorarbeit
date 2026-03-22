from __future__ import annotations

import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = CURRENT_DIR.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from src.components.semantic import semantic_mapper
from src.components.rag.models import ExampleSnippet


FEATURE_STEP_PREFIXES = ("given ", "when ", "then ", "and ", "but ")


def _extract_feature_steps(feature_path: Path) -> str:
    lines: list[str] = []
    for raw_line in feature_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        lowered = line.lower()
        if lowered.startswith(FEATURE_STEP_PREFIXES):
            lines.append(line)
    return "\n".join(lines)


def _extract_robot_steps(robot_path: Path, max_lines: int = 25) -> str:
    content = robot_path.read_text(encoding="utf-8").splitlines()
    in_test_cases = False
    collected: list[str] = []
    for line in content:
        stripped = line.strip()
        if stripped.startswith("***"):
            if stripped.lower() == "*** test cases ***":
                in_test_cases = True
                continue
            if in_test_cases:
                break
        if not in_test_cases:
            continue
        if not stripped:
            continue
        collected.append(stripped)
        if len(collected) >= max_lines:
            break
    return "\n".join(collected)


def load_example_pairs(features_root: Path, robot_tests_root: Path) -> list[ExampleSnippet]:
    examples: list[ExampleSnippet] = []
    if not features_root.exists() or not robot_tests_root.exists():
        return examples

    for feature_path in sorted(features_root.rglob("*.feature")):
        feature_steps = _extract_feature_steps(feature_path)
        if not feature_steps:
            continue
        robot_path = robot_tests_root / f"{feature_path.stem}.robot"
        if not robot_path.exists():
            continue
        robot_steps = _extract_robot_steps(robot_path)
        if not robot_steps:
            continue
        examples.append(
            ExampleSnippet(
                feature_name=feature_path.stem,
                feature_steps=feature_steps,
                robot_steps=robot_steps,
            )
        )
    return examples


def select_relevant_examples(
    requirement_text: str,
    examples: list[ExampleSnippet],
    top_n: int,
) -> list[ExampleSnippet]:
    if top_n <= 0 or not examples:
        return []
    scored: list[tuple[float, ExampleSnippet]] = []
    for example in examples:
        score = semantic_mapper.calculate_lexical_similarity(
            requirement_text,
            example.feature_steps,
            ignore_quoted_text_source=True,
            ignore_quoted_text_target=True,
        )
        scored.append((score, example))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [example for _, example in scored[:top_n]]
