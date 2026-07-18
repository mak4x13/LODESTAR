from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.api import decision, diligence, founders, screen, source, voice
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="LodeSTAR Backend",
    version="0.1.0",
    description="Backend API for Team VizMinds' VC Brain hackathon project.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(source.router)
app.include_router(screen.router)
app.include_router(diligence.router)
app.include_router(decision.router)
app.include_router(founders.router)
app.include_router(voice.router)


@app.get("/health")
async def health():
    missing = settings.missing_runtime_keys()
    return {
        "status": "ok" if not missing else "setup_required",
        "project": settings.app_name,
        "missing_runtime_keys": missing,
        "github_token": "configured" if settings.github_token else "optional_not_configured",
        "elevenlabs": "configured" if settings.elevenlabs_api_key else "not_configured",
    }


@app.get("/", response_class=HTMLResponse)
async def demo():
    return """
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>LodeSTAR Backend</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; max-width: 860px; }
          code, pre { background: #f4f4f5; border-radius: 6px; padding: 2px 6px; }
          pre { padding: 16px; overflow: auto; }
          a { color: #0f766e; }
        </style>
      </head>
      <body>
        <h1>LodeSTAR Backend</h1>
        <p>This service exposes the live backend API. Data-producing endpoints require real API keys and Supabase setup.</p>
        <p><a href="/docs">Open API docs</a> | <a href="/health">Check setup status</a></p>
        <pre>curl http://localhost:8000/health</pre>
      </body>
    </html>
    """
