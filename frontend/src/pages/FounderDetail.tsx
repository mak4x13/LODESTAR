import { ArrowLeft, ArrowUpRight, Check, FileText, Github, Globe, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { founderDisplay } from "../lib/display";
import { loadThesis } from "../lib/thesis";
import type { EvidenceItem, FounderRow, InvestmentMemo, MemoSection, ScoreItem } from "../types";

const axisName: Record<string, string> = { founder: "Founder", market: "Market", idea_vs_market: "Idea vs. market" };

function ScoreCard({ item }: { item?: ScoreItem }) {
  return <div className="axis-score"><span>{item ? axisName[item.axis] : "Pending"}</span><strong>{item ? Math.round(item.score) : "--"}<small>/100</small></strong><div><i style={{ width: `${item?.score || 0}%` }} /></div><p>{item?.rationale || "This axis has not been scored yet."}</p></div>;
}

function MemoBlock({ section, evidence }: { section: MemoSection; evidence: EvidenceItem[] }) {
  return <section className="memo-section"><h3>{section.title}</h3><ul>{section.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>{section.evidence_refs.length > 0 && <div className="memo-refs">{section.evidence_refs.map((ref) => {
    const match = evidence.find((item) => item.id === ref || item.source_url === ref || item.claim === ref);
    const href = match ? `#evidence-${match.id}` : ref.startsWith("http") ? ref : "#evidence-ledger";
    return <a key={ref} href={href} target={ref.startsWith("http") && !match ? "_blank" : undefined} rel={ref.startsWith("http") && !match ? "noreferrer" : undefined}>EVIDENCE {ref.slice(0, 8)} <ArrowUpRight size={11} /></a>;
  })}</div>}</section>;
}

export default function FounderDetail() {
  const { id = "" } = useParams();
  const [founder, setFounder] = useState<FounderRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [memo, setMemo] = useState<InvestmentMemo | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const result = await api.getFounder(id);
      setFounder(result.founder);
      setEvidence(result.evidence as EvidenceItem[]);
      setScores(result.scores as ScoreItem[]);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Founder record could not be loaded.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  const latestScores = useMemo(() => Object.values([...scores]
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    .reduce<Record<string, ScoreItem>>((result, item) => ({ ...result, [item.axis]: item }), {})), [scores]);

  async function run(kind: "screen" | "diligence" | "memo") {
    setAction(kind); setError(null);
    try {
      if (kind === "memo") {
        const result = await api.decision(id, loadThesis());
        setMemo(result.memo);
      } else {
        await (kind === "screen" ? api.screen(id, loadThesis()) : api.diligence(id, loadThesis()));
        await load();
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The agent run failed."); }
    finally { setAction(null); }
  }

  if (loading) return <div className="page-loader"><LoaderCircle className="spin" /> Loading founder memory</div>;
  if (!founder) return <div className="not-found"><h1>Founder not found.</h1><p>{error}</p><Link to="/">Return to pipeline</Link></div>;
  const profile = founder.profile;
  const display = founderDisplay(founder);

  return (
    <div className="detail-page">
      <div className="detail-back"><Link to="/"><ArrowLeft size={17} /> Pipeline</Link><span>FOUNDER MEMORY / {founder.id.slice(0, 8).toUpperCase()}</span></div>
      {error && <div className="error-banner" role="alert"><strong>Action failed</strong><span>{error}</span><button onClick={() => setError(null)}>Dismiss</button></div>}
      <header className="founder-hero">
        <div><span className="eyebrow">{profile.sector || "SECTOR PENDING"} / {profile.stage || "STAGE PENDING"}</span><h1>{display.company}</h1><p>{profile.product_summary || "No product summary has been established from the available evidence."}</p><div className="profile-links">{profile.github_handle && <a href={`https://github.com/${profile.github_handle}`} target="_blank" rel="noreferrer"><Github size={16} /> {profile.github_handle}</a>}{profile.website && <a href={profile.website} target="_blank" rel="noreferrer"><Globe size={16} /> Website</a>}</div></div>
        <div className="hero-score"><span>FOUNDER SCORE</span><strong>{founder.founder_score == null ? "--" : Math.round(Number(founder.founder_score))}</strong><small className={founder.founder_score_trend || "stable"}>{founder.founder_score_trend || "Unscored"}</small></div>
      </header>
      <div className="founder-facts"><div><span>FOUNDER</span><strong>{display.person}</strong></div><div><span>SOURCE</span><strong>{founder.source.replace(/_/g, " ")}</strong></div><div><span>LOCATION</span><strong>{profile.location || "Not established"}</strong></div><div><span>EVIDENCE</span><strong>{evidence.length} verified claims</strong></div></div>

      <div className="detail-actions">
        <button className="primary-button" onClick={() => run("memo")} disabled={!!action}>{action === "memo" ? <LoaderCircle className="spin" size={17} /> : <FileText size={17} />} Generate memo</button>
        <button className="secondary-button" onClick={() => run("diligence")} disabled={!!action}><ShieldCheck size={17} /> Re-run diligence</button>
        <button className="secondary-button" onClick={() => run("screen")} disabled={!!action}><RefreshCw size={17} /> Re-score</button>
      </div>

      <section className="detail-section"><div className="section-heading"><span>01</span><div><div className="panel-kicker">THREE-AXIS ASSESSMENT</div><h2>Signal, separated from story.</h2></div></div><div className="axis-grid">{(["founder", "market", "idea_vs_market"] as const).map((axis) => <ScoreCard key={axis} item={latestScores.find((item) => item.axis === axis)} />)}</div></section>

      <section className="detail-section" id="evidence-ledger"><div className="section-heading"><span>02</span><div><div className="panel-kicker">EVIDENCE LEDGER</div><h2>Every claim earns its confidence.</h2></div></div><div className="evidence-list">{evidence.map((item) => <article className="evidence-row" id={`evidence-${item.id}`} key={item.id}><div className={`trust-score ${item.trust_score >= .75 ? "high" : item.trust_score >= .5 ? "medium" : "low"}`}><strong>{Math.round(item.trust_score * 100)}</strong><span>TRUST</span></div><div><span className="evidence-type">{item.evidence_type.replace(/_/g, " ")}</span><h3>{item.claim}</h3>{item.source_snippet && <p>{item.source_snippet}</p>}{item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={14} /></a>}</div><Check size={17} className="evidence-check" /></article>)}{evidence.length === 0 && <div className="flat-empty">No evidence has been persisted for this founder.</div>}</div></section>

      <section className="detail-section gaps-section"><div className="section-heading"><span>03</span><div><div className="panel-kicker">EXPLICIT GAPS</div><h2>What we still do not know.</h2></div></div><div className="gap-grid">{(profile.gaps || []).map((gap, index) => <div key={gap}><span>{String(index + 1).padStart(2, "0")}</span><p>{gap}</p></div>)}{(!profile.gaps || profile.gaps.length === 0) && <div className="flat-empty">No explicit gaps were recorded.</div>}</div></section>

      {memo && <section className="memo-document"><header><div><span className="eyebrow">INVESTMENT DECISION / GENERATED MEMO</span><h2>{display.company}</h2></div><Sparkles size={28} /></header><div className="memo-grid"><MemoBlock section={memo.company_snapshot} evidence={evidence} /><MemoBlock section={memo.investment_hypotheses} evidence={evidence} /><MemoBlock section={memo.swot} evidence={evidence} /><MemoBlock section={memo.problem_and_product} evidence={evidence} /><MemoBlock section={memo.traction_and_kpis} evidence={evidence} /><section className="memo-section"><h3>Explicit gaps</h3><ul>{memo.explicit_gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></section></div></section>}
    </div>
  );
}
