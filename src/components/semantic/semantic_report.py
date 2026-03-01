#!/usr/bin/env python3
"""Create readable thesis reports from semantic benchmark outputs."""

from __future__ import annotations

import argparse
import csv
from collections import Counter
from pathlib import Path

def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8") as file_handle:
        return list(csv.DictReader(file_handle))


def parse_float(value: str, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def parse_int(value: str, fallback: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def select_best_config(metrics_rows: list[dict[str, str]]) -> dict[str, str]:
    if not metrics_rows:
        raise ValueError("No metrics rows available for config selection.")
    sorted_rows = sorted(
        metrics_rows,
        key=lambda row: (
            parse_float(row.get("EFFICIENCY_INDEX", "0")),
            parse_float(row.get("COVERAGE_RATE", "0")),
            parse_int(row.get("AUTO", "0")),
            -parse_int(row.get("NO_MATCH", "0")),
        ),
        reverse=True,
    )
    return sorted_rows[0]


def build_best_match_rows(mapping_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for row in mapping_rows:
        result.append(
            {
                "REQ_ID": row.get("REQ_ID", ""),
                "REQUIREMENT_TEXT": row.get("REQUIREMENT_TEXT", ""),
                "REQUIREMENT_TYPE": row.get("REQUIREMENT_TYPE", ""),
                "STATUS": row.get("STATUS", ""),
                "BEST_MATCH_KEYWORD": row.get("MATCH_1_KEYWORD", ""),
                "BEST_MATCH_SCORE": row.get("MATCH_1_SCORE", ""),
                "BEST_MATCH_MODULE": row.get("MATCH_1_MODULE", ""),
                "BEST_MATCH_SOURCE": row.get("MATCH_1_SOURCE", ""),
                "BEST_MATCH_SEMANTIC": row.get("MATCH_1_SEMANTIC", ""),
                "BEST_MATCH_LEXICAL": row.get("MATCH_1_LEXICAL", ""),
                "NLP_ACTIONS": row.get("NLP_ACTIONS", ""),
            }
        )
    return result


def write_csv(path: Path, rows: list[dict[str, str]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_markdown_table(path: Path, rows: list[dict[str, str]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        values = [str(row.get(header, "")).replace("|", "\\|") for header in headers]
        lines.append("| " + " | ".join(values) + " |")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def escape_latex(text: str) -> str:
    replacements = {
        "\\": "\\textbackslash{}",
        "&": "\\&",
        "%": "\\%",
        "$": "\\$",
        "#": "\\#",
        "_": "\\_",
        "{": "\\{",
        "}": "\\}",
        "~": "\\textasciitilde{}",
        "^": "\\textasciicircum{}",
    }
    escaped = text
    for source, target in replacements.items():
        escaped = escaped.replace(source, target)
    return escaped


def write_latex_table(path: Path, rows: list[dict[str, str]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    column_spec = " | ".join(["p{2.0cm}", "p{7.0cm}", "p{2.8cm}", "p{4.6cm}", "p{1.4cm}"])
    selected_headers = ["REQ_ID", "REQUIREMENT_TEXT", "REQUIREMENT_TYPE", "BEST_MATCH_KEYWORD", "BEST_MATCH_SCORE"]
    lines = [
        "\\begin{tabular}{" + column_spec + "}",
        "\\hline",
        " & ".join(escape_latex(header) for header in selected_headers) + " \\\\",
        "\\hline",
    ]
    for row in rows:
        values = [escape_latex(str(row.get(header, ""))) for header in selected_headers]
        lines.append(" & ".join(values) + " \\\\")
    lines.extend(["\\hline", "\\end{tabular}", ""])
    path.write_text("\n".join(lines), encoding="utf-8")


def create_plots(
    output_dir: Path,
    best_match_rows: list[dict[str, str]],
    metrics_rows: list[dict[str, str]],
) -> tuple[list[str], str]:
    try:
        import matplotlib

        # Force a headless backend to avoid macOS AppKit crashes in CLI runs.
        matplotlib.use("Agg", force=True)
        import matplotlib.pyplot as plt
    except Exception as error:
        return [], str(error)

    output_dir.mkdir(parents=True, exist_ok=True)
    figure_paths: list[str] = []

    status_counts = Counter(row.get("STATUS", "UNKNOWN") for row in best_match_rows)
    status_labels = list(status_counts.keys())
    status_values = [status_counts[label] for label in status_labels]
    plt.figure(figsize=(6, 4))
    plt.bar(status_labels, status_values)
    plt.title("Best-Match Status Distribution")
    plt.xlabel("Status")
    plt.ylabel("Count")
    path_status = output_dir / "status_distribution.png"
    plt.tight_layout()
    plt.savefig(path_status)
    plt.close()
    figure_paths.append(str(path_status))

    score_values = [parse_float(row.get("BEST_MATCH_SCORE", "0")) for row in best_match_rows]
    plt.figure(figsize=(6, 4))
    plt.hist(score_values, bins=8)
    plt.title("Best-Match Score Distribution")
    plt.xlabel("Top-1 Score")
    plt.ylabel("Frequency")
    path_scores = output_dir / "best_score_distribution.png"
    plt.tight_layout()
    plt.savefig(path_scores)
    plt.close()
    figure_paths.append(str(path_scores))

    config_labels = [row.get("CONFIG", "") for row in metrics_rows]
    efficiency_values = [parse_float(row.get("EFFICIENCY_INDEX", "0")) for row in metrics_rows]
    plt.figure(figsize=(8, 4))
    plt.bar(config_labels, efficiency_values)
    plt.title("Efficiency Index by Configuration")
    plt.xlabel("Configuration")
    plt.ylabel("Efficiency Index")
    plt.xticks(rotation=20, ha="right")
    path_eff = output_dir / "efficiency_by_config.png"
    plt.tight_layout()
    plt.savefig(path_eff)
    plt.close()
    figure_paths.append(str(path_eff))

    return figure_paths, ""


def write_report_markdown(
    output_path: Path,
    selected_config: dict[str, str],
    best_match_rows: list[dict[str, str]],
    figure_paths: list[str],
    figure_note: str,
) -> None:
    status_counts = Counter(row.get("STATUS", "UNKNOWN") for row in best_match_rows)
    lines = [
        "# Semantic Benchmark Readable Report",
        "",
        "## Selected Configuration",
        f"- Config: `{selected_config.get('CONFIG', '')}`",
        f"- Backend: `{selected_config.get('BACKEND', '')}`",
        f"- Weights (semantic/lexical): `{selected_config.get('SEMANTIC_WEIGHT', '')}/{selected_config.get('LEXICAL_WEIGHT', '')}`",
        f"- Coverage: `{selected_config.get('COVERAGE_RATE', '')}`",
        f"- Efficiency Index: `{selected_config.get('EFFICIENCY_INDEX', '')}`",
        "",
        "## Best-Match Summary",
        f"- Total requirements: `{len(best_match_rows)}`",
        f"- AUTO_SUGGEST: `{status_counts.get('AUTO_SUGGEST', 0)}`",
        f"- NEEDS_REVIEW: `{status_counts.get('NEEDS_REVIEW', 0)}`",
        f"- NO_MATCH: `{status_counts.get('NO_MATCH', 0)}`",
        "",
        "## Generated Files",
        "- `best_match_table.csv`",
        "- `best_match_table.md`",
        "- `best_match_table.tex`",
    ]
    if figure_paths:
        lines.append("- `figures/*.png`")
    else:
        lines.append(f"- `figures/*.png` ({figure_note})")
    lines.append("")
    lines.append("## Notes")
    lines.append("- Table focuses on `Requirement vs Best Match` only.")
    lines.append("- Use the LaTeX table directly in thesis chapters.")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate readable report from semantic benchmark output.")
    parser.add_argument(
        "--metrics-csv",
        required=True,
        help="Path to benchmark metrics.csv (from semantic_evaluation.py).",
    )
    parser.add_argument(
        "--runs-root",
        required=True,
        help="Path to runs directory (from semantic_evaluation.py).",
    )
    parser.add_argument(
        "--output-dir",
        default="Results/semantic-readable-report",
        help="Directory for readable report artifacts.",
    )
    parser.add_argument(
        "--config",
        default=None,
        help="Optional fixed config name. If omitted, best config is selected automatically.",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=0,
        help="Optional limit for number of requirement rows in outputs (0 = all).",
    )
    parser.add_argument(
        "--generate-figures",
        action="store_true",
        help="Generate matplotlib figures (disabled by default for stable headless runs).",
    )
    args = parser.parse_args()

    metrics_csv = Path(args.metrics_csv)
    runs_root = Path(args.runs_root)
    output_dir = Path(args.output_dir)

    if not metrics_csv.exists():
        raise SystemExit(f"Metrics file not found: {metrics_csv}")
    if not runs_root.exists():
        raise SystemExit(f"Runs root not found: {runs_root}")

    metrics_rows = read_csv_rows(metrics_csv)
    if not metrics_rows:
        raise SystemExit("No rows found in metrics CSV.")

    selected_config = None
    if args.config:
        for row in metrics_rows:
            if row.get("CONFIG") == args.config:
                selected_config = row
                break
        if selected_config is None:
            raise SystemExit(f"Config not found in metrics.csv: {args.config}")
    else:
        selected_config = select_best_config(metrics_rows)

    mapping_report = runs_root / selected_config["CONFIG"] / "mapping_report.csv"
    if not mapping_report.exists():
        raise SystemExit(f"Mapping report not found: {mapping_report}")

    mapping_rows = read_csv_rows(mapping_report)
    best_match_rows = build_best_match_rows(mapping_rows)
    if args.top_n and args.top_n > 0:
        best_match_rows = best_match_rows[: args.top_n]

    headers = [
        "REQ_ID",
        "REQUIREMENT_TEXT",
        "REQUIREMENT_TYPE",
        "STATUS",
        "BEST_MATCH_KEYWORD",
        "BEST_MATCH_SCORE",
        "BEST_MATCH_MODULE",
        "BEST_MATCH_SOURCE",
        "BEST_MATCH_SEMANTIC",
        "BEST_MATCH_LEXICAL",
        "NLP_ACTIONS",
    ]
    write_csv(output_dir / "best_match_table.csv", best_match_rows, headers)
    write_markdown_table(
        output_dir / "best_match_table.md",
        best_match_rows,
        ["REQ_ID", "REQUIREMENT_TEXT", "REQUIREMENT_TYPE", "STATUS", "BEST_MATCH_KEYWORD", "BEST_MATCH_SCORE"],
    )
    write_latex_table(output_dir / "best_match_table.tex", best_match_rows, headers)

    figure_paths: list[str] = []
    figure_note = "skipped by default; rerun with --generate-figures"
    if args.generate_figures:
        figure_paths, figure_error = create_plots(output_dir / "figures", best_match_rows, metrics_rows)
        if figure_paths:
            figure_note = "generated"
        elif figure_error:
            figure_note = f"generation failed: {figure_error}"
        else:
            figure_note = "generation failed"

    write_report_markdown(output_dir / "report.md", selected_config, best_match_rows, figure_paths, figure_note)

    print(f"Selected config: {selected_config['CONFIG']}")
    print(f"Readable report: {output_dir / 'report.md'}")
    print(f"Best-match table (MD): {output_dir / 'best_match_table.md'}")
    print(f"Best-match table (LaTeX): {output_dir / 'best_match_table.tex'}")
    if figure_paths:
        print(f"Figures generated: {len(figure_paths)}")
    elif args.generate_figures:
        print(f"Figures skipped: {figure_note}")
    else:
        print("Figures skipped: disabled by default. Use --generate-figures to enable.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
