import { Play, Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { ThesisConfig } from "../types";

interface ThesisPanelProps {
  value: ThesisConfig;
  busy: boolean;
  onChange: (value: ThesisConfig) => void;
  onRun: (queries: { github: string; web: string; limit: number }) => void;
}

export function ThesisPanel({ value, busy, onChange, onRun }: ThesisPanelProps) {
  const [github, setGithub] = useState("stars:>100 pushed:>2025-01-01");
  const [web, setWeb] = useState("technical founders building AI developer infrastructure");
  const [limit, setLimit] = useState(5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 1600);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const update = <K extends keyof ThesisConfig>(key: K, next: ThesisConfig[K]) => onChange({ ...value, [key]: next });
  const list = (text: string) => text.split(",").map((item) => item.trim()).filter(Boolean);

  return (
    <aside className="thesis-panel">
      <div className="panel-kicker">THESIS ENGINE</div>
      <h2>Define the signal.</h2>
      <p className="panel-note">The same thesis drives sourcing, screening, diligence, and the final memo.</p>

      <div className="field-stack">
        <label>Sectors<input value={value.sectors.join(", ")} onChange={(event) => update("sectors", list(event.target.value))} /></label>
        <div className="field-row">
          <label>Stage<input value={value.stage || ""} onChange={(event) => update("stage", event.target.value || null)} /></label>
          <label>Check size<input type="number" value={value.check_size_usd || ""} onChange={(event) => update("check_size_usd", Number(event.target.value) || null)} /></label>
        </div>
        <label>Geography<input value={value.geography.join(", ")} onChange={(event) => update("geography", list(event.target.value))} /></label>
        <div className="field-row">
          <label>Ownership %<input type="number" value={value.ownership_target_percent || ""} onChange={(event) => update("ownership_target_percent", Number(event.target.value) || null)} /></label>
          <label>Risk appetite<select value={value.risk_appetite || ""} onChange={(event) => update("risk_appetite", (event.target.value || null) as ThesisConfig["risk_appetite"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        </div>
        <label>Investment notes<textarea rows={3} value={value.notes || ""} onChange={(event) => update("notes", event.target.value || null)} /></label>
      </div>

      <div className="source-block">
        <div className="panel-kicker">OUTBOUND SEARCH</div>
        <label>GitHub query<input value={github} onChange={(event) => setGithub(event.target.value)} /></label>
        <label>Web context<input value={web} onChange={(event) => setWeb(event.target.value)} /></label>
        <label>Candidate limit<select value={limit} onChange={(event) => setLimit(Number(event.target.value))}><option>3</option><option>5</option><option>8</option><option>10</option></select></label>
      </div>

      <button className="primary-button full" disabled={busy || !github.trim()} onClick={() => onRun({ github, web, limit })}>
        <Play size={17} fill="currentColor" /> {busy ? "SOURCING..." : "RUN SOURCING"}
      </button>
      <button className="text-button full" onClick={() => { setSaved(true); localStorage.setItem("lodestar-thesis", JSON.stringify(value)); }}>
        <Save size={16} /> {saved ? "THESIS SAVED" : "SAVE THESIS"}
      </button>
    </aside>
  );
}
