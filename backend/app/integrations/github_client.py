from __future__ import annotations

from typing import Any, Optional

import httpx

from app.config import Settings, get_settings


class GitHubClient:
    base_url = "https://api.github.com"

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()

    async def search_repositories(self, query: str, limit: int) -> list[dict[str, Any]]:
        headers = {"Accept": "application/vnd.github+json"}
        if self.settings.github_token:
            headers["Authorization"] = f"Bearer {self.settings.github_token}"
        params = {
            "q": query,
            "sort": "updated",
            "order": "desc",
            "per_page": min(limit, 10),
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f"{self.base_url}/search/repositories", headers=headers, params=params)
            response.raise_for_status()
            return response.json().get("items", [])

    async def get_user(self, login: str) -> dict[str, Any]:
        headers = {"Accept": "application/vnd.github+json"}
        if self.settings.github_token:
            headers["Authorization"] = f"Bearer {self.settings.github_token}"
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f"{self.base_url}/users/{login}", headers=headers)
            response.raise_for_status()
            return response.json()
