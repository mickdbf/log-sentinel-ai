import { useState } from "react";
import Navbar from "./components/Navbar";
import SplashPage from "./pages/SplashPage";
import Dashboard from "./pages/Dashboard";
import "./index.css";

type Page = "splash" | "dashboard";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [page, setPage] = useState<Page>("splash");
  const [triggerAuth, setTriggerAuth] = useState(false);

  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
    setPage("dashboard");
    setTriggerAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setPage("splash");
  };

  return (
    <div>
      {/* Navbar always visible on every page */}
      <Navbar
        token={token}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        currentPage={page}
        onNavigate={(p) => setPage(p as Page)}
        triggerOpen={triggerAuth}
        onTriggerConsumed={() => setTriggerAuth(false)}
      />

      {page === "splash" && (
        <SplashPage
          token={token}
          onEnterDashboard={() => setPage("dashboard")}
          onGetStarted={() => setTriggerAuth(true)}
        />
      )}

      {page === "dashboard" && token && (
        <Dashboard token={token} />
      )}
    </div>
  );
}
