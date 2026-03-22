from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List, Tuple

from src.components.rag.models import GenerationResult, RagRequirement, RetrievedKeyword


QUOTED_VALUE_PATTERN = re.compile(r"['\"]([^'\"]+)['\"]")
NON_ALNUM_PATTERN = re.compile(r"[^A-Za-z0-9 ]+")


@dataclass
class GeneratorConfig:
    """Configuration for template-based Robot generation."""

    max_steps: int = 1
    include_teardown: bool = True


class RobotTestGenerator:
    """Template generator that produces executable Robot Framework artifacts."""

    def __init__(self, config: GeneratorConfig) -> None:
        self.config = config

    def generate(
        self,
        requirement: RagRequirement,
        retrieved_keywords: List[RetrievedKeyword],
        prompt: str,
        resource_name: str,
        llm_output: str | None = None,
    ) -> GenerationResult:
        selected_keywords = retrieved_keywords[: self.config.max_steps]
        if llm_output:
            parsed = self._parse_llm_output(llm_output)
        else:
            parsed = None

        if parsed is not None:
            robot_content, resource_content = parsed
        else:
            robot_content = self._build_robot_file(requirement, selected_keywords, resource_name)
            resource_content = self._build_resource_file(requirement, selected_keywords)
        return GenerationResult(
            requirement=requirement,
            prompt=prompt,
            robot_content=robot_content,
            resource_content=resource_content,
            selected_keywords=selected_keywords,
        )

    def _build_robot_file(
        self,
        requirement: RagRequirement,
        keywords: List[RetrievedKeyword],
        resource_name: str,
    ) -> str:
        lines: list[str] = []
        lines.append("*** Settings ***")
        lines.append(
            f"Documentation    Auto-generated executable tests for requirements '{requirement.feature}'."
        )
        lines.append(f"Resource    ./{resource_name}.resource")
        lines.append("")
        lines.append("*** Test Cases ***")

        test_case_name = self._build_title(requirement.requirement_text)
        lines.append(f"{requirement.req_id} - {test_case_name}")
        lines.append(f"    [Documentation]    Generated from requirement: {requirement.requirement_text}")
        if self.config.include_teardown:
            lines.append("    [Teardown]    Close Browser Session")
        for index, keyword in enumerate(keywords, start=1):
            step_name = self._build_step_keyword_name(index, keyword.keyword_name, requirement.requirement_text)
            lines.append(f"    {step_name}")

        return "\n".join(lines) + "\n"

    def _build_resource_file(
        self,
        requirement: RagRequirement,
        keywords: List[RetrievedKeyword],
    ) -> str:
        lines: list[str] = []
        lines.append("*** Settings ***")
        lines.append(
            f"Documentation    Auto-generated resource for requirements '{requirement.feature}'."
        )
        lines.append("Resource    ../Resource/MainLib.resource")
        lines.append("")

        variables, keyword_blocks = self._build_keyword_blocks(requirement, keywords)

        if variables:
            lines.append("*** Variables ***")
            for name, value in variables.items():
                lines.append(f"{name}    {value}")
            lines.append("")

        lines.append("*** Keywords ***")
        for keyword_block in keyword_blocks:
            lines.extend(keyword_block)
            lines.append("")

        if lines and not lines[-1].strip():
            lines.pop()
        return "\n".join(lines) + "\n"

    def _build_keyword_blocks(
        self,
        requirement: RagRequirement,
        keywords: List[RetrievedKeyword],
    ) -> Tuple[Dict[str, str], List[List[str]]]:
        variables: Dict[str, str] = {}
        blocks: List[List[str]] = []
        quoted_values = self._extract_quoted_values(requirement.requirement_text)

        for index, keyword in enumerate(keywords, start=1):
            step_name = self._build_step_keyword_name(index, keyword.keyword_name, requirement.requirement_text)
            block: List[str] = []
            block.append(step_name)
            block.append(
                f"    [Documentation]    Execute requirement: {requirement.requirement_text}"
            )

            arg_tokens = self._parse_arguments(keyword.arguments)
            arg_values = []
            for arg in arg_tokens:
                if self._is_variable(arg):
                    value = quoted_values.pop(0) if quoted_values else "TODO"
                    variables[arg] = value
                    arg_values.append(arg)
                else:
                    value = quoted_values.pop(0) if quoted_values else "TODO"
                    arg_values.append(self._quote_if_needed(value))

            keyword_line = keyword.keyword_name
            if arg_values:
                keyword_line = f"{keyword_line}    " + "    ".join(arg_values)
            block.append(f"    {keyword_line}")
            blocks.append(block)

        return variables, blocks

    def _extract_quoted_values(self, text: str) -> List[str]:
        return [match.strip() for match in QUOTED_VALUE_PATTERN.findall(text)]

    def _parse_arguments(self, arguments: str) -> List[str]:
        if not arguments:
            return []
        parts = [part.strip() for part in re.split(r"\s{2,}", arguments) if part.strip()]
        return parts

    def _is_variable(self, token: str) -> bool:
        return bool(re.match(r"^\$\{[^}]+\}$", token))

    def _quote_if_needed(self, value: str) -> str:
        if not value:
            return "''"
        if re.search(r"\s", value):
            if "'" in value and '"' not in value:
                return f"\"{value}\""
            return f"'{value}'"
        return value

    def _build_step_keyword_name(self, index: int, keyword_name: str, requirement_text: str) -> str:
        base = keyword_name or requirement_text
        title = self._build_title(base)
        return f"{index:02d}: {title}"

    def _build_title(self, text: str, max_words: int = 6) -> str:
        cleaned = NON_ALNUM_PATTERN.sub(" ", text)
        words = [word for word in cleaned.split() if word]
        if not words:
            return "Generated Step"
        selected = words[:max_words]
        return " ".join(word.capitalize() for word in selected)

    def _parse_llm_output(self, output: str) -> tuple[str, str] | None:
        robot_match = re.search(r"\[ROBOT\](.*?)(\[/ROBOT\]|$)", output, re.DOTALL | re.IGNORECASE)
        resource_match = re.search(r"\[RESOURCE\](.*?)(\[/RESOURCE\]|$)", output, re.DOTALL | re.IGNORECASE)
        
        # Accept partial matches (without closing tags)
        if robot_match:
            robot_content = robot_match.group(1).strip() + "\n"
        else:
            return None
            
        if resource_match:
            resource_content = resource_match.group(1).strip() + "\n"
        else:
            # Generate resource from robot content
            resource_content = self._infer_resource_from_robot(robot_content)
        
        return robot_content, resource_content
