#!/usr/bin/env python3
"""Compare two semantic mapping reports and emit a diff CSV.

Outputs rows where the top-1 recommendation or status changed.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path


def load_report(path: Path) -> dict[str, dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = {}
        for row in reader:
            key = row.get("REQ_ID") or row.get("REQUIREMENT_TEXT")
            if key:
                rows[key] = row
        return rows


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Compare semantic mapping reports.")
    parser.add_argument("--baseline", required=True, help="Baseline mapping_report.csv path.")
    parser.add_argument("--variant", required=True, help="Variant mapping_report.csv path.")
    parser.add_argument("--output", required=True, help="Output diff CSV path.")
    return parser


def main() -> int:
    parser = build_argument_parser()
    args = parser.parse_args()

    baseline_path = Path(args.baseline)
    variant_path = Path(args.variant)
    output_path = Path(args.output)

    if not baseline_path.exists():
        raise SystemExit(f"Baseline report not found: {baseline_path}")
    if not variant_path.exists():
        raise SystemExit(f"Variant report not found: {variant_path}")

    baseline_rows = load_report(baseline_path)
    variant_rows = load_report(variant_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        fieldnames = [
            "REQ_ID",
            "FEATURE",
            "REQUIREMENT_TEXT",
            "BASE_STATUS",
            "VARIANT_STATUS",
            "BASE_MATCH_1_KEYWORD",
            "VARIANT_MATCH_1_KEYWORD",
            "BASE_MATCH_1_SCORE",
            "VARIANT_MATCH_1_SCORE",
            "CHANGED",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        keys = sorted(set(baseline_rows) | set(variant_rows))
        for key in keys:
            base = baseline_rows.get(key)
            variant = variant_rows.get(key)
            if base is None or variant is None:
                continue
            changed = (
                base.get("MATCH_1_KEYWORD") != variant.get("MATCH_1_KEYWORD")
                or base.get("STATUS") != variant.get("STATUS")
            )
            if not changed:
                continue
            writer.writerow(
                {
                    "REQ_ID": base.get("REQ_ID") or variant.get("REQ_ID"),
                    "FEATURE": base.get("FEATURE") or variant.get("FEATURE"),
                    "REQUIREMENT_TEXT": base.get("REQUIREMENT_TEXT") or variant.get("REQUIREMENT_TEXT"),
                    "BASE_STATUS": base.get("STATUS"),
                    "VARIANT_STATUS": variant.get("STATUS"),
                    "BASE_MATCH_1_KEYWORD": base.get("MATCH_1_KEYWORD"),
                    "VARIANT_MATCH_1_KEYWORD": variant.get("MATCH_1_KEYWORD"),
                    "BASE_MATCH_1_SCORE": base.get("MATCH_1_SCORE"),
                    "VARIANT_MATCH_1_SCORE": variant.get("MATCH_1_SCORE"),
                    "CHANGED": "YES",
                }
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
