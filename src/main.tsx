import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { AdminPage } from "./components/AdminPage";
import "./styles/global.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error('Root container "#root" not found');
}

const isAdminRoute =
  window.location.pathname.replace(/\/+$/, "") === "/admin";

createRoot(container).render(
  <StrictMode>
    {isAdminRoute ? <AdminPage /> : <App />}
  </StrictMode>,
);