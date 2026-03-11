import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { SitePortalProvider } from "./state/SitePortalContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SitePortalProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SitePortalProvider>
  </React.StrictMode>
);
