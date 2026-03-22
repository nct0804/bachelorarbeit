from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class RagRequirement:
    """Normalized requirement entry for RAG processing."""

    req_id: str
    feature: str
    requirement_text: str
    mapping_text: str
    requirement_type: str
    nlp_actions: List[str] = field(default_factory=list)


@dataclass
class RetrievedKeyword:
    """Hybrid retrieval result for one keyword."""

    keyword_name: str
    tag_type: str
    module: str
    source_file: str
    documentation: str
    arguments: str
    final_score: float
    semantic_score: float
    lexical_score: float
    element_boost: float
    disambiguation_penalty: float


@dataclass
class ExampleSnippet:
    """Few-shot example pairing a requirement style with robot output."""

    feature_name: str
    feature_steps: str
    robot_steps: str


@dataclass
class RagContext:
    """Context bundle passed into prompt generation."""

    requirement: RagRequirement
    retrieved_keywords: List[RetrievedKeyword]
    examples: List[ExampleSnippet]


@dataclass
class GenerationResult:
    """Output artifacts for one requirement."""

    requirement: RagRequirement
    prompt: str
    robot_content: str
    resource_content: str
    selected_keywords: List[RetrievedKeyword]
