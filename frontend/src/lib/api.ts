import type { FounderRow, InvestmentMemo, ThesisConfig } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Cannot reach the local API. Confirm FastAPI is running on port 8000.");
  }

  if (!response.ok) {
    const raw = await response.text();
    const payload = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
    const detail = payload?.detail;
    const message = typeof detail === "string"
      ? detail
      : detail?.message || detail?.why || (response.status === 503 ? "A required data provider is temporarily unavailable." : `Request failed (${response.status})`);
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; project: string }>("/health"),
  listFounders: (limit = 50) => request<{ founders: FounderRow[] }>(`/api/founders?limit=${limit}`),
  getFounder: (id: string) => request<{ founder: FounderRow; evidence: unknown[]; scores: unknown[] }>(`/api/founders/${id}`),
  sourceOutbound: (payload: { thesis: ThesisConfig; github_query: string; tavily_query?: string; limit: number }) =>
    request<{ run_id: string; founders: FounderRow[] }>("/api/source/outbound", { method: "POST", body: JSON.stringify(payload) }),
  applyInbound: (payload: Record<string, unknown>) =>
    request<{ run_id: string; founder: FounderRow }>("/api/source/inbound", { method: "POST", body: JSON.stringify(payload) }),
  submitTranscript: (payload: { transcript: string; thesis: ThesisConfig }) =>
    request<{ run_id: string; founder: FounderRow }>("/api/voice/transcript", { method: "POST", body: JSON.stringify(payload) }),
  screen: (founderId: string, thesis: ThesisConfig) =>
    request<{ run_id: string; founder: FounderRow }>("/api/screen", { method: "POST", body: JSON.stringify({ founder_id: founderId, thesis }) }),
  diligence: (founderId: string, thesis: ThesisConfig) =>
    request<{ run_id: string; founder: FounderRow }>("/api/diligence", { method: "POST", body: JSON.stringify({ founder_id: founderId, thesis }) }),
  decision: (founderId: string, thesis: ThesisConfig) =>
    request<{ run_id: string; memo: InvestmentMemo }>("/api/decision", { method: "POST", body: JSON.stringify({ founder_id: founderId, thesis }) }),
};
