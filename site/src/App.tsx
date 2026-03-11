import { NavLink, Route, Routes } from "react-router-dom";
import { DocsPage } from "./pages/DocsPage";
import { DownloadPage } from "./pages/DownloadPage";
import { HomePage } from "./pages/HomePage";
import { NetworkPage } from "./pages/NetworkPage";

export function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div>
          <p className="site-eyebrow">Official Website</p>
          <h1>Koinara network status, downloads, and docs.</h1>
        </div>
      </header>
      <nav className="site-nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/download">Download</NavLink>
        <NavLink to="/docs">Docs</NavLink>
        <NavLink to="/network">Network</NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/network" element={<NetworkPage />} />
        </Routes>
      </main>
    </div>
  );
}
