from uuid import uuid4

from fastapi import APIRouter

from app.agents.graph import Pipeline
from app.errors import IntegrationNotConfigured, configuration_error
from app.schemas.founder import Source
from app.schemas.requests import InboundApplyRequest, OutboundSourceRequest

router = APIRouter(prefix="/api/source", tags=["source"])


@router.post("/outbound")
async def outbound_source(request: OutboundSourceRequest):
    try:
        pipeline = Pipeline()
        return await pipeline.run_outbound(
            thesis=request.thesis,
            github_query=request.github_query,
            tavily_query=request.tavily_query,
            limit=request.limit,
        )
    except IntegrationNotConfigured as exc:
        raise configuration_error(exc) from exc


@router.post("/inbound")
async def inbound_apply(request: InboundApplyRequest):
    try:
        pipeline = Pipeline()
        run_id = uuid4()
        profile = await pipeline.sourcing.inbound_from_text(
            run_id=run_id,
            text=request.application_text,
            company_name=request.company_name,
            founder_name=request.founder_name,
            email=request.email,
            github_handle=request.github_handle,
            website=request.website,
        )
        return await pipeline.run_inbound(profile, request.thesis, Source.inbound, run_id)
    except IntegrationNotConfigured as exc:
        raise configuration_error(exc) from exc
