from __future__ import annotations

from typing import Optional
from uuid import UUID

from app.integrations.github_client import GitHubClient
from app.integrations.openai_client import OpenAIReasoner
from app.integrations.tavily_client import TavilyClient
from app.schemas.founder import FounderProfile, ThesisConfig
from app.trace import TraceWriter


class SourcingAgent:
    def __init__(
        self,
        github: GitHubClient,
        tavily: TavilyClient,
        reasoner: OpenAIReasoner,
        trace: TraceWriter,
    ):
        self.github = github
        self.tavily = tavily
        self.reasoner = reasoner
        self.trace = trace

    async def outbound(self, run_id: UUID, thesis: ThesisConfig, github_query: str, tavily_query: Optional[str], limit: int) -> list[FounderProfile]:
        await self.trace.write(run_id, "sourcing", "github_search", f"Searching GitHub repositories for: {github_query}")
        repos = await self.github.search_repositories(github_query, limit)

        web_results = []
        if tavily_query:
            await self.trace.write(run_id, "sourcing", "tavily_search", f"Searching open web for: {tavily_query}")
            web_results = await self.tavily.search(tavily_query, limit)

        profiles: list[FounderProfile] = []
        for repo in repos:
            owner = repo.get("owner", {})
            login = owner.get("login")
            user = await self.github.get_user(login) if login else {}
            prompt = {
                "thesis": thesis.model_dump(),
                "github_repository": repo,
                "github_user": user,
                "web_results": web_results,
            }
            parsed = await self.reasoner.structured(
                system=(
                    "Extract a founder candidate from real API evidence only. "
                    "Use identity_key as github:<handle> when a handle exists. "
                    "List unavailable fields in gaps. Do not invent facts."
                ),
                user=str(prompt),
                schema=FounderProfile,
            )
            profiles.append(parsed)
            await self.trace.write(
                run_id,
                "sourcing",
                "candidate_extracted",
                f"Extracted candidate {parsed.identity_key}",
                confidence=0.75,
            )
        return profiles

    async def inbound_from_text(self, run_id: UUID, text: str, company_name: str, founder_name: Optional[str], email: Optional[str], github_handle: Optional[str], website: Optional[str]) -> FounderProfile:
        await self.trace.write(run_id, "sourcing", "inbound_parse", f"Parsing inbound application for {company_name}")
        identity_hint = github_handle or email
        parsed = await self.reasoner.structured(
            system=(
                "Normalize an inbound founder application into the shared founder schema. "
                "Use only facts present in the submitted text and provided fields. "
                "Use identity_key as github:<handle> or email:<email>. If neither exists, fail by placing a gap and use company:<company_name>. "
                "Do not fabricate traction, funding, market, or team details."
            ),
            user=str(
                {
                    "company_name": company_name,
                    "founder_name": founder_name,
                    "email": email,
                    "github_handle": github_handle,
                    "website": website,
                    "identity_hint": identity_hint,
                    "application_text": text,
                }
            ),
            schema=FounderProfile,
        )
        return parsed
