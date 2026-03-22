from __future__ import annotations

import json
import os
from pathlib import Path
import ssl
import urllib.error
import urllib.request
from dataclasses import dataclass

try:
    import certifi

    CERTIFI_AVAILABLE = True
except Exception:
    certifi = None
    CERTIFI_AVAILABLE = False


@dataclass
class GeminiConfig:
    """Configuration for Gemini generateContent requests."""

    api_key: str
    model: str = "gemini-2.5-flash"
    base_url: str = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    timeout_seconds: int = 90


class GeminiClient:
    """Minimal Gemini generateContent client using stdlib HTTP."""

    def __init__(self, config: GeminiConfig) -> None:
        if not config.api_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY is required for Gemini calls.")
        self.config = config

    @staticmethod
    def _load_env_file(env_path: Path) -> None:
        if not env_path.exists():
            return
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("\"'").strip()
            if key and key not in os.environ:
                os.environ[key] = value

    @classmethod
    def from_env(cls, default_model: str, env_file: Path | None = None) -> GeminiConfig:
        if env_file is not None:
            cls._load_env_file(env_file)
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            api_key = os.getenv("GOOGLE_API_KEY", "").strip()
        return GeminiConfig(
            api_key=api_key,
            model=default_model,
        )

    def generate_content(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_output_tokens: int = 1200,
    ) -> str:
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            },
        }

        headers = {
            "x-goog-api-key": self.config.api_key,
            "Content-Type": "application/json",
        }

        url = self.config.base_url.format(model=self.config.model)
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        context = None
        if CERTIFI_AVAILABLE and certifi is not None:
            context = ssl.create_default_context(cafile=certifi.where())
        else:
            context = ssl.create_default_context()
        try:
            with urllib.request.urlopen(
                request,
                timeout=self.config.timeout_seconds,
                context=context,
            ) as response:
                response_body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8") if exc.fp else ""
            raise RuntimeError(
                f"Gemini API error {exc.code}: {error_body or exc.reason}"
            ) from exc

        parsed = json.loads(response_body)
        candidates = parsed.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini response contained no candidates.")
        content = candidates[0].get("content", {})
        parts = content.get("parts", [])
        if not parts:
            raise RuntimeError("Gemini response contained empty content parts.")
        text = parts[0].get("text", "")
        if not text:
            raise RuntimeError("Gemini response contained empty text.")
        return text
