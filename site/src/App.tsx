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
    title: "Deposit and wallet",
    description: "Lock the deposit before opening a job request.",
    icon: "home"
  },
  {
    to: "/guide",
    label: "Guide",
    title: "Submit flow",
    description: "Walk through the full web submit sequence.",
    icon: "menu_book"
  },
  {
    to: "/download",
    label: "Download",
    title: "Desktop and node",
    description: "Install the desktop client and the node binary.",
    icon: "download"
  },
  {
    to: "/docs",
    label: "Docs",
    title: "Protocol references",
    description: "Read the protocol, discovery, and operator notes.",
    icon: "article"
  },
  {
    to: "/network",
    label: "Network",
    title: "Live chain dashboard",
    description: "Inspect participants, activity, and staged token rails.",
    icon: "public"
  }
] as const;

export function App() {
  const location = useLocation();
  const { activeSession, dashboardData, wallet } = useSitePortal();
  const currentPage =
    navigationItems.find((item) => isRouteSelected(item.to, location.pathname)) ?? navigationItems[0];

  return (
    <div className="site-app-shell">
      <aside className="site-sidebar">
        <Link to="/" className="site-brand">
          <span className="site-brand-mark material-symbols-outlined" aria-hidden="true">
            hub
          </span>
          <span className="site-brand-copy">
            <strong>KOINARA.WORLD</strong>
            <small>Swarm intelligence</small>
          </span>
        </Link>

        <nav className="site-side-nav" aria-label="Primary">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `site-side-link ${isActive ? "active" : ""}`}
            >
              <span className="material-symbols-outlined nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <div className="nav-copy">
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <section className="site-sidebar-status">
          <div className="profile-chip">
            <span className="material-symbols-outlined" aria-hidden="true">
              person
            </span>
          </div>
          <div className="profile-copy">
            <strong>{wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "Guest session"}</strong>
            <span>{activeSession ? `Active run: ${activeSession.lastKnownState}` : dashboardData.networkLabel}</span>
            <small>
              {dashboardData.status === "ready"
                ? "Browser reads chain state and public discovery artifacts."
                : dashboardData.reason}
            </small>
          </div>
        </section>
      </aside>

      <div className="site-main-shell">
        <header className="site-topbar">
          <div className="site-topbar-copy">
            <div className="site-topbar-heading">
              <span className="material-symbols-outlined topbar-icon" aria-hidden="true">
                view_kanban
              </span>
              <div>
                <p className="site-eyebrow">{currentPage.title}</p>
                <h1>{currentPage.label}</h1>
              </div>
            </div>
          </div>

          <div className="site-topbar-actions">
            <label className="site-search" aria-label="Search operations">
              <span className="material-symbols-outlined" aria-hidden="true">
                search
              </span>
              <input type="search" placeholder={location.pathname === "/network" ? "Search network..." : "Search operations..."} />
            </label>
            <button type="button" className="icon-button" aria-label="Notifications">
              <span className="material-symbols-outlined" aria-hidden="true">
                notifications
              </span>
            </button>
            <Link to="/" className="wallet-button">
              {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "Connect Wallet"}
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
