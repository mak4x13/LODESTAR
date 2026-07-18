# LodeSTAR

Backend-first build for Team VizMinds' Maschmeyer Group "VC Brain" submission at Hack-Nation's 6th Global AI Hackathon.

The current implementation focuses on the FastAPI backend, live-data integrations, Supabase persistence, and trace-event feed contract. The frontend team can consume this API and subscribe to Supabase Realtime on `trace_events`.

## Current Scope

- FastAPI backend in `backend/`
- Supabase schema in `docs/data-model.sql`
- Real integration clients for GitHub, Tavily, OpenAI, Supabase, and ElevenLabs status
- Agent pipeline stages for sourcing, screening, diligence, and memo generation
- Trace events written to Supabase for live reasoning feed support
- Minimal backend landing page at `/` and OpenAPI docs at `/docs`

No running endpoint returns fake founder, score, evidence, or memo data. If credentials or external setup are missing, the API returns `503` with the exact missing key.

## Backend Architecture

```text
backend/app/
  main.py                 FastAPI app, CORS, health, docs, minimal demo page
  api/                    REST routes
  agents/                 Sourcing, screening, diligence, memo, pipeline orchestration
  integrations/           GitHub, Tavily, OpenAI, ElevenLabs, Supabase clients
  schemas/                Pydantic request and domain models
  trace.py                Structured writes to Supabase trace_events
```

Pipeline order:

1. Sourcing normalizes inbound text, voice transcript text, GitHub repos, and Tavily web results into the shared founder schema.
2. Screening scores founder, market, and idea-vs-market independently.
3. Diligence reviews evidence trust scores, contradictions, and explicit gaps.
4. Persistence writes founders, evidence, scores, and trace events to Supabase.
5. Decision generates the required investment memo sections from persisted evidence and scores.

## Required External Setup

### 1. Supabase

Manual steps for the team:

1. Create or open a Supabase project.
2. Open the SQL editor.
3. Run `docs/data-model.sql`.
4. Go to Database -> Replication.
5. Enable Realtime for `public.trace_events`.
6. Enable Realtime for `public.founders`.
7. Copy the project URL into `SUPABASE_URL`.
8. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.

Use the service role key only on the backend. Do not expose it in frontend code.

### 2. Runtime API Keys

Backend `.env` needs:

```env
OPENAI_API_KEY=
TAVILY_API_KEY=
GITHUB_TOKEN=
ELEVENLABS_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_ORIGIN=http://localhost:5173
OPENAI_MODEL=gpt-4.1
```

`GITHUB_TOKEN` is optional but recommended because it raises GitHub API limits from unauthenticated hackathon volume to token-authenticated limits.

`ELEVENLABS_API_KEY` is only required for live voice integration. The current backend supports transcript ingestion at `/api/voice/transcript`; wiring an ElevenLabs Conversational AI webhook also requires the team to create an ElevenLabs agent and provide its webhook configuration details.

## Local Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Then open:

- `http://localhost:8000/`
- `http://localhost:8000/health`
- `http://localhost:8000/docs`

## API Overview

- `GET /health` returns setup readiness and missing keys.
- `POST /api/source/outbound` runs GitHub plus Tavily sourcing, screening, diligence, and persistence.
- `POST /api/source/inbound` parses a real founder application text and sends it through the shared pipeline.
- `POST /api/voice/transcript` parses a real voice transcript and sends it through the shared pipeline.
- `POST /api/screen` reruns three-axis screening for an existing founder.
- `POST /api/diligence` reruns trust review for an existing founder.
- `POST /api/decision` creates an evidence-backed investment memo for an existing founder.
- `GET /api/founders` lists persisted founders.
- `GET /api/founders/{founder_id}` returns founder profile, evidence, and scores.

## Example Outbound Request

This requires live `OPENAI_API_KEY`, `TAVILY_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

```bash
curl -X POST http://localhost:8000/api/source/outbound ^
  -H "Content-Type: application/json" ^
  -d "{\"thesis\":{\"sectors\":[\"AI infrastructure\"],\"stage\":\"pre-seed\",\"geography\":[\"Europe\"],\"risk_appetite\":\"high\"},\"github_query\":\"AI infrastructure language:Python pushed:>2026-06-01\",\"tavily_query\":\"AI infrastructure hackathon founder Europe pre-seed\",\"limit\":3}"
```

## Vercel Backend Deployment

Do not deploy until the team asks for it. When ready:

1. In Vercel, import `mak4x13/LODESTAR`.
2. Create a project for the backend.
3. Set root directory to `backend/`.
4. Set framework preset to `Other`.
5. Add all backend environment variables from `.env`.
6. Keep `backend/vercel.json`; it routes `app/main.py` through the Python runtime and sets `maxDuration` to 60 seconds.
7. Deploy.
8. Confirm `https://<backend-domain>/health` reports `"status": "ok"`.

## Frontend Integration Notes

The frontend should subscribe to Supabase Realtime on:

- `public.trace_events` filtered by `run_id`
- `public.founders` for founder score updates

The frontend should use the Supabase anon key, not the service role key.
