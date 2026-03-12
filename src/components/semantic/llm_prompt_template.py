"""Prompt templates for LLM Gherkin test case generation.

Edit this file to adjust the system and user prompts sent to the LLM.
The generator imports build_system_prompt() and build_user_prompt() from here.
"""

from __future__ import annotations


def build_system_prompt() -> str:
    """System prompt that instructs the LLM on scenario composition rules."""
    return (
        "You are a Robot Framework Gherkin test case generator.\n"
        "You receive a natural-language requirement and a keyword catalog.\n"
        "Your job is to compose a COMPLETE executable Gherkin scenario that tests the requirement.\n"
        "\n"
        "## Scenario composition rules\n"
        "\n"
        "A complete scenario follows this structure:\n"
        "1. **Given** — Setup: open browser, navigate to the relevant page.\n"
        "2. **When / And** — Action: perform the user actions described in the requirement "
        "(fill forms, click buttons, sign in, etc.).\n"
        "3. **Then / And** — Assertion: validate the expected outcome "
        "(page opened, notification visible, error message shown, etc.).\n"
        "\n"
        "Every scenario MUST have at least 3 steps (setup, action, assertion).\n"
        "Most scenarios should have 4-8 steps.\n"
        "\n"
        "## Keyword usage rules\n"
        "\n"
        "- You may use ANY keyword from the FULL KEYWORD CATALOG provided.\n"
        "- The MOST RELEVANT KEYWORDS are highlighted — prefer them for the core action.\n"
        "- For setup/teardown, use infrastructure keywords from the catalog "
        "(e.g. Open Browser Session, Navigate To Page, Validate Page Is Opened).\n"
        "- NEVER invent a keyword name that is not in the catalog.\n"
        "- If no keyword in the catalog can satisfy the requirement, "
        "set `steps` to an empty list and provide a `new_keyword_recommendation`.\n"
        "- Use concrete argument values extracted from the requirement text when available.\n"
        "- When a keyword has a default argument value (shown as `name=default`), "
        "you may omit that argument or provide a specific value.\n"
        "\n"
        "## Output format\n"
        "\n"
        "Return ONLY a JSON object with this schema:\n"
        "```\n"
        "{\n"
        '  "feature_name": "string — short descriptive feature title",\n'
        '  "scenario_name": "string — concise scenario title",\n'
        '  "tags": ["generated", "<requirement_type>"],\n'
        '  "steps": [\n'
        '    {"clause": "Given|When|Then|And|But", "keyword": "<exact catalog keyword name>", '
        '"args": ["arg1", "arg2"]}\n'
        "  ],\n"
        '  "new_keyword_recommendation": null | {"keyword_name": "...", "reason": "..."}\n'
        "}\n"
        "```\n"
        "\n"
        "Do NOT include markdown fences, explanations, or any text outside the JSON object.\n"
    )


def build_user_prompt(entry: dict) -> str:
    """User prompt built from a payload entry.

    Args:
        entry: a single entry from llm_generation_payload.json containing
               requirement text, keyword context, and the full catalog.
    """
    # --- Most relevant keywords (top-k from semantic mapping) ---
    relevant_lines: list[str] = []
    for index, item in enumerate(entry.get("keyword_context", []), start=1):
        args = item.get("arguments", "")
        doc = item.get("documentation", "")
        relevant_lines.append(f"  {index}. {item.get('keyword_name', '')}  |  args: {args}  |  {doc}")
    relevant_block = "\n".join(relevant_lines) if relevant_lines else "  (none)"

    # --- Full keyword catalog ---
    catalog_lines: list[str] = []
    for item in entry.get("full_keyword_catalog", []):
        name = item.get("keyword_name", "")
        args = item.get("arguments", "")
        doc = item.get("documentation", "")
        catalog_lines.append(f"  - {name}  |  args: {args}  |  {doc}")
    catalog_block = "\n".join(catalog_lines) if catalog_lines else "  (none)"

    # --- Requirement information ---
    req_id = entry.get("req_id", "")
    req_type = entry.get("requirement_type", "general_requirement")
    req_text = entry.get("requirement_text", "")
    allow_recommend = entry.get("allow_new_keyword_recommendation", False)

    return (
        f"REQ_ID: {req_id}\n"
        f"Requirement Type: {req_type}\n"
        f"Requirement Text: {req_text}\n"
        f"\n"
        f"MOST RELEVANT KEYWORDS (prefer these for core actions):\n"
        f"{relevant_block}\n"
        f"\n"
        f"FULL KEYWORD CATALOG (use any of these to compose a complete scenario):\n"
        f"{catalog_block}\n"
        f"\n"
        f"Allow New Keyword Recommendation: {allow_recommend}\n"
        f"\n"
        f"Generate a complete executable Gherkin scenario now.\n"
    )
