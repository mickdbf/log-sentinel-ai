import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "../hooks/useMediaQuery";

interface NavbarProps {
  token: string | null;
  onAuthSuccess: (token: string) => void;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  triggerOpen?: boolean;
  onTriggerConsumed?: () => void;
}

type AuthMode = "login" | "register";

function getUsername(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || payload.sub || "analyst";
  } catch { return "analyst"; }
}

export default function Navbar({ token, onAuthSuccess, onLogout, currentPage, onNavigate, triggerOpen, onTriggerConsumed }: NavbarProps) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [formUser, setFormUser] = useState("");
  const [formPass, setFormPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const username = token ? getUsername(token) : "";
  const initials = username.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (triggerOpen && !token) {
      openModal("login");
      onTriggerConsumed?.();
    }
  }, [triggerOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile drawer if viewport grows past the mobile breakpoint
  useEffect(() => {
    if (!isMobile) setShowMobileMenu(false);
  }, [isMobile]);

  const handleSubmit = async () => {
    if (!formUser || !formPass) { setError("All fields are required"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formUser, password: formPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");
      localStorage.setItem("token", data.access_token);
      onAuthSuccess(data.access_token);
      setShowModal(false);
      setFormUser("");
      setFormPass("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (m: AuthMode) => { setMode(m); setError(""); setShowModal(true); setShowMobileMenu(false); };

  const handleLogout = () => {
    setShowDropdown(false);
    setShowMobileMenu(false);
    onLogout();
  };

  const handleMobileNavigate = (p: string) => {
    onNavigate(p);
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav style={{ ...s.nav, ...(isMobile ? s.navMobile : {}) }}>
        <div style={s.navLeft}>
          <div style={s.logo} onClick={() => onNavigate("splash")}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L19 6.5V15.5L11 20L3 15.5V6.5L11 2Z" stroke="#58a6ff" strokeWidth="1.5" fill="none"/>
              <path d="M11 6L17 9.5V16.5L11 20L5 16.5V9.5L11 6Z" fill="rgba(56,139,255,0.12)"/>
              <circle cx="11" cy="11" r="2.5" fill="#58a6ff"/>
            </svg>
            <span style={s.logoName}>LogSentinel</span>
            {!isMobile && <span style={s.logoBadge}>AI</span>}
          </div>

          {token && !isMobile && (
            <div style={s.navLinks}>
              <button
                style={{ ...s.navLink, ...(currentPage === "splash" ? s.navLinkActive : {}) }}
                onClick={() => onNavigate("splash")}
              >
                Overview
              </button>
              <button
                style={{ ...s.navLink, ...(currentPage === "dashboard" ? s.navLinkActive : {}) }}
                onClick={() => onNavigate("dashboard")}
              >
                Dashboard
              </button>
            </div>
          )}
        </div>

        <div style={s.navRight}>
          {isMobile ? (
            // Mobile — single hamburger toggle for both auth and nav-link states
            <button style={s.hamburgerBtn} onClick={() => setShowMobileMenu(v => !v)} aria-label="Toggle menu">
              {showMobileMenu ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="#e8edf5" strokeWidth="1.6" strokeLinecap="round"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="#e8edf5" strokeWidth="1.6" strokeLinecap="round"/></svg>
              )}
            </button>
          ) : token ? (
            // Logged in — show avatar with dropdown
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button style={s.avatarBtn} onClick={() => setShowDropdown(v => !v)}>
                <div style={s.avatar}>{initials}</div>
                <span style={s.avatarName}>{username}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#4d5f75", flexShrink: 0 }}>
                  <path d="M7 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.4 2.4l1.1 1.1M10.5 10.5l1.1 1.1M11.6 2.4l-1.1 1.1M3.5 10.5l-1.1 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>

              {showDropdown && (
                <div style={s.dropdown}>
                  <div style={s.dropdownHeader}>
                    <div style={s.dropdownName}>{username}</div>
                    <div style={s.dropdownRole}>SOC Analyst</div>
                  </div>
                  <div style={s.dropdownDivider} />
                  <button style={{ ...s.dropdownItem, ...s.dropdownItemDanger }} onClick={handleLogout}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2v9h3M9 9l3-3-3-3M12 6H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Logged out — show sign in / register
            <div style={s.navBtns}>
              <button style={s.btnGhost} onClick={() => openModal("login")}>Sign in</button>
              <button style={s.btnPrimary} onClick={() => openModal("register")}>Get started free</button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {isMobile && showMobileMenu && (
        <div style={s.mobileMenu}>
          {token ? (
            <>
              <button
                style={{ ...s.mobileNavLink, ...(currentPage === "splash" ? s.navLinkActive : {}) }}
                onClick={() => handleMobileNavigate("splash")}
              >
                Overview
              </button>
              <button
                style={{ ...s.mobileNavLink, ...(currentPage === "dashboard" ? s.navLinkActive : {}) }}
                onClick={() => handleMobileNavigate("dashboard")}
              >
                Dashboard
              </button>
              <div style={s.dropdownDivider} />
              <div style={s.mobileUserRow}>
                <div style={s.avatar}>{initials}</div>
                <div>
                  <div style={s.dropdownName}>{username}</div>
                  <div style={s.dropdownRole}>SOC Analyst</div>
                </div>
              </div>
              <button style={{ ...s.dropdownItem, ...s.dropdownItemDanger, padding: "10px 4px" }} onClick={handleLogout}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2v9h3M9 9l3-3-3-3M12 6H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sign out
              </button>
            </>
          ) : (
            <div style={s.mobileAuthBtns}>
              <button style={{ ...s.btnGhost, width: "100%", padding: "10px 14px", textAlign: "center" }} onClick={() => openModal("login")}>Sign in</button>
              <button style={{ ...s.btnPrimary, width: "100%", padding: "10px 14px", textAlign: "center" }} onClick={() => openModal("register")}>Get started free</button>
            </div>
          )}
        </div>
      )}

      {/* Auth modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={{ ...s.modal, ...(isMobile ? s.modalMobile : {}) }} onClick={e => e.stopPropagation()}>
            <div style={s.modalTop}>
              <div>
                <div style={s.modalTitle}>{mode === "login" ? "Sign in to LogSentinel" : "Create your account"}</div>
                <div style={s.modalSub}>{mode === "login" ? "Access your security dashboard" : "Start analyzing logs in minutes"}</div>
              </div>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div style={s.tabs}>
              <button style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
              <button style={{ ...s.tab, ...(mode === "register" ? s.tabActive : {}) }} onClick={() => { setMode("register"); setError(""); }}>Register</button>
            </div>

            <div style={s.fields}>
              <div style={s.field}>
                <label style={s.label}>Username</label>
                <input style={s.input} type="text" placeholder="Enter your username" value={formUser} onChange={e => setFormUser(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} autoFocus />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <input style={s.input} type="password" placeholder="Enter your password" value={formPass} onChange={e => setFormPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              </div>
            </div>

            {error && (
              <div style={s.errorBox}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="6" stroke="#f85149" strokeWidth="1.2"/><path d="M7 4v3M7 9.5v.5" stroke="#f85149" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <button style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? "Authenticating..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "58px", background: "rgba(6,13,26,0.96)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 },
  navMobile: { padding: "0 16px" },
  navLeft: { display: "flex", alignItems: "center", gap: "32px", minWidth: 0 },
  logo: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" },
  logoName: { fontSize: "15px", fontWeight: 700, color: "#e8edf5", letterSpacing: "-0.01em" },
  logoBadge: { fontSize: "10px", fontWeight: 600, background: "rgba(56,139,255,0.15)", color: "#58a6ff", border: "1px solid rgba(56,139,255,0.3)", padding: "1px 6px", borderRadius: "4px", letterSpacing: "0.04em" },
  navLinks: { display: "flex", gap: "4px" },
  navLink: { background: "none", border: "none", color: "#8b9ab0", fontSize: "14px", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  navLinkActive: { color: "#e8edf5", background: "rgba(255,255,255,0.06)" },
  navRight: { display: "flex", alignItems: "center" },
  navBtns: { display: "flex", alignItems: "center", gap: "8px" },

  // Avatar button
  avatarBtn: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "5px 10px 5px 6px", cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s" },
  avatar: { width: "26px", height: "26px", borderRadius: "50%", background: "#1a6ef5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 },
  avatarName: { fontSize: "13px", color: "#e8edf5", fontWeight: 500 },

  // Dropdown
  dropdown: { position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#0c1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", minWidth: "200px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 300, overflow: "hidden" },
  dropdownHeader: { padding: "14px 16px 10px" },
  dropdownName: { fontSize: "13px", fontWeight: 600, color: "#e8edf5", marginBottom: "2px" },
  dropdownRole: { fontSize: "11px", color: "#4d5f75" },
  dropdownDivider: { height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" },
  dropdownItem: { display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 16px", background: "none", border: "none", color: "#8b9ab0", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" },
  dropdownItemDanger: { color: "#f85149" },

  btnGhost: { background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#8b9ab0", fontSize: "13px", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  btnPrimary: { background: "#1a6ef5", border: "none", color: "#fff", fontSize: "13px", fontWeight: 600, padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },

  // Mobile hamburger + drawer
  hamburgerBtn: { background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" },
  mobileMenu: { position: "fixed", top: "58px", left: 0, right: 0, background: "#0c1628", borderBottom: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 99, padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: "4px" },
  mobileNavLink: { background: "none", border: "none", color: "#8b9ab0", fontSize: "15px", padding: "12px 4px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" },
  mobileUserRow: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 4px 4px" },
  mobileAuthBtns: { display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" },
  modal: { background: "#0c1628", border: "1px solid rgba(56,139,255,0.15)", borderRadius: "12px", padding: "28px", width: "400px", boxShadow: "0 8px 40px rgba(0,0,0,0.7)" },
  modalMobile: { width: "calc(100vw - 32px)", padding: "22px 18px" },
  modalTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  modalTitle: { fontSize: "17px", fontWeight: 700, color: "#e8edf5", marginBottom: "4px" },
  modalSub: { fontSize: "13px", color: "#8b9ab0" },
  closeBtn: { background: "none", border: "none", color: "#4d5f75", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" },
  tabs: { display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "24px" },
  tab: { background: "none", border: "none", borderBottom: "2px solid transparent", color: "#8b9ab0", fontSize: "13px", fontWeight: 500, padding: "8px 16px", cursor: "pointer", marginBottom: "-1px", fontFamily: "inherit" },
  tabActive: { color: "#e8edf5", borderBottomColor: "#1a6ef5" },
  fields: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: 500, color: "#8b9ab0", letterSpacing: "0.02em" },
  input: { background: "#060d1a", border: "1px solid rgba(255,255,255,0.1)", color: "#e8edf5", fontSize: "14px", padding: "9px 12px", borderRadius: "6px", width: "100%", fontFamily: "inherit" },
  errorBox: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#f85149", background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)", padding: "10px 12px", borderRadius: "6px", marginBottom: "16px" },
  submitBtn: { width: "100%", background: "#1a6ef5", color: "#fff", fontSize: "14px", fontWeight: 600, padding: "10px", borderRadius: "6px", cursor: "pointer", border: "none", fontFamily: "inherit", marginTop: "4px" },
};
