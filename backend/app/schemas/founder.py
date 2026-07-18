from __future__ import annotations

from enum import Enum
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Source(str, Enum):
    inbound = "inbound"
    outbound_github = "outbound_github"
    outbound_tavily = "outbound_tavily"
    voice_intake = "voice_intake"


class Trend(str, Enum):
    improving = "improving"
    stable = "stable"
    declining = "declining"


class EvidenceType(str, Enum):
    known_signal = "known_signal"
    statistical_association = "statistical_association"
    no_signal = "no_signal"


class Axis(str, Enum):
    founder = "founder"
    market = "market"
    idea_vs_market = "idea_vs_market"


class ThesisConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sectors: list[str] = Field(default_factory=list)
    stage: Optional[str] = None
    geography: list[str] = Field(default_factory=list)
    check_size_usd: Optional[int] = None
    ownership_target_percent: Optional[float] = None
    risk_appetite: Optional[Literal["low", "medium", "high"]] = None
    notes: Optional[str] = None


class EvidenceItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    claim: str
    source_url: Optional[str] = None
    source_snippet: Optional[str] = None
    trust_score: float = Field(ge=0, le=1)
    evidence_type: EvidenceType


class ScoreItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    axis: Axis
    score: float = Field(ge=0, le=100)
    trend: str
    rationale: str


class RawSignal(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    value: str
    source_url: Optional[str] = None


class FounderProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    identity_key: str
    name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[str] = None
    github_handle: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    sector: Optional[str] = None
    stage: Optional[str] = None
    product_summary: Optional[str] = None
    traction: Optional[str] = None
    funding_status: Optional[str] = None
    gaps: list[str] = Field(default_factory=list)
    raw_signals: list[RawSignal] = Field(default_factory=list)


class FounderRecord(FounderProfile):
    id: UUID
    source: Source
    founder_score: Optional[float] = None
    founder_score_trend: Optional[Trend] = None


class FounderAssessment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    founder: FounderProfile
    evidence: list[EvidenceItem]
    scores: list[ScoreItem]
    founder_score: Optional[float] = Field(default=None, ge=0, le=100)
    founder_score_trend: Optional[Trend] = None


class MemoSection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    bullets: list[str]
    evidence_refs: list[str] = Field(default_factory=list)


class InvestmentMemo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    founder_id: UUID
    company_snapshot: MemoSection
    investment_hypotheses: MemoSection
    swot: MemoSection
    problem_and_product: MemoSection
    traction_and_kpis: MemoSection
    explicit_gaps: list[str]
