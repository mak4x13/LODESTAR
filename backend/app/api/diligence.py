from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.agents.graph import Pipeline
from app.errors import IntegrationNotConfigured, configuration_error
from app.schemas.founder import FounderAssessment, FounderProfile, Source
from app.schemas.requests import DiligenceRequest

router = APIRouter(prefix="/api/diligence", tags=["diligence"])


@router.post("")
async def diligence_founder(request: DiligenceRequest):
    try:
        pipeline = Pipeline()
        founder = await pipeline.repo.get_founder(request.founder_id)
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        scores = await pipeline.repo.get_scores(request.founder_id)
        evidence = await pipeline.repo.get_evidence(request.founder_id)
        assessment = FounderAssessment(
            founder=FounderProfile(**founder["profile"]),
            evidence=evidence,
            scores=scores,
            founder_score=founder.get("founder_score"),
            founder_score_trend=founder.get("founder_score_trend"),
        )
        run_id = uuid4()
        reviewed = await pipeline.diligence.verify(run_id, assessment, request.thesis)
        persisted = await pipeline.persist_assessment(reviewed, Source(founder["source"]))
        return {"run_id": str(run_id), "founder": persisted}
    except IntegrationNotConfigured as exc:
        raise configuration_error(exc) from exc
