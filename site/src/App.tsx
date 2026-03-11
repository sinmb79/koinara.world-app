import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useSitePortal } from "./state/SitePortalContext";
import { DocsPage } from "./pages/DocsPage";
import { DownloadPage } from "./pages/DownloadPage";
import { GuidePage } from "./pages/GuidePage";
import { HomePage } from "./pages/HomePage";
import { NetworkPage } from "./pages/NetworkPage";

const navigationItems = [
  {
    to: "/",
    label: "Home",
    title: "Web submit dApp",
    description: "Deposit, compose, open the swarm, and inspect proof."
  },
  {
    to: "/guide",
    label: "Guide",
    title: "How to submit a job",
    description: "Follow the deposit-first flow from wallet connect to final proof."
  },
  {
    to: "/download",
    label: "Download",
    title: "App and node releases",
    description: "Install the desktop client and the independent node software."
  },
  {
    to: "/docs",
    label: "Docs",
    title: "Protocol and operator docs",
    description: "Read protocol notes, discovery specs, and operator references."
  },
  {
    to: "/network",
    label: "Network",
    title: "Live network dashboard",
    description: "Inspect chain activity, token profiles, and participant counts."
  }
] as const;

export function App() {
  const location = useLocation();
  const { activeSession, dashboardData, sessions, wallet } = useSitePortal();
  const currentPage =
    navigationItems.find((item) => isRouteSelected(item.to, location.pathname)) ?? navigationItems[0];
  const recentSessions = sessions.slice(0, 4);

  return (
    <div className="site-app-shell">
      <aside className="site-sidebar">
        <Link to="/" className="site-brand">
          KOINARA.WORLD
        </Link>

        <nav className="site-side-nav" aria-label="Primary">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `site-side-link ${isActive ? "active" : ""}`}
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </NavLink>
          ))}
        </nav>

        <section className="site-sidebar-section">
          <div className="site-sidebar-heading">
            <span className="sidebar-bullet" aria-hidden="true" />
            <strong>Recent runs</strong>
          </div>

          {recentSessions.length ? (
            <ul className="site-recent-list">
              {recentSessions.map((session) => (
                <li key={session.id}>
                  <strong>{session.prompt.slice(0, 48) || "Untitled request"}</strong>
                  <span>{session.networkLabel}</span>
                  <small>{session.lastKnownState}</small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="site-sidebar-empty">
              <strong>{dashboardData.networkLabel}</strong>
              <p>No local submissions yet. The sidebar will fall back to the live network view until you open your first run.</p>
            </div>
          )}
        </section>

        <section className="site-sidebar-status">
          <strong>{dashboardData.networkLabel}</strong>
          <p>{activeSession ? `Active run: ${activeSession.lastKnownState}` : "Ready to open a new run"}</p>
          <small>
            {dashboardData.status === "ready"
              ? "No backend. The browser reads chain state plus public discovery artifacts."
              : dashboardData.reason}
          </small>
        </section>
      </aside>

      <div className="site-main-shell">
        <header className="site-topbar">
          <div className="site-topbar-copy">
            <p className="site-eyebrow">{currentPage.title}</p>
            <h1>{currentPage.label}</h1>
          </div>

          <div className="site-topbar-actions">
            <span className="site-status-pill">{dashboardData.networkLabel}</span>
            <Link to="/" className="wallet-button">
              {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "Connect wallet"}
            </Link>
          </div>
        </header>

        <main className="site-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/network" element={<NetworkPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function isRouteSelected(route: string, pathname: string) {
  return route === "/" ? pathname === route : pathname.startsWith(route);
}
