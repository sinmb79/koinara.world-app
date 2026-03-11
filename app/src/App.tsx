import { NavLink, Route, Routes } from "react-router-dom";
import { AppProvider, useAppContext } from "./state/AppContext";
import { HistoryPage } from "./pages/HistoryPage";
import { ResultPage } from "./pages/ResultPage";
import { StatusPage } from "./pages/StatusPage";
import { SubmitPage } from "./pages/SubmitPage";

function Layout() {
  const { wallet } = useAppContext();

  return (
    <div className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Koinara App</p>
          <h1>Submit inference jobs from your desktop and track on-chain consensus proof.</h1>
        </div>
        <div className="status-card">
          <div>Wallet mode: {wallet.mode}</div>
          <div>Address: {wallet.address ?? "none"}</div>
        </div>
      </header>
      <nav className="nav">
        <NavLink to="/">Submit</NavLink>
        <NavLink to="/status">Status</NavLink>
        <NavLink to="/result">Result</NavLink>
        <NavLink to="/history">History</NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<SubmitPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
