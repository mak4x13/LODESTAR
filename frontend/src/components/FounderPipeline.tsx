import { ArrowDown, ArrowRight, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { founderDisplay } from "../lib/display";
import type { FounderRow, Trend } from "../types";

const sourceLabels: Record<string, string> = {
  outbound_github: "GitHub",
  outbound_tavily: "Web",
  voice_intake: "Voice",
  inbound: "Inbound",
};

function TrendIcon({ trend }: { trend?: Trend | null }) {
  if (trend === "improving") return <ArrowUp size={15} />;
  if (trend === "declining") return <ArrowDown size={15} />;
  return <ArrowRight size={15} />;
}

export function FounderPipeline({ founders, loading }: { founders: FounderRow[]; loading: boolean }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const filtered = useMemo(() => founders
    .filter((founder) => `${founder.profile?.company_name || ""} ${founder.name || founder.profile?.name || ""} ${founder.profile?.sector || ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (Number(a.founder_score || 0) - Number(b.founder_score || 0)) * (sortDesc ? -1 : 1)), [founders, query, sortDesc]);

  return (
    <section className="pipeline-panel">
      <div className="pipeline-toolbar">
        <div>
          <div className="panel-kicker">FOUNDER PIPELINE</div>
          <h2>{founders.length} {founders.length === 1 ? "candidate" : "candidates"} in memory</h2>
        </div>
        <div className="toolbar-actions">
          <label className="search-field"><Search size={17} /><input aria-label="Search founders" placeholder="Search founders" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <button className="secondary-button" onClick={() => setSortDesc((value) => !value)}><ChevronsUpDown size={16} /> Score</button>
        </div>
      </div>

      <div className="pipeline-head" aria-hidden="true">
        <span>Founder / company</span><span>Source</span><span>Signal</span><span>Score</span><span />
      </div>
      <div className="pipeline-list">
        {loading && Array.from({ length: 4 }).map((_, index) => <div className="pipeline-row skeleton" key={index} />)}
        {!loading && filtered.map((founder) => {
          const display = founderDisplay(founder);
          return (
            <button className="pipeline-row" key={founder.id} onClick={() => navigate(`/founders/${founder.id}`)}>
              <span className="founder-cell"><span className="avatar">{display.initials}</span><span><strong>{display.company}</strong><small>{display.person}</small></span></span>
              <span><i className={`source-dot ${founder.source}`} />{sourceLabels[founder.source] || founder.source}</span>
              <span className={`trend ${founder.founder_score_trend || "stable"}`}><TrendIcon trend={founder.founder_score_trend} /> {founder.founder_score_trend || "stable"}</span>
              <span className="score-cell"><b>{founder.founder_score == null ? "--" : Math.round(Number(founder.founder_score))}</b><i><em style={{ width: `${founder.founder_score || 0}%` }} /></i></span>
              <span className="row-arrow"><ArrowRight size={18} /></span>
            </button>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="empty-state"><div className="empty-mark">00</div><h3>No founder signals yet.</h3><p>Run an outbound search or submit an inbound application. Candidates will appear here after the pipeline persists real evidence.</p></div>
        )}
      </div>
    </section>
  );
}
