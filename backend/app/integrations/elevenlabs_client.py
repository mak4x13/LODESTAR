from __future__ import annotations

from typing import Optional

from app.config import Settings, get_settings
from app.errors import IntegrationNotConfigured


class ElevenLabsClient:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        if not self.settings.elevenlabs_api_key:
            raise IntegrationNotConfigured("ELEVENLABS_API_KEY", "voice intake and audio memo briefing")

    async def setup_status(self) -> dict[str, str]:
        return {
            "status": "connected",
            "note": "Transcript ingestion is implemented locally; live Conversational AI webhook wiring requires an ElevenLabs agent ID from the team.",
        }
