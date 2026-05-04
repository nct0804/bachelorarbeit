#!/usr/bin/env python3
"""Export keyword and locator inventory for Robot Framework resources.

This script scans the project resource tree and writes CSV reports for:

1. Robot Framework keywords found in each `.resource` file
2. Locator entries found in each `__Locators.json` file

Outputs:
- `resource_keyword_details.csv`
- `resource_keyword_summary.csv`
- `locator_entry_details.csv`
- `locator_file_summary.csv`
- `inventory_totals.csv`
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class KeywordRecord:
    """Single Robot Framework keyword definition."""

    resource_file: str
    keyword_name: str
    line_number: int


@dataclass
class LocatorRecord:
    """Single locator or locator-alias entry from __Locators.json."""

    locator_file: str
    entry_type: str
    category: str
    entry_name: str
    json_path: str
    selector_or_value: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export keyword and locator inventory from Resource files.",
    )
    parser.add_argument(
        "--resource-root",
        default="Resource",
        help="Root directory containing .resource files and __Locators.json files.",
    )
    parser.add_argument(
        "--output-dir",
        default="Results/resource-inventory",
        help="Directory where CSV reports will be written.",
    )
    return parser.parse_args()


def collect_resource_keywords(resource_root: Path) -> list[KeywordRecord]:
    records: list[KeywordRecord] = []

    for resource_file in sorted(resource_root.rglob("*.resource")):
        lines = resource_file.read_text(encoding="utf-8").splitlines()
        in_keywords_section = False

        for line_number, raw_line in enumerate(lines, start=1):
            line = raw_line.rstrip("\n")
            stripped = line.strip()

            if stripped.startswith("***"):
                in_keywords_section = stripped.lower() == "*** keywords ***"
                continue

            if not in_keywords_section or not stripped:
                continue
            if line.startswith("#"):
                continue

            is_keyword_header = not line.startswith((" ", "\t"))
            if not is_keyword_header:
                continue

            records.append(
                KeywordRecord(
                    resource_file=str(resource_file),
                    keyword_name=stripped,
                    line_number=line_number,
                )
            )

    return records


def _stringify_value(value: Any) -> str:
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=True)


def collect_locator_entries(resource_root: Path) -> list[LocatorRecord]:
    records: list[LocatorRecord] = []

    for locator_file in sorted(resource_root.rglob("__Locators.json")):
        content = json.loads(locator_file.read_text(encoding="utf-8"))
        if not isinstance(content, dict):
            continue

        for key, value in content.items():
            if key == "meta":
                continue

            if key == "root":
                records.append(
                    LocatorRecord(
                        locator_file=str(locator_file),
                        entry_type="root",
                        category="root",
                        entry_name="root",
                        json_path="root",
                        selector_or_value=_stringify_value(value),
                    )
                )
                continue

            if key == "page" and isinstance(value, list):
                for index, alias in enumerate(value):
                    records.append(
                        LocatorRecord(
                            locator_file=str(locator_file),
                            entry_type="page_alias",
                            category="page",
                            entry_name=str(alias),
                            json_path=f"page[{index}]",
                            selector_or_value=str(alias),
                        )
                    )
                continue

            if isinstance(value, dict):
                for entry_name, selector in value.items():
                    records.append(
                        LocatorRecord(
                            locator_file=str(locator_file),
                            entry_type="locator",
                            category=key,
                            entry_name=str(entry_name),
                            json_path=f"{key}.{entry_name}",
                            selector_or_value=_stringify_value(selector),
                        )
                    )
                continue

            records.append(
                LocatorRecord(
                    locator_file=str(locator_file),
                    entry_type="value",
                    category=key,
                    entry_name=key,
                    json_path=key,
                    selector_or_value=_stringify_value(value),
                )
            )

    return records


def write_csv(output_path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def build_keyword_detail_rows(records: list[KeywordRecord]) -> list[dict[str, Any]]:
    return [
        {
            "RESOURCE_FILE": record.resource_file,
            "KEYWORD_NAME": record.keyword_name,
            "LINE_NUMBER": record.line_number,
            "LOCATION": f"{record.resource_file}:{record.line_number}",
        }
        for record in records
    ]


def build_keyword_summary_rows(records: list[KeywordRecord]) -> list[dict[str, Any]]:
    counts_by_file: dict[str, int] = {}
    for record in records:
        counts_by_file[record.resource_file] = counts_by_file.get(record.resource_file, 0) + 1

    return [
        {
            "RESOURCE_FILE": resource_file,
            "KEYWORD_COUNT": keyword_count,
        }
        for resource_file, keyword_count in sorted(counts_by_file.items())
    ]


def build_locator_detail_rows(records: list[LocatorRecord]) -> list[dict[str, Any]]:
    return [
        {
            "LOCATOR_FILE": record.locator_file,
            "ENTRY_TYPE": record.entry_type,
            "CATEGORY": record.category,
            "ENTRY_NAME": record.entry_name,
            "JSON_PATH": record.json_path,
            "SELECTOR_OR_VALUE": record.selector_or_value,
            "LOCATION": f"{record.locator_file}::{record.json_path}",
        }
        for record in records
    ]


def build_locator_summary_rows(records: list[LocatorRecord]) -> list[dict[str, Any]]:
    counts_by_file: dict[str, dict[str, int]] = {}
    for record in records:
        current = counts_by_file.setdefault(
            record.locator_file,
            {
                "TOTAL_ENTRIES": 0,
                "ROOT_COUNT": 0,
                "PAGE_ALIAS_COUNT": 0,
                "LOCATOR_COUNT": 0,
                "VALUE_COUNT": 0,
            },
        )
        current["TOTAL_ENTRIES"] += 1
        if record.entry_type == "root":
            current["ROOT_COUNT"] += 1
        elif record.entry_type == "page_alias":
            current["PAGE_ALIAS_COUNT"] += 1
        elif record.entry_type == "locator":
            current["LOCATOR_COUNT"] += 1
        else:
            current["VALUE_COUNT"] += 1

    return [
        {
            "LOCATOR_FILE": locator_file,
            **counts,
        }
        for locator_file, counts in sorted(counts_by_file.items())
    ]


def build_totals_rows(
    resource_files: set[str],
    locator_files: set[str],
    keyword_records: list[KeywordRecord],
    locator_records: list[LocatorRecord],
) -> list[dict[str, Any]]:
    return [
        {
            "ITEM_TYPE": "resource_keywords",
            "TOTAL_FILES": len(resource_files),
            "TOTAL_ITEMS": len(keyword_records),
        },
        {
            "ITEM_TYPE": "locator_entries",
            "TOTAL_FILES": len(locator_files),
            "TOTAL_ITEMS": len(locator_records),
        },
    ]


def main() -> int:
    args = parse_args()
    resource_root = Path(args.resource_root)
    output_dir = Path(args.output_dir)

    if not resource_root.exists():
        raise SystemExit(f"Resource root not found: {resource_root}")

    keyword_records = collect_resource_keywords(resource_root)
    locator_records = collect_locator_entries(resource_root)

    resource_files = {record.resource_file for record in keyword_records}
    locator_files = {record.locator_file for record in locator_records}

    write_csv(
        output_dir / "resource_keyword_details.csv",
        ["RESOURCE_FILE", "KEYWORD_NAME", "LINE_NUMBER", "LOCATION"],
        build_keyword_detail_rows(keyword_records),
    )
    write_csv(
        output_dir / "resource_keyword_summary.csv",
        ["RESOURCE_FILE", "KEYWORD_COUNT"],
        build_keyword_summary_rows(keyword_records),
    )
    write_csv(
        output_dir / "locator_entry_details.csv",
        [
            "LOCATOR_FILE",
            "ENTRY_TYPE",
            "CATEGORY",
            "ENTRY_NAME",
            "JSON_PATH",
            "SELECTOR_OR_VALUE",
            "LOCATION",
        ],
        build_locator_detail_rows(locator_records),
    )
    write_csv(
        output_dir / "locator_file_summary.csv",
        [
            "LOCATOR_FILE",
            "TOTAL_ENTRIES",
            "ROOT_COUNT",
            "PAGE_ALIAS_COUNT",
            "LOCATOR_COUNT",
            "VALUE_COUNT",
        ],
        build_locator_summary_rows(locator_records),
    )
    write_csv(
        output_dir / "inventory_totals.csv",
        ["ITEM_TYPE", "TOTAL_FILES", "TOTAL_ITEMS"],
        build_totals_rows(resource_files, locator_files, keyword_records, locator_records),
    )

    print(f"Resource keyword details: {output_dir / 'resource_keyword_details.csv'}")
    print(f"Resource keyword summary: {output_dir / 'resource_keyword_summary.csv'}")
    print(f"Locator entry details: {output_dir / 'locator_entry_details.csv'}")
    print(f"Locator file summary: {output_dir / 'locator_file_summary.csv'}")
    print(f"Inventory totals: {output_dir / 'inventory_totals.csv'}")
    print(f"Total resource keywords: {len(keyword_records)}")
    print(f"Total locator entries: {len(locator_records)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
