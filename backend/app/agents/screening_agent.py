from uuid import UUID

from app.integrations.openai_client import OpenAIReasoner
from app.schemas.founder import FounderAssessment, FounderProfile, ThesisConfig
from app.trace import TraceWriter


class ScreeningAgent:
    def __init__(self, reasoner: OpenAIReasoner, trace: TraceWriter):
        self.reasoner = reasoner
        self.trace = trace

    async def screen(self, run_id: UUID, founder: FounderProfile, thesis: ThesisConfig) -> FounderAssessment:
        await self.trace.write(run_id, "screening", "three_axis_scoring", f"Scoring {founder.identity_key} against thesis")
        assessment = await self.reasoner.structured(
            system=(
                "You are a VC screening agent. Score founder, market, and idea_vs_market independently. "
                "Never average the three axes into a single recommendation score. "
                "Every claim must have evidence or be listed as a gap/no_signal. "
                "Use score range 0-100 and trust_score range 0-1."
            ),
            user=str({"founder": founder.model_dump(), "thesis": thesis.model_dump()}),
            schema=FounderAssessment,
        )
        await self.trace.write(run_id, "screening", "scores_ready", f"Produced {len(assessment.scores)} axis scores for {founder.identity_key}", confidence=0.8)
        return assessment
