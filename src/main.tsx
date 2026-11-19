import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { AdminPage } from "./components/AdminPage";
import { TicketPage } from "./components/TicketPage";
import "./styles/global.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error('Root container "#root" not found');
}

const path = window.location.pathname.replace(/\/+$/, "");
const isAdminRoute = path === "/admin";
const ticketMatch = path.match(/^\/ticket\/([^/]+)$/);
const isTicketRoute = path === "/ticket" || Boolean(ticketMatch);

function decodeTicketToken(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

createRoot(container).render(
  <StrictMode>
    {isAdminRoute ? (
      <AdminPage />
    ) : isTicketRoute ? (
      <TicketPage
        token={ticketMatch ? decodeTicketToken(ticketMatch[1]) : ""}
      />
    ) : (
      <App />
    )}
  </StrictMode>,
);