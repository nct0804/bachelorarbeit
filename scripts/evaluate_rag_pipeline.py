#!/usr/bin/env python3
"""Evaluate modular RAG generation against an ungrounded zero-shot baseline."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from src.components.semantic.gherkin_support import (  # noqa: E402
    FeatureStep,
    GherkinStepMapper,
    KeywordEntry,
    build_keyword_catalog,
    load_feature_documents,
)

DEFAULT_EMAIL = "chithien.nguyen@germangains.com"
DEFAULT_PASSWORD = "password123"
QUOTED_VALUE_PATTERN = re.compile(r"'([^']+)'|\"([^\"]+)\"")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
NUMBER_PATTERN = re.compile(r"\b\d+\b")
SPACE_PATTERN = re.compile(r"\s+")


@dataclass
class GeneratedCall:
    """Generated Robot keyword call."""

    keyword: str
    arguments: list[str]
    match_source: str = "baseline"
    confidence: float | None = None


@dataclass
class SystemResult:
    """Aggregated evaluation result for one generation system."""

    name: str
    source_steps: int
    scenarios: int
    scenario_count_matches: int
    generated_keywords: int
    hallucinated_keywords: int
    syntax_errors: int

    @property
    def hallucination_rate(self) -> float:
        if self.generated_keywords == 0:
            return 0.0
        return (self.hallucinated_keywords / self.generated_keywords) * 100.0

    @property
    def step_mapping_accuracy(self) -> float:
        if self.scenarios == 0:
            return 0.0
        return (self.scenario_count_matches / self.scenarios) * 100.0


def normalize_keyword_key(keyword: str) -> str:
    """Return Robot-style case-insensitive keyword key."""
    lowered = keyword.replace("_", " ").strip().lower()
    return SPACE_PATTERN.sub(" ", lowered)


def title_from_text(value: str) -> str:
    """Normalize a user-visible value to Title Case."""
    cleaned = SPACE_PATTERN.sub(" ", str(value or "").replace("_", " ")).strip()
    return cleaned.title() if cleaned else ""


def extract_quoted_values(text: str) -> list[str]:
    """Extract single- or double-quoted values from source text."""
    return [left or right for left, right in QUOTED_VALUE_PATTERN.findall(text)]


def first_quoted(text: str, default: str = "Element") -> str:
    """Return the first quoted value, or a default."""
    values = extract_quoted_values(text)
    return values[0] if values else default


def last_quoted(text: str, default: str = "Value") -> str:
    """Return the last quoted value, or a default."""
    values = extract_quoted_values(text)
    return values[-1] if values else default


def page_slug(page_name: str) -> str:
    """Convert page name into a naive URL-like slug."""
    cleaned = re.sub(r"[^A-Za-z0-9]+", "-", page_name.strip().lower()).strip("-")
    return f"/{cleaned or 'page'}"


def make_baseline_calls(step: FeatureStep) -> list[GeneratedCall]:
    """Generate a zero-shot baseline without reading the project keyword catalog."""
    text = step.text
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
        return [GeneratedCall("Go To", [page_slug(first_quoted(text, "page"))])]

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

    return [GeneratedCall("Log", [text])]


def build_keyword_lookup(catalog: list[KeywordEntry]) -> dict[str, KeywordEntry]:
    """Build a normalized keyword lookup from project resources."""
    lookup: dict[str, KeywordEntry] = {}
    for keyword in catalog:
        lookup[normalize_keyword_key(keyword.keyword_name)] = keyword
    return lookup


def syntax_error_reason(call: GeneratedCall, keyword_entry: KeywordEntry | None) -> str:
    """Return a syntax/interface error reason, or an empty string."""
    if not call.keyword.strip():
        return "empty keyword"
    if keyword_entry is None:
        return ""

    required_args = [arg for arg in keyword_entry.arguments if arg.default_value is None]
    max_args = len(keyword_entry.arguments)
    min_args = len(required_args)
    actual_args = len(call.arguments)

    if actual_args < min_args:
        return f"too few arguments: expected at least {min_args}, got {actual_args}"
    if actual_args > max_args:
        return f"too many arguments: expected at most {max_args}, got {actual_args}"
    return ""


def evaluate_system(
    *,
    name: str,
    features_root: Path,
    catalog_lookup: dict[str, KeywordEntry],
    generate_calls,
    output_rows: list[dict[str, str]],
    scenario_rows: list[dict[str, str]],
) -> SystemResult:
    """Evaluate one system over all Gherkin scenarios."""
    feature_documents = load_feature_documents(features_root)
    source_steps = 0
    scenario_count = 0
    scenario_count_matches = 0
    generated_keywords = 0
    hallucinated_keywords = 0
    syntax_errors = 0

    for feature in feature_documents:
        for scenario in feature.scenarios:
            scenario_count += 1
            scenario_source_steps = len(scenario.steps)
            scenario_generated_keywords = 0
            source_steps += scenario_source_steps

            for step_index, step in enumerate(scenario.steps, start=1):
                calls = generate_calls(step)
                scenario_generated_keywords += len(calls)
                generated_keywords += len(calls)

                for call_index, call in enumerate(calls, start=1):
                    keyword_entry = catalog_lookup.get(normalize_keyword_key(call.keyword))
                    hallucinated = keyword_entry is None
                    reason = syntax_error_reason(call, keyword_entry)

                    if hallucinated:
                        hallucinated_keywords += 1
                    if reason:
                        syntax_errors += 1

                    output_rows.append(
                        {
                            "SYSTEM": name,
                            "FEATURE_FILE": feature.source_file,
                            "FEATURE": feature.feature_name,
                            "SCENARIO": scenario.name,
                            "STEP_INDEX": str(step_index),
                            "CALL_INDEX": str(call_index),
                            "STEP_CLAUSE": step.clause,
                            "SOURCE_STEP": step.text,
                            "GENERATED_KEYWORD": call.keyword,
                            "ARGUMENTS": " | ".join(call.arguments),
                            "MATCH_SOURCE": call.match_source,
                            "CONFIDENCE": "" if call.confidence is None else f"{call.confidence:.4f}",
                            "VALID_PROJECT_KEYWORD": "YES" if not hallucinated else "NO",
                            "HALLUCINATED": "YES" if hallucinated else "NO",
                            "SYNTAX_ERROR": "YES" if reason else "NO",
                            "SYNTAX_ERROR_REASON": reason,
                        }
                    )

            count_matches = scenario_generated_keywords == scenario_source_steps
            if count_matches:
                scenario_count_matches += 1

            scenario_rows.append(
                {
                    "SYSTEM": name,
                    "FEATURE_FILE": feature.source_file,
                    "FEATURE": feature.feature_name,
                    "SCENARIO": scenario.name,
                    "SOURCE_STEPS": str(scenario_source_steps),
                    "GENERATED_KEYWORDS": str(scenario_generated_keywords),
                    "COUNT_MATCH": "YES" if count_matches else "NO",
                }
            )

    return SystemResult(
        name=name,
        source_steps=source_steps,
        scenarios=scenario_count,
        scenario_count_matches=scenario_count_matches,
        generated_keywords=generated_keywords,
        hallucinated_keywords=hallucinated_keywords,
        syntax_errors=syntax_errors,
    )


def write_csv(path: Path, rows: list[dict[str, str]], headers: list[str]) -> None:
    """Write rows to CSV."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def latex_escape(value: str) -> str:
    """Escape text for LaTeX table cells."""
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
    output = value
    for source, target in replacements.items():
        output = output.replace(source, target)
    return output


def write_latex_table(path: Path, results: list[SystemResult]) -> None:
    """Write a thesis-ready LaTeX comparison table."""
    lines = [
        r"\begin{table}[htbp]",
        r"\centering",
        r"\caption{Comparison of modular RAG and zero-shot baseline on the Gherkin dataset.}",
        r"\label{tab:rag_pipeline_evaluation}",
        r"\begin{tabular}{lrrrrrr}",
        r"\toprule",
        r"Pipeline & Source Steps & Generated Keywords & Hallucinated Keywords & HR (\%) & SMA (\%) & Syntax Errors \\",
        r"\midrule",
    ]
    for result in results:
        lines.append(
            " & ".join(
                [
                    latex_escape(result.name),
                    str(result.source_steps),
                    str(result.generated_keywords),
                    str(result.hallucinated_keywords),
                    f"{result.hallucination_rate:.2f}",
                    f"{result.step_mapping_accuracy:.2f}",
                    str(result.syntax_errors),
                ]
            )
            + r" \\"
        )
    lines.extend([r"\bottomrule", r"\end{tabular}", r"\end{table}", ""])
    path.write_text("\n".join(lines), encoding="utf-8")


def write_latex_figure(path: Path, results: list[SystemResult]) -> None:
    """Write a PGFPlots bar chart for HR and SMA."""
    coordinates_hr = " ".join(
        f"({{{latex_escape(result.name)}}},{result.hallucination_rate:.2f})" for result in results
    )
    coordinates_sma = " ".join(
        f"({{{latex_escape(result.name)}}},{result.step_mapping_accuracy:.2f})" for result in results
    )
    lines = [
        r"\begin{figure}[htbp]",
        r"\centering",
        r"\begin{tikzpicture}",
        r"\begin{axis}[",
        r"    ybar,",
        r"    ymin=0, ymax=100,",
        r"    ylabel={Score (\%)},",
        r"    symbolic x coords={"
        + ",".join(latex_escape(result.name) for result in results)
        + r"},",
        r"    xtick=data,",
        r"    x tick label style={rotate=20, anchor=east},",
        r"    bar width=12pt,",
        r"    width=0.92\linewidth,",
        r"    height=6cm,",
        r"    legend style={at={(0.5,1.05)}, anchor=south, legend columns=2},",
        r"]",
        rf"\addplot coordinates {{{coordinates_hr}}};",
        rf"\addplot coordinates {{{coordinates_sma}}};",
        r"\legend{Hallucination Rate, Step Mapping Accuracy}",
        r"\end{axis}",
        r"\end{tikzpicture}",
        r"\caption{Hallucination rate and step mapping accuracy for the modular RAG pipeline and the zero-shot baseline.}",
        r"\label{fig:rag_pipeline_evaluation}",
        r"\end{figure}",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def write_markdown_report(path: Path, results: list[SystemResult], features_root: Path, resource_root: Path) -> None:
    """Write a concise evaluation report."""
    lines = [
        "# RAG Pipeline Evaluation",
        "",
        f"Dataset: `{features_root}`",
        f"Resource keyword catalog: `{resource_root}`",
        "",
        "The hallucination rate counts generated keyword names that do not appear in the project's Robot Framework resource files. Step Mapping Accuracy (SMA) is measured as the percentage of scenarios where the number of generated Robot keyword calls exactly matches the number of source Gherkin steps.",
        "",
        "| Pipeline | Source Steps | Generated Keywords | Hallucinated Keywords | HR (%) | SMA (%) | Syntax Errors |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    for result in results:
        lines.append(
            f"| {result.name} | {result.source_steps} | {result.generated_keywords} | "
            f"{result.hallucinated_keywords} | {result.hallucination_rate:.2f} | "
            f"{result.step_mapping_accuracy:.2f} | {result.syntax_errors} |"
        )
    lines.extend(
        [
            "",
            "Baseline definition: the zero-shot baseline is a deterministic proxy for an ungrounded LLM output. It converts source Gherkin steps into common Robot/Selenium-style commands without reading the project keyword catalog, without project-specific preprocessing, and without a retrieved tool dictionary.",
            "",
            "Generated artifacts:",
            "",
            "- `evaluation_summary.csv`: aggregate metrics.",
            "- `detailed_step_report.csv`: per-step generated keyword calls and hallucination flags.",
            "- `scenario_mapping_report.csv`: per-scenario source/generated step counts for SMA.",
            "- `evaluation_table.tex`: LaTeX table for the paper.",
            "- `evaluation_figure.tex`: PGFPlots chart for the paper.",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_png_chart(path: Path, results: list[SystemResult]) -> None:
    """Write a PNG chart if matplotlib is available."""
    try:
        import matplotlib.pyplot as plt
    except Exception:
        return

    labels = [result.name for result in results]
    hr_values = [result.hallucination_rate for result in results]
    sma_values = [result.step_mapping_accuracy for result in results]
    x_values = list(range(len(labels)))
    width = 0.35

    figure, axis = plt.subplots(figsize=(8, 4.8))
    axis.bar([x - width / 2 for x in x_values], hr_values, width, label="HR (%)", color="#b91c1c")
    axis.bar([x + width / 2 for x in x_values], sma_values, width, label="SMA (%)", color="#2563eb")
    axis.set_ylabel("Score (%)")
    axis.set_ylim(0, 100)
    axis.set_xticks(x_values)
    axis.set_xticklabels(labels, rotation=15, ha="right")
    axis.legend()
    axis.grid(axis="y", linestyle="--", alpha=0.35)
    figure.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(path, dpi=200)
    plt.close(figure)


def build_argument_parser() -> argparse.ArgumentParser:
    """Build CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="Evaluate modular RAG against a zero-shot baseline on Gherkin features."
    )
    parser.add_argument("--features-root", default="requirements/gherkin", help="Gherkin dataset directory.")
    parser.add_argument("--resource-root", default="Resource", help="Robot resource root.")
    parser.add_argument(
        "--output-dir",
        default="Results/rag-pipeline-evaluation",
        help="Directory for evaluation artifacts.",
    )
    return parser


def main() -> int:
    """Run evaluation and export artifacts."""
    args = build_argument_parser().parse_args()
    features_root = PROJECT_ROOT / args.features_root
    resource_root = PROJECT_ROOT / args.resource_root
    output_dir = PROJECT_ROOT / args.output_dir

    catalog = build_keyword_catalog(resource_root)
    catalog_lookup = build_keyword_lookup(catalog)
    mapper = GherkinStepMapper.from_resource_root(resource_root)

    def generate_modular_calls(step: FeatureStep) -> list[GeneratedCall]:
        analysis = mapper.analyze_step(step.text)
        keyword, arguments, confidence, match_source = mapper.map_step(analysis)
        return [
            GeneratedCall(
                keyword=keyword,
                arguments=arguments,
                match_source=match_source,
                confidence=confidence,
            )
        ]

    detail_rows: list[dict[str, str]] = []
    scenario_rows: list[dict[str, str]] = []
    results = [
        evaluate_system(
            name="Modular RAG",
            features_root=features_root,
            catalog_lookup=catalog_lookup,
            generate_calls=generate_modular_calls,
            output_rows=detail_rows,
            scenario_rows=scenario_rows,
        ),
        evaluate_system(
            name="Zero-Shot Baseline",
            features_root=features_root,
            catalog_lookup=catalog_lookup,
            generate_calls=make_baseline_calls,
            output_rows=detail_rows,
            scenario_rows=scenario_rows,
        ),
    ]

    output_dir.mkdir(parents=True, exist_ok=True)
    summary_rows = [
        {
            "SYSTEM": result.name,
            "SOURCE_STEPS": str(result.source_steps),
            "SCENARIOS": str(result.scenarios),
            "SCENARIO_COUNT_MATCHES": str(result.scenario_count_matches),
            "GENERATED_KEYWORDS": str(result.generated_keywords),
            "HALLUCINATED_KEYWORDS": str(result.hallucinated_keywords),
            "HALLUCINATION_RATE": f"{result.hallucination_rate:.4f}",
            "STEP_MAPPING_ACCURACY": f"{result.step_mapping_accuracy:.4f}",
            "SYNTAX_ERRORS": str(result.syntax_errors),
        }
        for result in results
    ]
    write_csv(
        output_dir / "evaluation_summary.csv",
        summary_rows,
        [
            "SYSTEM",
            "SOURCE_STEPS",
            "SCENARIOS",
            "SCENARIO_COUNT_MATCHES",
            "GENERATED_KEYWORDS",
            "HALLUCINATED_KEYWORDS",
            "HALLUCINATION_RATE",
            "STEP_MAPPING_ACCURACY",
            "SYNTAX_ERRORS",
        ],
    )
    write_csv(
        output_dir / "detailed_step_report.csv",
        detail_rows,
        [
            "SYSTEM",
            "FEATURE_FILE",
            "FEATURE",
            "SCENARIO",
            "STEP_INDEX",
            "CALL_INDEX",
            "STEP_CLAUSE",
            "SOURCE_STEP",
            "GENERATED_KEYWORD",
            "ARGUMENTS",
            "MATCH_SOURCE",
            "CONFIDENCE",
            "VALID_PROJECT_KEYWORD",
            "HALLUCINATED",
            "SYNTAX_ERROR",
            "SYNTAX_ERROR_REASON",
        ],
    )
    write_csv(
        output_dir / "scenario_mapping_report.csv",
        scenario_rows,
        [
            "SYSTEM",
            "FEATURE_FILE",
            "FEATURE",
            "SCENARIO",
            "SOURCE_STEPS",
            "GENERATED_KEYWORDS",
            "COUNT_MATCH",
        ],
    )
    (output_dir / "evaluation_metrics.json").write_text(
        json.dumps(summary_rows, indent=2),
        encoding="utf-8",
    )
    write_latex_table(output_dir / "evaluation_table.tex", results)
    write_latex_figure(output_dir / "evaluation_figure.tex", results)
    write_markdown_report(output_dir / "report.md", results, features_root, resource_root)
    write_png_chart(output_dir / "evaluation_chart.png", results)

    for result in results:
        print(
            f"{result.name}: HR={result.hallucination_rate:.2f}% "
            f"SMA={result.step_mapping_accuracy:.2f}% "
            f"syntax_errors={result.syntax_errors}"
        )
    print(f"Artifacts written to {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
