import { useState, useRef } from "react";

interface DashboardProps {
  token: string;
}

type SidebarView = "summary" | "timeline" | "iocs" | "findings";

interface Finding {
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  timestamp?: string;
  confidence?: number;
}

interface IOC {
  type: string;
  value: string;
  context: string;
}

interface TimelineEvent {
  timestamp: string;
  description: string;
  severity: "critical" | "warning" | "info";
}

interface AnalysisResult {
  filename: string;
  events_parsed: number;
  analysis_time: number;
  log_type: string;
  summary: string;
  critical_count: number;
  warning_count: number;
  info_count: number;
  ioc_count: number;
  findings: Finding[];
  iocs: IOC[];
  timeline: TimelineEvent[];
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const NAV_ITEMS: { id: SidebarView; label: string; icon: JSX.Element }[] = [
  {
    id: "summary",
    label: "Threat summary",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>,
  },
  {
    id: "timeline",
    label: "Event timeline",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
  {
    id: "iocs",
    label: "IOC list",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M7.5 7.5L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
  {
    id: "findings",
    label: "Raw findings",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h7M2 10h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
];

function severityColor(sev: string) {
  if (sev === "critical") return "#f85149";
  if (sev === "warning") return "#e3b341";
  return "#58a6ff";
}

function severityBadgeStyle(sev: string): React.CSSProperties {
  const color = severityColor(sev);
  return {
    fontSize: "9px", fontWeight: 700, padding: "2px 7px",
    borderRadius: "2px", letterSpacing: "0.06em",
    whiteSpace: "nowrap", marginTop: "2px", flexShrink: 0,
    border: `1px solid ${color}44`,
    color, background: `${color}18`,
    fontFamily: "'IBM Plex Mono', monospace",
  };
}

export default function Dashboard({ token }: DashboardProps) {
  const [view, setView] = useState<SidebarView>("summary");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/analysis/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
      setView("summary");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const renderMain = () => {
    if (loading) return <LoadingState />;
    if (!result) return (
      <UploadState
        dragging={dragging}
        setDragging={setDragging}
        onDrop={onDrop}
        fileRef={fileRef}
        handleFile={handleFile}
        error={error}
      />
    );
    switch (view) {
      case "summary":  return <SummaryView result={result} />;
      case "timeline": return <TimelineView timeline={result.timeline} />;
      case "iocs":     return <IOCView iocs={result.iocs} />;
      case "findings": return <FindingsView findings={result.findings} />;
    }
  };

  return (
    <div style={s.shell}>
      <style>{`
        .sb-btn:hover { background: rgba(255,255,255,0.04) !important; color: #8b9ab0 !important; }
        .upload-zone:hover { border-color: rgba(56,139,255,0.45) !important; background: rgba(56,139,255,0.03) !important; }
        .finding-row:hover { background: #0f1e35 !important; }
      `}</style>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sbSection}>Analysis</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className="sb-btn"
            disabled={!result && item.id !== "summary"}
            style={{
              ...s.sbItem,
              ...(view === item.id && result ? s.sbItemActive : {}),
              opacity: !result && item.id !== "summary" ? 0.35 : 1,
              cursor: !result && item.id !== "summary" ? "not-allowed" : "pointer",
            }}
            onClick={() => result && setView(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div style={s.sbSection}>History</div>
        <button className="sb-btn" style={s.sbItem}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            <path d="M5 5h4M5 7h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Past analyses
        </button>

        <button
          style={s.sbUpload}
          onClick={() => { setResult(null); setError(""); fileRef.current?.click(); }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Upload new log
        </button>
      </aside>

      {/* Main content */}
      <main style={s.main}>
        {result && (
          <div style={s.topbar}>
            <div>
              <div style={s.topbarTitle}>
                {view === "summary" ? "Threat summary"
                  : view === "timeline" ? "Event timeline"
                  : view === "iocs" ? "IOC list"
                  : "Raw findings"}
              </div>
              <div style={s.topbarMeta}>
                {result.filename} · {result.events_parsed.toLocaleString()} events · {result.analysis_time}s
              </div>
            </div>
            <div style={s.fileChip}>{result.log_type}</div>
          </div>
        )}
        <div style={s.mainBody}>
          {renderMain()}
        </div>
      </main>

      <input
        ref={fileRef}
        type="file"
        accept=".log,.txt"
        style={{ display: "none" }}
        onChange={e => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ── Upload state ── */
function UploadState({ dragging, setDragging, onDrop, fileRef, handleFile, error }: any) {
  return (
    <div style={uv.wrap}>
      <div
        className="upload-zone"
        style={{ ...uv.zone, ...(dragging ? uv.zoneDrag : {}) }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div style={uv.icon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v12M7 9l5-5 5 5" stroke="#58a6ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 19h16" stroke="#58a6ff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={uv.title}>Drop a log file to begin</div>
        <div style={uv.sub}>or click to browse — supports .log and .txt</div>
        <div style={uv.types}>
          <span style={uv.type}>.log</span>
          <span style={uv.type}>.txt</span>
        </div>
      </div>
      {error && <div style={uv.error}>⚠ {error}</div>}
      <div style={uv.hint}>The AI will parse every event and surface anomalies, IOCs, and a threat summary.</div>
    </div>
  );
}

/* ── Loading state ── */
function LoadingState() {
  return (
    <div style={uv.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={uv.loadBox}>
        <div style={{ width: "32px", height: "32px", border: "2px solid rgba(56,139,255,0.15)", borderTopColor: "#58a6ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={uv.loadTitle}>Analyzing log file...</div>
        <div style={uv.loadSub}>Parsing events and running LLM analysis</div>
      </div>
    </div>
  );
}

/* ── Summary view ── */
function SummaryView({ result }: { result: AnalysisResult }) {
  return (
    <div style={sv.wrap}>
      <div style={sv.kpiRow}>
        {[
          { n: result.critical_count, label: "Critical", color: "#f85149" },
          { n: result.warning_count,  label: "Warnings", color: "#e3b341" },
          { n: result.ioc_count,      label: "IOCs found", color: "#58a6ff" },
          { n: result.events_parsed.toLocaleString(), label: "Events reviewed", color: "#3fb950" },
        ].map(k => (
          <div key={k.label} style={sv.kpi}>
            <div style={{ ...sv.kpiN, color: k.color }}>{k.n}</div>
            <div style={sv.kpiL}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={sv.card}>
        <div style={sv.cardLabel}>AI threat summary</div>
        <div style={sv.summaryText}>{result.summary}</div>
      </div>

      <div>
        <div style={sv.sectionHeader}>
          <span style={sv.sectionTitle}>Top findings</span>
          <span style={sv.sectionMeta}>{result.findings.length} total · critical first</span>
        </div>
        {result.findings.slice(0, 5).map((f, i) => <FindingRow key={i} finding={f} />)}
      </div>
    </div>
  );
}

/* ── Findings view ── */
function FindingsView({ findings }: { findings: Finding[] }) {
  return (
    <div style={sv.wrap}>
      <div style={sv.sectionHeader}>
        <span style={sv.sectionTitle}>All findings</span>
        <span style={sv.sectionMeta}>{findings.length} total</span>
      </div>
      {findings.map((f, i) => <FindingRow key={i} finding={f} />)}
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  return (
    <div className="finding-row" style={{ ...fv.row, borderColor: `${severityColor(finding.severity)}33` }}>
      <span style={severityBadgeStyle(finding.severity)}>
        {finding.severity === "critical" ? "CRIT" : finding.severity === "warning" ? "WARN" : "INFO"}
      </span>
      <div style={fv.body}>
        <div style={fv.title}>{finding.title}</div>
        {finding.detail && <div style={fv.detail}>{finding.detail}</div>}
      </div>
      <div style={fv.right}>
        {finding.timestamp  && <div style={fv.time}>{finding.timestamp}</div>}
        {finding.confidence && <div style={{ ...fv.conf, color: severityColor(finding.severity) }}>{finding.confidence.toFixed(2)}</div>}
      </div>
    </div>
  );
}

/* ── Timeline view ── */
function TimelineView({ timeline }: { timeline: TimelineEvent[] }) {
  if (!timeline?.length) return <EmptyState message="No timeline events in this analysis." />;
  return (
    <div style={tv.wrap}>
      {timeline.map((event, i) => (
        <div key={i} style={tv.row}>
          <div style={tv.left}>
            <div style={{ ...tv.dot, background: severityColor(event.severity) }} />
            {i < timeline.length - 1 && <div style={tv.line} />}
          </div>
          <div style={tv.body}>
            <div style={tv.time}>{event.timestamp}</div>
            <div style={tv.desc}>{event.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── IOC view ── */
function IOCView({ iocs }: { iocs: IOC[] }) {
  if (!iocs?.length) return <EmptyState message="No IOCs extracted from this log." />;
  return (
    <div style={iv.wrap}>
      <div style={iv.header}>
        <span style={iv.col}>Type</span>
        <span style={{ ...iv.col, flex: 2 }}>Indicator</span>
        <span style={{ ...iv.col, flex: 3 }}>Context</span>
      </div>
      {iocs.map((ioc, i) => (
        <div key={i} style={iv.row}>
          <span style={iv.typeTag}>{ioc.type}</span>
          <span style={{ ...iv.val, flex: 2 }}>{ioc.value}</span>
          <span style={{ ...iv.ctx, flex: 3 }}>{ioc.context}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: "48px", textAlign: "center", color: "#4d5f75", fontSize: "13px" }}>
      {message}
    </div>
  );
}

/* ── Styles ── */

const s: Record<string, React.CSSProperties> = {
  // Takes up space below the 58px navbar
  shell: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    position: "fixed",
    top: "58px",
    left: 0,
    right: 0,
    bottom: 0,
    background: "#060d1a",
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: "#e8edf5",
    overflow: "hidden",
  },
  sidebar: {
    background: "#07101e",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
  },
  sbSection: {
    fontSize: "10px", fontWeight: 600, color: "#2a3a50",
    letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "16px 16px 6px",
    fontFamily: "'IBM Plex Mono', monospace",
    flexShrink: 0,
  },
  sbItem: {
    display: "flex", alignItems: "center", gap: "9px",
    fontSize: "13px", padding: "8px 14px", margin: "1px 8px",
    borderRadius: "5px", color: "#4d5f75",
    background: "none", border: "none",
    width: "calc(100% - 16px)", textAlign: "left",
    fontFamily: "'IBM Plex Sans', sans-serif",
    transition: "all 0.15s",
  },
  sbItemActive: { background: "rgba(56,139,255,0.1)", color: "#58a6ff", fontWeight: 500 },
  sbUpload: {
    margin: "auto 12px 16px", background: "#1a6ef5", color: "#fff",
    border: "none", borderRadius: "6px", padding: "10px",
    fontSize: "13px", fontWeight: 600, cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    flexShrink: 0,
  },
  main: { display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 },
  mainBody: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "24px 28px", minHeight: 0 },
  topbar: {
    padding: "0 28px", height: "52px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexShrink: 0,
  },
  topbarTitle: { fontSize: "14px", fontWeight: 600, color: "#e8edf5", marginBottom: "2px" },
  topbarMeta: { fontSize: "11px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  fileChip: {
    fontSize: "11px", color: "#58a6ff",
    background: "rgba(56,139,255,0.08)", border: "1px solid rgba(56,139,255,0.2)",
    padding: "3px 10px", borderRadius: "3px",
    fontFamily: "'IBM Plex Mono', monospace",
  },
};

const uv: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", padding: "48px" },
  zone: { border: "1px dashed rgba(56,139,255,0.25)", borderRadius: "10px", padding: "48px 64px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", cursor: "pointer", textAlign: "center", transition: "all 0.15s", width: "100%", maxWidth: "480px" },
  zoneDrag: { borderColor: "rgba(56,139,255,0.6)", background: "rgba(56,139,255,0.05)" },
  icon: { width: "52px", height: "52px", background: "rgba(56,139,255,0.08)", border: "1px solid rgba(56,139,255,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontSize: "16px", fontWeight: 600, color: "#e8edf5" },
  sub: { fontSize: "13px", color: "#4d5f75" },
  types: { display: "flex", gap: "6px" },
  type: { fontSize: "10px", color: "#58a6ff", background: "rgba(56,139,255,0.08)", border: "1px solid rgba(56,139,255,0.2)", padding: "2px 8px", borderRadius: "3px", fontFamily: "'IBM Plex Mono', monospace" },
  hint: { fontSize: "12px", color: "#2a3a50", maxWidth: "380px", textAlign: "center", lineHeight: 1.6 },
  error: { fontSize: "13px", color: "#f85149", background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)", padding: "10px 16px", borderRadius: "6px", width: "100%", maxWidth: "480px" },
  loadBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  loadTitle: { fontSize: "15px", fontWeight: 600, color: "#e8edf5" },
  loadSub: { fontSize: "13px", color: "#4d5f75" },
};

const sv: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: "16px" },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" },
  kpi: { background: "#0c1628", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "16px 18px" },
  kpiN: { fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "4px" },
  kpiL: { fontSize: "11px", color: "#4d5f75", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" },
  card: { background: "#0c1628", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "18px 20px" },
  cardLabel: { fontSize: "10px", fontWeight: 600, color: "#4d5f75", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "10px" },
  summaryText: { fontSize: "14px", color: "#c8d3e0", lineHeight: 1.75 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" },
  sectionTitle: { fontSize: "13px", fontWeight: 600, color: "#e8edf5" },
  sectionMeta: { fontSize: "11px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
};

const fv: Record<string, React.CSSProperties> = {
  row: { background: "#0c1628", borderRadius: "7px", padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: "10px", border: "1px solid", marginBottom: "6px", transition: "background 0.15s" },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: "13px", fontWeight: 600, color: "#e8edf5", marginBottom: "3px" },
  detail: { fontSize: "11px", color: "#8b9ab0", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  right: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", flexShrink: 0 },
  time: { fontSize: "10px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  conf: { fontSize: "11px", fontWeight: 500 },
};

const tv: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", paddingTop: "4px" },
  row: { display: "flex", gap: "16px" },
  left: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 },
  dot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, marginTop: "4px" },
  line: { width: "1px", flex: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0", minHeight: "24px" },
  body: { paddingBottom: "20px", flex: 1 },
  time: { fontSize: "11px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "4px" },
  desc: { fontSize: "13px", color: "#c8d3e0", lineHeight: 1.6 },
};

const iv: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column" },
  header: { display: "flex", gap: "16px", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "4px" },
  col: { fontSize: "10px", fontWeight: 600, color: "#4d5f75", letterSpacing: "0.1em", textTransform: "uppercase", flex: 1, fontFamily: "'IBM Plex Mono', monospace" },
  row: { display: "flex", gap: "16px", padding: "10px 14px", background: "#0c1628", borderRadius: "6px", marginBottom: "4px", alignItems: "center" },
  typeTag: { fontSize: "10px", fontWeight: 600, color: "#58a6ff", background: "rgba(56,139,255,0.08)", border: "1px solid rgba(56,139,255,0.2)", padding: "2px 8px", borderRadius: "3px", fontFamily: "'IBM Plex Mono', monospace", flex: 1, textTransform: "uppercase" },
  val: { fontSize: "12px", color: "#e8edf5", fontFamily: "'IBM Plex Mono', monospace" },
  ctx: { fontSize: "12px", color: "#8b9ab0" },
};
