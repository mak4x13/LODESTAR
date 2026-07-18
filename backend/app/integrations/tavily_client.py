from __future__ import annotations

from typing import Any, Optional

import httpx

from app.config import Settings, get_settings
from app.errors import IntegrationNotConfigured


class TavilyClient:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        if not self.settings.tavily_api_key:
            raise IntegrationNotConfigured("TAVILY_API_KEY", "open-web sourcing and market/context evidence")

    async def search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        payload = {
            "api_key": self.settings.tavily_api_key,
            "query": query,
            "search_depth": "advanced",
            "max_results": min(limit, 10),
            "include_answer": False,
            "include_raw_content": False,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post("https://api.tavily.com/search", json=payload)
            response.raise_for_status()
            return response.json().get("results", [])
