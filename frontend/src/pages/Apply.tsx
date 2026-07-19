import { ArrowRight, CheckCircle2, FileText, LoaderCircle, Mic, Radio } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { loadThesis } from "../lib/thesis";

export default function Apply() {
  const [mode, setMode] = useState<"written" | "voice">("written");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; runId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");

  async function submitWritten(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await api.applyInbound({ company_name: data.get("company_name"), founder_name: data.get("founder_name") || null, email: data.get("email") || null, github_handle: data.get("github_handle") || null, website: data.get("website") || null, application_text: data.get("application_text"), thesis: loadThesis() });
      setResult({ id: response.founder.id, runId: response.run_id });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Application could not be processed."); }
    finally { setBusy(false); }
  }

  async function submitVoice(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const response = await api.submitTranscript({ transcript, thesis: loadThesis() });
      setResult({ id: response.founder.id, runId: response.run_id });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Transcript could not be processed."); }
    finally { setBusy(false); }
  }

  if (result) return <div className="intake-success"><CheckCircle2 size={40} /><span className="eyebrow">PIPELINE COMPLETE</span><h1>Signal received.</h1><p>The founder profile has been normalized, screened, reviewed, and added to investor memory.</p><div>RUN ID <code>{result.runId}</code></div><Link className="primary-button" to={`/founders/${result.id}`}>View assessment <ArrowRight size={17} /></Link></div>;

  return (
    <div className="intake-page">
      <header className="intake-intro"><span className="eyebrow">INBOUND FOUNDER INTAKE</span><h1>SHOW US<br />THE SIGNAL.</h1><p>Skip the polished deck. Share what you are building, the proof you have, and the hard parts still unresolved.</p><div className="intake-points"><span><b>01</b> Structured profile</span><span><b>02</b> Evidence review</span><span><b>03</b> Three-axis score</span></div></header>
      <section className="intake-form-wrap">
        <div className="mode-tabs"><button className={mode === "written" ? "active" : ""} onClick={() => setMode("written")}><FileText size={17} /> Written application</button><button className={mode === "voice" ? "active" : ""} onClick={() => setMode("voice")}><Mic size={17} /> Voice transcript</button></div>
        {error && <div className="form-error">{error}</div>}
        {mode === "written" ? <form className="intake-form" onSubmit={submitWritten}><div className="field-row"><label>Company name *<input name="company_name" required placeholder="Acme Labs" /></label><label>Founder name<input name="founder_name" placeholder="Full name" /></label></div><div className="field-row"><label>Email<input name="email" type="email" placeholder="founder@company.com" /></label><label>GitHub handle<input name="github_handle" placeholder="username" /></label></div><label>Website<input name="website" type="url" placeholder="https://" /></label><label>Founder brief *<textarea name="application_text" required minLength={20} rows={9} placeholder="What are you building? What proof of execution do you have? Who needs this now, and what remains uncertain?" /></label><button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />} Submit for assessment</button></form> : <form className="intake-form" onSubmit={submitVoice}><div className="voice-status"><Radio size={18} /><div><strong>Voice-first intake</strong><p>Paste the ElevenLabs transcript from your founder conversation. The same assessment pipeline handles the rest.</p></div></div><label>Conversation transcript *<textarea required minLength={20} rows={14} value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Paste the founder conversation transcript here..." /></label><button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Mic size={17} />} Process transcript</button></form>}
      </section>
    </div>
  );
}
