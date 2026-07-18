from __future__ import annotations

import json
from typing import Any, Optional, Type

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.errors import IntegrationNotConfigured


class OpenAIReasoner:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        if not self.settings.openai_api_key:
            raise IntegrationNotConfigured("OPENAI_API_KEY", "structured extraction, screening, diligence, and memo generation")
        self.client = AsyncOpenAI(api_key=self.settings.openai_api_key)

    async def structured(self, system: str, user: str, schema: Type[BaseModel]) -> BaseModel:
        response = await self.client.responses.parse(
            model=self.settings.openai_model,
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            text_format=schema,
        )
        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError("OpenAI returned no parsed structured output.")
        return parsed

    async def json_text(self, system: str, user: str) -> dict[str, Any]:
        response = await self.client.responses.create(
            model=self.settings.openai_model,
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            text={"format": {"type": "json_object"}},
        )
        content = response.output_text
        return json.loads(content)
