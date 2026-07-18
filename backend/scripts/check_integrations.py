import asyncio
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings
from app.integrations.github_client import GitHubClient
from app.integrations.openai_client import OpenAIReasoner
from app.integrations.supabase_client import SupabaseRepository
from app.integrations.tavily_client import TavilyClient


async def check() -> None:
    settings = get_settings()
    print(
        {
            "configured": {
                "openai": bool(settings.openai_api_key),
                "tavily": bool(settings.tavily_api_key),
                "github": bool(settings.github_token),
                "elevenlabs": bool(settings.elevenlabs_api_key),
                "supabase_url": bool(settings.supabase_url),
                "supabase_service": bool(settings.supabase_service_role_key),
            }
        }
    )

    try:
        repos = await GitHubClient(settings).search_repositories("language:Python stars:>10000", 1)
        print({"github": "ok", "results": len(repos)})
    except Exception as exc:
        print({"github": "failed", "error": type(exc).__name__})

    try:
        results = await TavilyClient(settings).search("OpenAI official website", 1)
        print({"tavily": "ok", "results": len(results)})
    except Exception as exc:
        print({"tavily": "failed", "error": type(exc).__name__})

    try:
        response = await OpenAIReasoner(settings).client.responses.create(
            model=settings.openai_model,
            input="Reply with OK only.",
        )
        print({"openai": "ok", "has_output": bool(response.output_text)})
    except Exception as exc:
        print(
            {
                "openai": "failed",
                "error": type(exc).__name__,
                "status": getattr(exc, "status_code", None),
                "code": getattr(exc, "code", None),
            }
        )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/user/subscription",
                headers={"xi-api-key": settings.elevenlabs_api_key or ""},
            )
        print({"elevenlabs": "ok" if response.is_success else "failed", "status_code": response.status_code})
    except Exception as exc:
        print({"elevenlabs": "failed", "error": type(exc).__name__})

    try:
        founders = await SupabaseRepository(settings).list_founders(1)
        print({"supabase": "ok", "founders_read": len(founders)})
    except Exception as exc:
        print({"supabase": "failed", "error": type(exc).__name__})


if __name__ == "__main__":
    asyncio.run(check())
