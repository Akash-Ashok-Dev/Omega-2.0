import { useCallback, useEffect, useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";

import { apiUrl } from "@/lib/api";
import {
  formatTicketDate,
  type Ticket,
} from "@/lib/tickets";

const TOKEN_KEY = "omega-ticket-token";

function readSavedToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    return;
  }
}

function clearSavedToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
}

type TicketPageProps = {
  token?: string;
};

type TicketResponse = {
  ticket?: Ticket;
  error?: string;
};

export function TicketPage({ token = "" }: TicketPageProps) {
  const [phase, setPhase] = useState<"loading" | "ticket" | "lookup">(
    "loading",
  );
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTicket = useCallback(
    async (value: string, fallbackToLookup = false) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          apiUrl(`/api/ticket/${encodeURIComponent(value)}`),
        );
        const body = (await response.json().catch(() => null)) as
          | TicketResponse
          | null;

        if (!response.ok) {
          if (fallbackToLookup && response.status === 404) {
            clearSavedToken();
            setError(
              "Your saved ticket was not found. Enter your details below.",
            );
            setPhase("lookup");
            return;
          }
          throw new Error(body?.error ?? "Ticket not found.");
        }

        const next = body?.ticket;
        if (!next) throw new Error("Ticket not found.");

        saveToken(next.token);
        setTicket(next);
        setPhase("ticket");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load your ticket.",
        );
        setPhase("lookup");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const saved = readSavedToken();
    const initial = token.trim() || saved;
    if (!initial) {
      setPhase("lookup");
      return;
    }
    void loadTicket(initial, true);
  }, [loadTicket, token]);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        apiUrl(`/api/ticket/lookup?query=${encodeURIComponent(value)}`),
      );
      const body = (await response.json().catch(() => null)) as
        | TicketResponse
        | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Ticket not found.");
      }

      const next = body?.ticket;
      if (!next) throw new Error("Ticket not found.");

      saveToken(next.token);
      setTicket(next);
      setPhase("ticket");
      setQuery("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not find your ticket.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetTicket() {
    clearSavedToken();
    setTicket(null);
    setError("");
    setPhase("lookup");
  }

  return (
    <main className="ticket-page">
      <div className="ticket-page__shell">
        <header className="ticket-page__header">
          <a className="ticket-page__brand" href="/">
            <img src="/Omega%20Logo.jpeg" alt="Omega 26" />
            <span>OMEGA 2.0 / TICKET</span>
          </a>
          <a className="ticket-page__back" href="/">
            Back to site ↗
          </a>
        </header>

        {phase === "loading" && (
          <section className="ticket-card ticket-card--message">
            <p className="eyebrow">TICKET / LOADING</p>
            <h1>Finding your pass…</h1>
          </section>
        )}

        {phase === "lookup" && (
          <section className="ticket-card ticket-card--message">
            <p className="eyebrow">TICKET / LOOKUP</p>
            <h1>Open your ticket.</h1>
            <p className="ticket-card__intro">
              Enter the registration ID, short code, leader email, or mobile
              number used during registration.
            </p>

            <form className="ticket-lookup" onSubmit={handleLookup}>
              <label>
                Registration ID, short code, email, or mobile
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="EVT42-7KQ9 or registration ID"
                  autoComplete="off"
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Searching…" : "Find ticket ↗"}
              </button>
            </form>

            {error && (
              <p className="ticket-card__error" role="alert">
                {error}
              </p>
            )}
          </section>
        )}

        {phase === "ticket" && ticket && (
          <section className="ticket-card">
            <div className="ticket-card__head">
              <div>
                <p className="eyebrow">
                  {ticket.eventTitle} / {ticket.passTitle}
                </p>
                <h1>{ticket.teamName}</h1>
                <p className="ticket-card__leader">Leader: {ticket.leaderName}</p>
              </div>
              <span
                className={`ticket-status${
                  ticket.checkedIn ? " ticket-status--in" : ""
                }`}
              >
                {ticket.checkedIn ? "CHECKED IN" : "READY TO SCAN"}
              </span>
            </div>

            <div className="ticket-card__body">
              <div className="ticket-qr">
                <QRCodeSVG
                  value={ticket.token}
                  size={320}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                  marginSize={2}
                  title={`Omega 2.0 ticket for ${ticket.teamName}`}
                />
              </div>

              <div className="ticket-card__details">
                <p className="ticket-card__label">SHORT CODE</p>
                <p className="ticket-card__short-code">{ticket.shortCode}</p>
                <p className="ticket-card__note">
                  Turn your screen brightness up when the volunteer scans this
                  code. If scanning fails, read out the short code.
                </p>
                <p className="ticket-card__note">
                  This ticket covers the whole team. Keep this page saved or use
                  the link below to reopen it.
                </p>
                <a className="ticket-card__link" href={ticket.ticketUrl}>
                  Open ticket link ↗
                </a>
                {ticket.checkedIn && (
                  <p className="ticket-card__checked">
                    Checked in {formatTicketDate(ticket.checkedInAt)}
                    {ticket.checkedInBy ? ` by ${ticket.checkedInBy}` : ""}.
                  </p>
                )}
              </div>
            </div>

            <footer className="ticket-card__footer">
              <button type="button" onClick={resetTicket}>
                Use a different ticket
              </button>
            </footer>
          </section>
        )}
      </div>
    </main>
  );
}
