import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.agents.graph import Pipeline
from app.schemas.founder import ThesisConfig


async def main() -> None:
    result = await Pipeline().run_outbound(
        ThesisConfig(
            sectors=["AI infrastructure"],
            stage="pre-seed",
            geography=["global"],
            risk_appetite="high",
        ),
        "topic:ai language:Python stars:>1000 pushed:>2026-01-01",
        "AI infrastructure founder GitHub product launch",
        1,
    )
    print({"run_id": result["run_id"], "founders": len(result["founders"])})


if __name__ == "__main__":
    asyncio.run(main())
