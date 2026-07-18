from __future__ import annotations

from typing import Optional
from uuid import UUID

from app.integrations.supabase_client import SupabaseRepository


class TraceWriter:
    def __init__(self, repo: SupabaseRepository):
        self.repo = repo

    async def write(
        self,
        run_id: UUID,
        agent: str,
        step: str,
        message: str,
        evidence_ref: Optional[str] = None,
        confidence: Optional[float] = None,
    ) -> None:
        await self.repo.insert_trace_event(
            {
                "run_id": str(run_id),
                "agent": agent,
                "step": step,
                "message": message,
                "evidence_ref": evidence_ref,
                "confidence": confidence,
            }
        )
