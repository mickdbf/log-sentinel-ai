import { useEffect, useState } from "react";

interface SplashPageProps {
  token: string | null;
  onEnterDashboard: () => void;
  onGetStarted: () => void;
}

const FEATURES = [
  {
    tag: "Ingestion",
    title: "Text-based log parsing",
    desc: "Upload .log or .txt files. The backend extracts timestamps, IPs, usernames, and actions from each line automatically.",
  },
  {
    tag: "Detection",
    title: "AI anomaly analysis",
    desc: "Parsed events are sent to an LLM which identifies suspicious patterns, outliers, and potential threats across the session.",
  },
  {
    tag: "Timeline",
    title: "Event reconstruction",
    desc: "Events are ordered chronologically so analysts can trace what happened, when, and in what sequence without manual correlation.",
  },
  {
    tag: "Output",
    title: "Structured findings",
    desc: "Every analysis returns a threat summary, ranked findings with severity labels, and extracted key indicators ready to review.",
  },
];

const STEPS = [
  { num: "01", title: "Upload a log file", sub: ".log or .txt" },
  { num: "02", title: "Backend parses events", sub: "Extracts structured fields" },
  { num: "03", title: "LLM analyzes", sub: "Identifies anomalies" },
  { num: "04", title: "Review findings", sub: "Ranked by severity" },
];

const STATS = [
  { val: "< 2s", label: "Parse & analysis time" },
  { val: "100%", label: "Event coverage — no sampling" },
  { val: "LLM", label: "Powered anomaly detection" },
  { val: "IOC", label: "Extraction on every run" },
];

function DashboardPreview() {
  return (
    <div style={p.card}>
      <div style={p.sidebar}>
        <div style={p.sbLogo}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#58a6ff" strokeWidth="1.2" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="#58a6ff"/>
          </svg>
          <span style={p.sbLogoName}>LogSentinel</span>
        </div>
        <div style={p.sbSection}>Analysis</div>
        {["Threat summary", "IOC list", "Event timeline", "User activity"].map((item, i) => (
          <div key={item} style={{ ...p.sbItem, ...(i === 0 ? p.sbItemActive : {}) }}>
            <span style={{ fontSize: "6px", color: i === 0 ? "#58a6ff" : "#2a3a50", flexShrink: 0 }}>●</span>
            {item}
          </div>
        ))}
        <div style={p.sbSection}>Logs</div>
        {["Raw events", "Parsed fields"].map(item => (
          <div key={item} style={p.sbItem}>
            <span style={{ fontSize: "6px", color: "#2a3a50", flexShrink: 0 }}>●</span>
            {item}
          </div>
        ))}
        <button style={p.sbUpload}>+ New upload</button>
      </div>

      <div style={p.main}>
        <div style={p.mainTop}>
          <div>
            <div style={p.mainTitle}>Threat summary</div>
            <div style={p.mainMeta}>auth_logs_2024-11-22.log · 3,241 events · analyzed 1.2s ago</div>
          </div>
          <div style={p.fileChip}>auto-detected: auth log</div>
        </div>

        <div style={p.kpiRow}>
          {[
            { n: "4", color: "#f85149", label: "Critical findings" },
            { n: "12", color: "#e3b341", label: "Suspicious events" },
            { n: "6", color: "#58a6ff", label: "Unique IOCs" },
            { n: "2", color: "#3fb950", label: "Affected users" },
          ].map(k => (
            <div key={k.label} style={p.kpi}>
              <div style={{ ...p.kpiN, color: k.color }}>{k.n}</div>
              <div style={p.kpiL}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={p.findings}>
          {[
            {
              sev: "CRIT", borderColor: "rgba(248,81,73,0.2)",
              badgeStyle: { color: "#f85149", background: "rgba(248,81,73,0.12)", borderColor: "rgba(248,81,73,0.3)" },
              title: "Brute force pattern — 43 failed logins from single IP in 2 minutes",
              detail: "src: 192.168.1.45 · user: admin · failures: 43 · window: 00:01:52",
              time: "03:14:22", conf: "0.94",
            },
            {
              sev: "WARN", borderColor: "rgba(227,179,65,0.18)",
              badgeStyle: { color: "#e3b341", background: "rgba(227,179,65,0.1)", borderColor: "rgba(227,179,65,0.3)" },
              title: "After-hours privileged access — admin login outside normal window",
              detail: "user: jsmith · src: 10.0.4.22 · time: 03:31 · baseline: 08:00–18:00",
              time: "03:31:07", conf: "0.88",
            },
            {
              sev: "WARN", borderColor: "rgba(227,179,65,0.18)",
              badgeStyle: { color: "#e3b341", background: "rgba(227,179,65,0.1)", borderColor: "rgba(227,179,65,0.3)" },
              title: "Repeated access to sensitive endpoint from unrecognized IP",
              detail: "src: 203.0.113.9 · endpoint: /admin/users · requests: 18 · first seen: now",
              time: "02:58:44", conf: "0.81",
            },
          ].map((f, i) => (
            <div key={i} style={{ ...p.finding, borderColor: f.borderColor }}>
              <span style={{ ...p.badge, ...f.badgeStyle }}>{f.sev}</span>
              <div style={p.findingBody}>
                <div style={p.findingTitle}>{f.title}</div>
                <div style={p.findingDetail}>{f.detail}</div>
              </div>
              <div style={p.findingRight}>
                <div style={p.findingTime}>{f.time}</div>
                <div style={p.findingConf}>{f.conf}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SplashPage({ token, onEnterDashboard, onGetStarted }: SplashPageProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div style={s.page}>
      <style>{`
        .ls-tile { transition: background 0.15s; }
        .ls-tile:hover { background: #0d1b2e !important; }
      `}</style>
      <div style={s.bgGrid} />

      {/* Hero — full width, left-aligned like a real tool */}
      <section style={{ ...s.hero, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)", transition: "all 0.45s ease" }}>
        <div style={s.heroInner}>
          <div style={s.heroLeft}>
            <div style={s.heroLabel}>
              <span style={s.heroLabelLine} />
              AI-assisted SOC tooling
            </div>
            <h1 style={s.h1}>
              Upload a log file.<br />
              <span style={s.h1Accent}>Get a threat brief.</span>
            </h1>
            <p style={s.heroSub}>
              LogSentinel parses text-based log files, extracts structured events, and uses an LLM to surface anomalies, suspicious patterns, and key indicators — delivered as a ranked findings report.
            </p>
            <div style={s.ctaRow}>
              {token ? (
                <button style={s.btnPrimary} onClick={onEnterDashboard}>
                  Open Dashboard
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              ) : (
                <button style={s.btnPrimary} onClick={onGetStarted}>
                  Sign in to get started
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              <span style={s.heroMeta}>Supports .log · .txt</span>
            </div>
          </div>

          <div style={s.heroRight}>
            <div style={s.gridCard}>
              <div style={s.gridHeader}>
                <span style={s.gridHeaderTitle}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L12 4V10L7 13L2 10V4L7 1Z" stroke="#58a6ff" strokeWidth="1.2" fill="none"/>
                    <circle cx="7" cy="7" r="1.8" fill="#58a6ff"/>
                  </svg>
                  What the AI detects
                </span>
                <span style={s.gridHeaderSub}>per analysis run</span>
              </div>
              <div style={s.tileGrid}>
                {[
                  { tag: "Critical", tagColor: "#f85149", title: "Attack patterns", desc: "Brute force, credential stuffing, and repeated failures — identified by volume and timing." },
                  { tag: "Warning", tagColor: "#e3b341", title: "Behavioral anomalies", desc: "Off-hours access, unusual user behavior, deviations from what's normal in the log." },
                  { tag: "Extraction", tagColor: "#58a6ff", title: "IOC extraction", desc: "Suspicious IPs, usernames, and endpoints pulled out automatically — no manual grep." },
                  { tag: "Timeline", tagColor: "#3fb950", title: "Event timeline", desc: "Key events in chronological order so you can trace exactly what happened and when." },
                ].map(tile => (
                  <div key={tile.title} style={s.tile} className="ls-tile">
                    <div style={{ ...s.tileTag, color: tile.tagColor }}>{tile.tag}</div>
                    <div style={s.tileTitle}>{tile.title}</div>
                    <div style={s.tileDesc}>{tile.desc}</div>
                  </div>
                ))}
                <div style={s.tileWide} className="ls-tile">
                  <div style={{ ...s.tileTag, color: "#8b9ab0" }}>Summary</div>
                  <div style={s.tileTitle}>Analyst threat brief</div>
                  <div style={s.tileDesc}>A plain-language summary of all findings ranked by severity — ready to action immediately.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — true full width */}
      <div style={s.statsBar}>
        {STATS.map((stat, i) => (
          <div key={stat.label} style={{ ...s.stat, ...(i < STATS.length - 1 ? s.statBorder : {}) }}>
            <div style={s.statVal}>{stat.val}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Dashboard preview */}
      <section style={s.previewSection}>
        <div style={s.previewLabel}>// analyst dashboard — threat summary view</div>
        <DashboardPreview />
      </section>

      {/* How it works */}
      <section style={s.section}>
        <div style={s.sectionEyebrow}>How it works</div>
        <h2 style={s.sectionH2}>From raw log to ranked findings.</h2>
        <div style={s.stepsRow}>
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={s.step}>
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepSub}>{step.sub}</div>
              </div>
              {i < STEPS.length - 1 && <div style={s.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={s.sectionAlt}>
        <div style={s.sectionInner}>
          <div style={s.sectionEyebrow}>Capabilities</div>
          <h2 style={s.sectionH2}>Built for analyst efficiency.</h2>
          <p style={s.sectionSub}>Structured parsing, LLM analysis, and a clean findings interface — focused on what matters.</p>
          <div style={s.featGrid}>
            {FEATURES.map(f => (
              <div key={f.title} style={s.featCard}>
                <div style={s.featTag}>{f.tag}</div>
                <div style={s.featTitle}>{f.title}</div>
                <div style={s.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaSection}>
        <div style={s.ctaInner}>
          <div>
            <h2 style={s.ctaH2}>Ready to triage your logs?</h2>
            <p style={s.ctaSub}>Sign in and upload a log file to get a structured threat analysis in seconds.</p>
          </div>
          <button style={s.btnPrimary} onClick={token ? onEnterDashboard : onGetStarted}>
            {token ? "Open Dashboard" : "Sign in to get started"}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </section>

      <footer style={s.footer}>
        <span style={s.footerText}>LogSentinel AI // SOC tooling</span>
        <span style={s.footerText}>FastAPI · PostgreSQL · Google Cloud · React</span>
      </footer>
    </div>
  );
}

const p: Record<string, React.CSSProperties> = {
  card: { background: "#0a1525", border: "1px solid rgba(56,139,255,0.12)", borderRadius: "12px", overflow: "hidden", display: "grid", gridTemplateColumns: "200px 1fr" },
  sidebar: { background: "#07101e", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "20px 12px", display: "flex", flexDirection: "column", gap: "2px" },
  sbLogo: { display: "flex", alignItems: "center", gap: "8px", padding: "0 8px", marginBottom: "24px" },
  sbLogoName: { fontSize: "13px", fontWeight: 700, color: "#e8edf5" },
  sbSection: { fontSize: "10px", fontWeight: 600, color: "#2a3a50", letterSpacing: "0.1em", textTransform: "uppercase" as const, padding: "0 8px", margin: "12px 0 4px" },
  sbItem: { fontSize: "12px", padding: "6px 8px", borderRadius: "4px", color: "#4d5f75", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  sbItemActive: { background: "rgba(56,139,255,0.1)", color: "#58a6ff", fontWeight: 500 },
  sbUpload: { marginTop: "auto", fontSize: "12px", fontWeight: 600, color: "#fff", background: "#1a6ef5", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit", textAlign: "center" as const },
  main: { padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" },
  mainTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  mainTitle: { fontSize: "13px", fontWeight: 600, color: "#e8edf5", marginBottom: "3px" },
  mainMeta: { fontSize: "11px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  fileChip: { fontSize: "11px", color: "#58a6ff", background: "rgba(56,139,255,0.08)", border: "1px solid rgba(56,139,255,0.2)", padding: "3px 10px", borderRadius: "3px", fontFamily: "'IBM Plex Mono', monospace" },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" },
  kpi: { background: "#0f1e35", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "12px 14px" },
  kpiN: { fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" },
  kpiL: { fontSize: "10px", color: "#4d5f75", marginTop: "3px", fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  findings: { display: "flex", flexDirection: "column", gap: "6px" },
  finding: { borderRadius: "6px", padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: "10px", background: "#0f1e35", border: "1px solid" },
  badge: { fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", letterSpacing: "0.06em", whiteSpace: "nowrap" as const, marginTop: "1px", flexShrink: 0, border: "1px solid", fontFamily: "'IBM Plex Mono', monospace" },
  findingBody: { flex: 1, minWidth: 0 },
  findingTitle: { fontSize: "12px", fontWeight: 600, color: "#e8edf5", marginBottom: "2px" },
  findingDetail: { fontSize: "11px", color: "#8b9ab0", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'IBM Plex Mono', monospace" },
  findingRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 },
  findingTime: { fontSize: "10px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  findingConf: { fontSize: "10px", color: "#3fb950", fontWeight: 500 },
};

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#060d1a", color: "#e8edf5", fontFamily: "'IBM Plex Sans', sans-serif" },
  bgGrid: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(56,139,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(56,139,255,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" },

  hero: { position: "relative", zIndex: 1, paddingTop: "58px" },
  heroInner: { display: "flex", alignItems: "stretch", gap: "64px", maxWidth: "1600px", margin: "0 auto", padding: "80px 80px 72px" },
  heroLeft: { flex: 1 },
  heroRight: { flexShrink: 0, width: "520px" },

  heroLabel: { display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", fontWeight: 600, color: "#58a6ff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "24px", fontFamily: "'IBM Plex Mono', monospace" },
  heroLabelLine: { height: "1px", width: "28px", background: "#58a6ff", opacity: 0.4, display: "inline-block" },
  h1: { fontSize: "clamp(44px, 5vw, 72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#e8edf5", marginBottom: "24px" },
  h1Accent: { color: "#58a6ff" },
  heroSub: { fontSize: "18px", color: "#8b9ab0", lineHeight: 1.75, maxWidth: "560px", marginBottom: "44px" },
  ctaRow: { display: "flex", alignItems: "center", gap: "16px" },
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 600, color: "#fff", background: "#1a6ef5", border: "none", padding: "14px 28px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  heroMeta: { fontSize: "13px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },

  gridCard: { background: "#0c1628", border: "1px solid rgba(56,139,255,0.15)", borderRadius: "12px", overflow: "hidden", height: "100%" },
  gridHeader: { padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" },
  gridHeaderTitle: { fontSize: "13px", fontWeight: 600, color: "#e8edf5", display: "flex", alignItems: "center", gap: "8px" },
  gridHeaderSub: { fontSize: "11px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  tileGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(255,255,255,0.05)" },
  tile: { background: "#0a1525", padding: "22px 20px", transition: "background 0.15s", cursor: "default" },
  tileWide: { background: "#0a1525", padding: "22px 20px", gridColumn: "1 / -1", borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "default" },
  tileTag: { fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontFamily: "'IBM Plex Mono', monospace", marginBottom: "10px" },
  tileTitle: { fontSize: "14px", fontWeight: 700, color: "#e8edf5", marginBottom: "6px" },
  tileDesc: { fontSize: "12px", color: "#8b9ab0", lineHeight: 1.6 },

  statsBar: { position: "relative", zIndex: 1, display: "flex", width: "100%", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,20,37,0.8)" },
  stat: { flex: 1, padding: "28px 0 28px 64px", display: "flex", flexDirection: "column", gap: "6px" },
  statBorder: { borderRight: "1px solid rgba(255,255,255,0.06)" },
  statVal: { fontSize: "28px", fontWeight: 800, color: "#e8edf5", letterSpacing: "-0.02em", lineHeight: 1 },
  statLabel: { fontSize: "13px", color: "#4d5f75", lineHeight: 1.4 },

  previewSection: { position: "relative", zIndex: 1, maxWidth: "1600px", margin: "0 auto", padding: "56px 80px" },
  previewLabel: { fontSize: "11px", fontWeight: 500, color: "#4d5f75", letterSpacing: "0.08em", marginBottom: "14px", fontFamily: "'IBM Plex Mono', monospace" },

  section: { position: "relative", zIndex: 1, maxWidth: "1600px", margin: "0 auto", padding: "72px 80px" },
  sectionAlt: { position: "relative", zIndex: 1, background: "rgba(10,20,37,0.5)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "72px 0" },
  sectionInner: { maxWidth: "1600px", margin: "0 auto", padding: "0 80px" },
  sectionEyebrow: { fontSize: "11px", fontWeight: 600, color: "#58a6ff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px", display: "block", fontFamily: "'IBM Plex Mono', monospace" },
  sectionH2: { fontSize: "clamp(24px, 2.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#e8edf5", marginBottom: "12px" },
  sectionSub: { fontSize: "15px", color: "#8b9ab0", lineHeight: 1.65, maxWidth: "500px", marginBottom: "40px" },

  stepsRow: { display: "flex", alignItems: "stretch", marginTop: "40px", gap: "0" },
  step: { background: "#0c1628", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "28px 24px", textAlign: "center", flex: 1 },
  stepNum: { fontSize: "11px", fontWeight: 600, color: "#58a6ff", letterSpacing: "0.1em", marginBottom: "12px", fontFamily: "'IBM Plex Mono', monospace" },
  stepTitle: { fontSize: "14px", fontWeight: 600, color: "#e8edf5", marginBottom: "4px" },
  stepSub: { fontSize: "12px", color: "#4d5f75" },
  stepArrow: { padding: "0 16px", color: "#1e2d42", fontSize: "20px", display: "flex", alignItems: "center", flexShrink: 0 },

  featGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" },
  featCard: { background: "#060d1a", padding: "28px 24px" },
  featTag: { fontSize: "10px", fontWeight: 600, color: "#58a6ff", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px", fontFamily: "'IBM Plex Mono', monospace" },
  featTitle: { fontSize: "14px", fontWeight: 700, color: "#e8edf5", marginBottom: "8px" },
  featDesc: { fontSize: "13px", color: "#8b9ab0", lineHeight: 1.65 },

  ctaSection: { position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "64px 0" },
  ctaInner: { maxWidth: "1600px", margin: "0 auto", padding: "0 80px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "32px" },
  ctaH2: { fontSize: "clamp(20px, 2vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#e8edf5", marginBottom: "8px" },
  ctaSub: { fontSize: "14px", color: "#8b9ab0" },

  footer: { position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1600px", margin: "0 auto", padding: "20px 80px", borderTop: "1px solid rgba(255,255,255,0.04)" },
  footerText: { fontSize: "11px", color: "#2a3a50", fontFamily: "'IBM Plex Mono', monospace" },
};
