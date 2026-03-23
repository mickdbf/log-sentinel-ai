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
    desc: "Upload .log or .txt files. The backend extracts timestamps, IPs, ports, and raw events from every line.",
  },
  {
    tag: "Detection",
    title: "LLM-powered analysis",
    desc: "Structured events are sent to AI which reasons over the full log to surface threats, anomalies, and suspicious patterns.",
  },
  {
    tag: "Timeline",
    title: "Event reconstruction",
    desc: "Key events are ordered chronologically so analysts can trace exactly what happened and in what sequence.",
  },
  {
    tag: "Output",
    title: "Ranked findings",
    desc: "Every analysis returns a threat summary, findings ranked by severity with confidence scores, and extracted IOCs.",
  },
];

const STEPS = [
  { num: "01", title: "Upload a log file", sub: ".log or .txt" },
  { num: "02", title: "Backend parses events", sub: "Extracts structured fields" },
  { num: "03", title: "LLM analyzes", sub: "Identifies anomalies" },
  { num: "04", title: "Review findings", sub: "Ranked by severity" },
];

const STATS = [
  { val: "10x", label: "Faster than manual log review" },
  { val: "100%", label: "Event coverage — no sampling" },
  { val: "AI", label: "Powered anomaly detection" },
  { val: "IOC", label: "Extraction on every run" },
];

function DashboardPreview() {
  const [activeView, setActiveView] = useState<"summary" | "timeline" | "iocs">("summary");

  const views = [
    { id: "summary" as const, label: "Threat summary" },
    { id: "timeline" as const, label: "Event timeline" },
    { id: "iocs" as const, label: "IOCs" },
  ];

  return (
    <div style={p.card}>
      <div style={p.sidebar}>
        <div style={p.sbLogo}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#58a6ff" strokeWidth="1.2" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="#58a6ff"/>
          </svg>
          <span style={p.sbLogoName}>LogSentinel</span>
          <span style={p.sbLogoBadge}>AI</span>
        </div>
        <div style={p.sbSection}>Analysis</div>
        {views.map(v => (
          <div key={v.id}
            className="preview-sb-item"
            onClick={() => setActiveView(v.id)}
            style={{ ...p.sbItem, ...(activeView === v.id ? p.sbItemActive : {}), cursor: "pointer", transition: "all 0.15s" }}>
            <span style={{ fontSize: "6px", color: activeView === v.id ? "#58a6ff" : "#2a3a50", flexShrink: 0 }}>●</span>
            {v.label}
          </div>
        ))}
        <div style={p.sbSection}>History</div>
        <div style={p.sbItem}>
          <span style={{ fontSize: "6px", color: "#2a3a50", flexShrink: 0 }}>●</span>
          Past analyses
        </div>
        <button style={p.sbUpload}>+ Upload new log</button>
      </div>

      <div style={p.main}>
        <div style={p.mainTop}>
          <div>
            <div style={p.mainTitle}>
              {activeView === "summary" ? "Threat summary" : activeView === "timeline" ? "Event timeline" : "IOCs"}
            </div>
            <div style={p.mainMeta}>auth_logs_2024-11-22.log · 72 events · 24.1s</div>
          </div>
          <div style={p.fileChip}>Detected log type: auth log</div>
        </div>

        {activeView === "summary" && (
          <>
            <div style={p.kpiRow}>
              {[
                { n: "3", color: "#f85149", label: "Critical" },
                { n: "2", color: "#e3b341", label: "Warnings" },
                { n: "5", color: "#58a6ff", label: "IOCs found" },
                { n: "72", color: "#3fb950", label: "Events reviewed" },
              ].map(k => (
                <div key={k.label} style={p.kpi}>
                  <div style={{ ...p.kpiN, color: k.color }}>{k.n}</div>
                  <div style={p.kpiL}>{k.label}</div>
                </div>
              ))}
            </div>
            <div style={p.summaryBox}>
              <div style={p.summaryLabel}>AI threat summary</div>
              <div style={p.summaryText}>
                A significant incident occurred involving brute force followed by a successful login and malicious command execution. User 'jsmith' logged in after 27 failed attempts and executed a script from a suspicious external IP (185.220.101.47).
              </div>
            </div>
            <div style={p.findingsHeader}>
              <span style={p.findingsTitle}>Findings</span>
              <span style={p.findingsMeta}>5 total · critical first</span>
            </div>
            <div style={p.findings}>
              {[
                { sev: "CRIT", borderColor: "rgba(248,81,73,0.2)", badgeStyle: { color: "#f85149", background: "rgba(248,81,73,0.12)", borderColor: "rgba(248,81,73,0.3)" }, title: "Successful login after brute force", detail: "user: jsmith · src: 192.168.1.45:22 · failures: 27 · then: suspicious commands", time: "03:14:22", conf: "0.94" },
                { sev: "CRIT", borderColor: "rgba(248,81,73,0.2)", badgeStyle: { color: "#f85149", background: "rgba(248,81,73,0.12)", borderColor: "rgba(248,81,73,0.3)" }, title: "Data exfiltration via SCP", detail: "user: dbadmin · COMMAND=/usr/bin/mysqldump · dst: 185.220.101.47", time: "03:31:07", conf: "0.95" },
                { sev: "WARN", borderColor: "rgba(227,179,65,0.18)", badgeStyle: { color: "#e3b341", background: "rgba(227,179,65,0.1)", borderColor: "rgba(227,179,65,0.3)" }, title: "Brute force from external IP", detail: "src: 192.168.1.45:22 · targets: admin, root, ubuntu · failures: 27", time: "02:58:11", conf: "0.85" },
              ].map((f, i) => (
                <div key={i} style={{ ...p.finding, borderColor: f.borderColor }}>
                  <span style={{ ...p.badge, ...f.badgeStyle }}>{f.sev}</span>
                  <div style={p.findingBody}>
                    <div style={p.findingTitle}>{f.title}</div>
                    <div style={p.findingDetail}>{f.detail}</div>
                  </div>
                  <div style={p.findingRight}>
                    <div style={p.findingTime}>{f.time}</div>
                    <div style={p.findingConfLabel}>confidence</div>
                    <div style={p.findingConf}>{f.conf}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeView === "timeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { time: "02:58:11", desc: "Brute force begins — 27 failed logins from 192.168.1.45:22", sev: "warning" },
              { time: "03:14:22", desc: "Successful login as jsmith from 192.168.1.45:22 after repeated failures", sev: "critical" },
              { time: "03:14:45", desc: "jsmith escalates to root via sudo", sev: "critical" },
              { time: "03:15:02", desc: "wget executed — script downloaded from 185.220.101.47", sev: "critical" },
              { time: "03:31:07", desc: "dbadmin logs in from external IP 203.0.113.9:22", sev: "warning" },
              { time: "03:31:44", desc: "mysqldump executed — full database exported", sev: "critical" },
              { time: "03:32:01", desc: "SCP transfer to 185.220.101.47 — possible exfiltration", sev: "critical" },
              { time: "03:45:00", desc: "Connection from 192.168.1.45 closed", sev: "info" },
            ].map((e, i, arr) => (
              <div key={i} style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", marginTop: "3px", flexShrink: 0, background: e.sev === "critical" ? "#f85149" : e.sev === "warning" ? "#e3b341" : "#8b949e" }} />
                  {i < arr.length - 1 && <div style={{ width: "1px", flex: 1, background: "rgba(255,255,255,0.06)", margin: "3px 0", minHeight: "16px" }} />}
                </div>
                <div style={{ paddingBottom: "10px", flex: 1 }}>
                  <div style={{ fontSize: "10px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "2px" }}>{e.time}</div>
                  <div style={{ fontSize: "11px", color: "#c8d3e0", lineHeight: 1.5 }}>{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === "iocs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "#58a6ff", letterSpacing: "0.12em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "6px", paddingBottom: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>IP</div>
              {[
                { value: "192.168.1.45:22", context: "Source of brute force attack — 27 failed attempts before successful login" },
                { value: "185.220.101.47", context: "Known malicious IP — used for script download and data exfiltration destination" },
                { value: "203.0.113.9:22", context: "External IP used by dbadmin for unauthorized access" },
              ].map((ioc, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", padding: "8px 10px", background: "#0f1e35", borderRadius: "5px", marginBottom: "4px" }}>
                  <div style={{ fontSize: "11px", color: "#e8edf5", fontFamily: "'IBM Plex Mono', monospace" }}>{ioc.value}</div>
                  <div style={{ fontSize: "11px", color: "#8b9ab0" }}>{ioc.context}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "#58a6ff", letterSpacing: "0.12em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "6px", paddingBottom: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>USER</div>
              {[
                { value: "jsmith", context: "Account compromised after brute force — executed malicious commands as root" },
                { value: "dbadmin", context: "Logged in from external IP and performed database dump followed by exfiltration" },
              ].map((ioc, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", padding: "8px 10px", background: "#0f1e35", borderRadius: "5px", marginBottom: "4px" }}>
                  <div style={{ fontSize: "11px", color: "#e8edf5", fontFamily: "'IBM Plex Mono', monospace" }}>{ioc.value}</div>
                  <div style={{ fontSize: "11px", color: "#8b9ab0" }}>{ioc.context}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
        .preview-sb-item:hover { background: rgba(255,255,255,0.04); color: #8b9ab0 !important; }
      `}</style>
      <div style={s.bgGrid} />

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
              LogSentinel parses text-based log files, extracts structured events, and uses AI to surface anomalies, suspicious patterns, and key indicators — turning hours of manual log review into minutes.
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
                  { tag: "Critical", tagColor: "#f85149", title: "Attack patterns", desc: "Brute force, credential stuffing, privilege escalation, malware execution — identified by behavior and context." },
                  { tag: "Warning", tagColor: "#e3b341", title: "Behavioral anomalies", desc: "Off-hours access, unusual user behavior, policy violations, and deviations from normal patterns." },
                  { tag: "Extraction", tagColor: "#58a6ff", title: "IOC extraction", desc: "Suspicious IPs with ports, compromised usernames, malicious domains and commands — surfaced automatically." },
                  { tag: "Timeline", tagColor: "#3fb950", title: "Event timeline", desc: "Every notable event in chronological order so analysts can trace what happened from start to finish." },
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
                  <div style={s.tileDesc}>A plain-language summary of all findings ranked by severity with confidence scores — ready to action immediately.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={s.statsBar}>
        {STATS.map((stat, i) => (
          <div key={stat.label} style={{ ...s.stat, ...(i < STATS.length - 1 ? s.statBorder : {}) }}>
            <div style={s.statVal}>{stat.val}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <section style={s.previewSection}>
        <div style={s.previewLabel}>// analyst dashboard — live analysis view</div>
        <DashboardPreview />
      </section>

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

      <section style={s.ctaSection}>
        <div style={s.ctaInner}>
          <div>
            <h2 style={s.ctaH2}>Ready to triage your logs?</h2>
            <p style={s.ctaSub}>Sign in and upload a log file to get a full threat analysis.</p>
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
  card: { background: "#0a1525", border: "1px solid rgba(56,139,255,0.12)", borderRadius: "12px", overflow: "hidden", display: "grid", gridTemplateColumns: "190px 1fr" },
  sidebar: { background: "#07101e", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "18px 12px", display: "flex", flexDirection: "column", gap: "2px" },
  sbLogo: { display: "flex", alignItems: "center", gap: "8px", padding: "0 8px", marginBottom: "20px" },
  sbLogoName: { fontSize: "13px", fontWeight: 700, color: "#e8edf5" },
  sbLogoBadge: { fontSize: "9px", fontWeight: 600, background: "rgba(56,139,255,0.15)", color: "#58a6ff", border: "1px solid rgba(56,139,255,0.3)", padding: "1px 5px", borderRadius: "3px" },
  sbSection: { fontSize: "10px", fontWeight: 600, color: "#2a3a50", letterSpacing: "0.1em", textTransform: "uppercase" as const, padding: "0 8px", margin: "10px 0 4px", fontFamily: "'IBM Plex Mono', monospace" },
  sbItem: { fontSize: "12px", padding: "6px 8px", borderRadius: "4px", color: "#4d5f75", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  sbItemActive: { background: "rgba(56,139,255,0.1)", color: "#58a6ff", fontWeight: 500 },
  sbUpload: { marginTop: "auto", fontSize: "12px", fontWeight: 600, color: "#fff", background: "#1a6ef5", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit", textAlign: "center" as const },
  main: { padding: "18px 22px", display: "flex", flexDirection: "column", gap: "12px" },
  mainTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  mainTitle: { fontSize: "13px", fontWeight: 600, color: "#e8edf5", marginBottom: "3px" },
  mainMeta: { fontSize: "11px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  fileChip: { fontSize: "10px", color: "#58a6ff", background: "rgba(56,139,255,0.08)", border: "1px solid rgba(56,139,255,0.2)", padding: "3px 8px", borderRadius: "3px", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" as const },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" },
  kpi: { background: "#0f1e35", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "10px 12px" },
  kpiN: { fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" },
  kpiL: { fontSize: "9px", color: "#4d5f75", marginTop: "2px", fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  summaryBox: { background: "#0c1628", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "12px 14px" },
  summaryLabel: { fontSize: "9px", fontWeight: 600, color: "#4d5f75", letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "'IBM Plex Mono', monospace", marginBottom: "8px" },
  summaryText: { fontSize: "12px", color: "#c8d3e0", lineHeight: 1.65 },
  findingsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  findingsTitle: { fontSize: "12px", fontWeight: 600, color: "#e8edf5" },
  findingsMeta: { fontSize: "10px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  findings: { display: "flex", flexDirection: "column", gap: "5px" },
  finding: { borderRadius: "5px", padding: "9px 11px", display: "flex", alignItems: "flex-start", gap: "9px", background: "#0f1e35", border: "1px solid" },
  badge: { fontSize: "8px", fontWeight: 700, padding: "2px 5px", borderRadius: "2px", letterSpacing: "0.06em", whiteSpace: "nowrap" as const, marginTop: "1px", flexShrink: 0, border: "1px solid", fontFamily: "'IBM Plex Mono', monospace" },
  findingBody: { flex: 1, minWidth: 0 },
  findingTitle: { fontSize: "11px", fontWeight: 600, color: "#e8edf5", marginBottom: "2px" },
  findingDetail: { fontSize: "10px", color: "#8b9ab0", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'IBM Plex Mono', monospace" },
  findingRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px", flexShrink: 0 },
  findingTime: { fontSize: "9px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  findingConfLabel: { fontSize: "8px", color: "#4d5f75", letterSpacing: "0.05em", textTransform: "uppercase" as const, fontFamily: "'IBM Plex Mono', monospace" },
  findingConf: { fontSize: "11px", fontWeight: 600, color: "#f85149", fontFamily: "'IBM Plex Mono', monospace" },
};

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#060d1a", color: "#e8edf5", fontFamily: "'IBM Plex Sans', sans-serif" },
  bgGrid: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(56,139,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(56,139,255,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" },
  hero: { position: "relative", zIndex: 1, paddingTop: "58px" },
  heroInner: { display: "flex", alignItems: "center", gap: "64px", maxWidth: "1600px", margin: "0 auto", padding: "60px 80px 60px" },
  heroLeft: { flex: 1 },
  heroRight: { flexShrink: 0, width: "520px" },
  heroLabel: { display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", fontWeight: 600, color: "#58a6ff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "24px", fontFamily: "'IBM Plex Mono', monospace" },
  heroLabelLine: { height: "1px", width: "28px", background: "#58a6ff", opacity: 0.4, display: "inline-block" },
  h1: { fontSize: "clamp(44px, 5vw, 72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#e8edf5", marginBottom: "24px" },
  h1Accent: { color: "#58a6ff" },
  heroSub: { fontSize: "18px", color: "#8b9ab0", lineHeight: 1.75, maxWidth: "620px", marginBottom: "36px" },
  ctaRow: { display: "flex", alignItems: "center", gap: "16px" },
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 600, color: "#fff", background: "#1a6ef5", border: "none", padding: "14px 28px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  heroMeta: { fontSize: "13px", color: "#4d5f75", fontFamily: "'IBM Plex Mono', monospace" },
  gridCard: { background: "#0c1628", border: "1px solid rgba(56,139,255,0.15)", borderRadius: "12px", overflow: "hidden" },
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