from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.agents.graph import Pipeline
from app.errors import IntegrationNotConfigured, configuration_error
from app.schemas.requests import DecisionRequest

router = APIRouter(prefix="/api/decision", tags=["decision"])


@router.post("")
async def decision_memo(request: DecisionRequest):
    try:
        pipeline = Pipeline()
        founder = await pipeline.repo.get_founder(request.founder_id)
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        evidence = await pipeline.repo.get_evidence(request.founder_id)
        scores = await pipeline.repo.get_scores(request.founder_id)
        run_id = uuid4()
        memo = await pipeline.memo.write_memo(run_id, request.founder_id, founder, evidence, scores, request.thesis)
        return {"run_id": str(run_id), "memo": memo}
    except IntegrationNotConfigured as exc:
        raise configuration_error(exc) from exc
