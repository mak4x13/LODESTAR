from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.agents.graph import Pipeline
from app.errors import IntegrationNotConfigured, configuration_error
from app.schemas.founder import FounderProfile, Source
from app.schemas.requests import ScreenRequest

router = APIRouter(prefix="/api/screen", tags=["screen"])


@router.post("")
async def screen_founder(request: ScreenRequest):
    try:
        pipeline = Pipeline()
        founder = await pipeline.repo.get_founder(request.founder_id)
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        profile = FounderProfile(**founder["profile"])
        run_id = uuid4()
        assessment = await pipeline.screening.screen(run_id, profile, request.thesis)
        reviewed = await pipeline.diligence.verify(run_id, assessment, request.thesis)
        persisted = await pipeline.persist_assessment(reviewed, Source(founder["source"]))
        return {"run_id": str(run_id), "founder": persisted}
    except IntegrationNotConfigured as exc:
        raise configuration_error(exc) from exc
