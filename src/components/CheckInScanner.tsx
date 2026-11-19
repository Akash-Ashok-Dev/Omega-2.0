import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Html5Qrcode } from "html5-qrcode";

import { EVENTS } from "@/data/site";
import {
  extractTicketToken,
  formatTicketDate,
  type Ticket,
} from "@/lib/tickets";

const READER_ID = "omega-checkin-reader";
const QUEUE_KEY = "omega-checkin-queue";
const VOLUNTEER_KEY = "omega-checkin-volunteer";

type CheckInResult = "checked-in" | "duplicate" | "wrong-event" | "invalid";

type CheckInResponse = {
  result?: CheckInResult;
  ticket?: Ticket;
  error?: string;
};

type Stats = {
  total: number;
  checkedIn: number;
};

type Feedback = {
  kind: "success" | "warning" | "error" | "info";
  title: string;
  detail: string;
};

type QueuedScan = {
  token: string;
  eventId: string;
  volunteerName: string;
  scannedAt: string;
};

type CheckInScannerProps = {
  token: string;
  onUnauthorized: () => void;
};

function readQueue(): QueuedScan[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QueuedScan[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedScan[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

function readVolunteerName() {
  try {
    return localStorage.getItem(VOLUNTEER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function CheckInScanner({
  token,
  onUnauthorized,
}: CheckInScannerProps) {
  const [eventId, setEventId] = useState(EVENTS[0]?.id ?? "line-follower");
  const [volunteerName, setVolunteerName] = useState(readVolunteerName);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0 });
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<Ticket[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [queueCount, setQueueCount] = useState(() => readQueue().length);
  const [error, setError] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ token: string; at: number } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const checkingRef = useRef(false);
  const flushingRef = useRef(false);
  const onUnauthorizedRef = useRef(onUnauthorized);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    const name = volunteerName.trim();
    if (!name) return;
    try {
      localStorage.setItem(VOLUNTEER_KEY, name);
    } catch {
      return;
    }
  }, [volunteerName]);

  const showFeedback = useCallback((next: Feedback) => {
    setFeedback(next);
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(
      () => setFeedback(null),
      3500,
    );
  }, []);

  const queueScan = useCallback((scan: QueuedScan) => {
    const queue = readQueue();
    if (queue.some((item) => item.token === scan.token)) return true;
    queue.push(scan);
    if (!writeQueue(queue)) return false;
    setQueueCount(queue.length);
    return true;
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/check-in/stats?eventId=${encodeURIComponent(eventId)}`,
        { headers: { "x-admin-token": token } },
      );
      if (response.status === 401) {
        onUnauthorizedRef.current();
        return;
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) return;
      setStats({
        total: Number(body?.total ?? 0),
        checkedIn: Number(body?.checkedIn ?? 0),
      });
    } catch {
      return;
    }
  }, [eventId, token]);

  useEffect(() => {
    void fetchStats();
    const timer = window.setInterval(() => {
      void fetchStats();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [fetchStats]);

  useEffect(() => {
    setManualResults([]);
    setManualQuery("");
  }, [eventId]);

  const checkIn = useCallback(
    async (rawToken: string, scannedAt?: string) => {
      const ticketToken = extractTicketToken(rawToken);
      if (!ticketToken) return;

      const now = Date.now();
      if (
        lastScanRef.current &&
        lastScanRef.current.token === ticketToken &&
        now - lastScanRef.current.at < 3000
      ) {
        return;
      }
      lastScanRef.current = { token: ticketToken, at: now };

      if (checkingRef.current) return;
      checkingRef.current = true;
      setChecking(true);
      setError("");

      const payload = {
        token: ticketToken,
        eventId,
        volunteerName: volunteerName.trim(),
      };
      const queuedPayload: QueuedScan = {
        ...payload,
        scannedAt: scannedAt ?? new Date().toISOString(),
      };

      try {
        const response = await fetch("/api/admin/check-in", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          onUnauthorizedRef.current();
          return;
        }

        if (response.status >= 500) {
          if (!queueScan(queuedPayload)) {
            showFeedback({
              kind: "error",
              title: "OFFLINE SAVE FAILED",
              detail: "Could not store this scan. Check device storage.",
            });
            return;
          }
          showFeedback({
            kind: "warning",
            title: "SAVED OFFLINE",
            detail: "Server unavailable. Reconnect to sync this check-in.",
          });
          return;
        }

        const body = (await response.json().catch(() => null)) as
          | CheckInResponse
          | null;

        if (body?.ticket) {
          const checkedTicket = body.ticket;
          setManualResults((current) =>
            current.map((item) =>
              item.token === checkedTicket.token
                ? { ...item, ...checkedTicket }
                : item,
            ),
          );
        }

        if (response.status === 404 || body?.result === "invalid") {
          showFeedback({
            kind: "error",
            title: "INVALID TICKET",
            detail: body?.error ?? "Ticket not found.",
          });
          return;
        }

        if (body?.result === "wrong-event") {
          showFeedback({
            kind: "error",
            title: "WRONG EVENT",
            detail:
              body.error ?? "This ticket belongs to a different event.",
          });
          return;
        }

        if (body?.result === "duplicate") {
          const ticket = body.ticket;
          showFeedback({
            kind: "error",
            title: "ALREADY CHECKED IN",
            detail: `${ticket?.teamName ?? "Team"} · ${formatTicketDate(
              ticket?.checkedInAt ?? null,
            )}${ticket?.checkedInBy ? ` · ${ticket.checkedInBy}` : ""}`,
          });
          return;
        }

        if (!response.ok || body?.result !== "checked-in" || !body.ticket) {
          throw new Error(body?.error ?? "Check-in failed.");
        }

        const ticket = body.ticket;
        showFeedback({
          kind: "success",
          title: "CHECKED IN",
          detail: `${ticket.teamName} · ${ticket.leaderName} · ${ticket.shortCode}`,
        });
        void fetchStats();
      } catch (caught) {
        if (!navigator.onLine || caught instanceof TypeError) {
          if (!queueScan(queuedPayload)) {
            showFeedback({
              kind: "error",
              title: "OFFLINE SAVE FAILED",
              detail: "Could not store this scan. Check device storage.",
            });
            return;
          }
          showFeedback({
            kind: "warning",
            title: "SAVED OFFLINE",
            detail: "Reconnect to sync this check-in.",
          });
          return;
        }

        showFeedback({
          kind: "error",
          title: "CHECK-IN FAILED",
          detail:
            caught instanceof Error ? caught.message : "Please try again.",
        });
      } finally {
        checkingRef.current = false;
        setChecking(false);
      }
    },
    [eventId, fetchStats, queueScan, showFeedback, token, volunteerName],
  );

  const flushQueue = useCallback(async () => {
    if (flushingRef.current || !navigator.onLine) return;

    const queue = readQueue();
    if (queue.length === 0) return;

    flushingRef.current = true;
    const remaining: QueuedScan[] = [];

    try {
      for (const item of queue) {
        try {
          const response = await fetch("/api/admin/check-in", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-token": token,
            },
            body: JSON.stringify(item),
          });

          if (response.status === 401) {
            onUnauthorizedRef.current();
            return;
          }

          if (!response.ok) {
            const body = await response.json().catch(() => null);
            if (response.status >= 500) {
              remaining.push(item);
            } else {
              showFeedback({
                kind: "warning",
                title: "SCAN SKIPPED",
                detail: body?.error ?? "Could not sync one offline scan.",
              });
            }
          }
        } catch {
          remaining.push(item);
        }
      }

      if (!writeQueue(remaining)) {
        showFeedback({
          kind: "error",
          title: "QUEUE UPDATE FAILED",
          detail: "Could not update the offline queue. Check device storage.",
        });
        return;
      }
      setQueueCount(remaining.length);
      if (remaining.length === 0) {
        void fetchStats();
      }
    } finally {
      flushingRef.current = false;
    }
  }, [fetchStats, showFeedback, token]);

  useEffect(() => {
    void flushQueue();
    const handleOnline = () => {
      void flushQueue();
    };
    const timer = window.setInterval(() => {
      void flushQueue();
    }, 30000);
    window.addEventListener("online", handleOnline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", handleOnline);
    };
  }, [flushQueue]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    scannerRef.current = null;
    try {
      await scanner.stop();
    } catch {
      // The scanner may already be stopped.
    }
    try {
      scanner.clear();
    } catch {
      // The reader may already be detached.
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current || starting) return;

    setCameraError("");
    setStarting(true);

    try {
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.max(
              180,
              Math.floor(Math.min(width, height) * 0.7),
            );
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        (decodedText) => {
          void checkIn(decodedText);
        },
        () => undefined,
      );
      setScanning(true);
    } catch (caught) {
      scannerRef.current = null;
      setScanning(false);
      setCameraError(
        caught instanceof Error
          ? caught.message
          : "Could not start the camera. Check browser permissions.",
      );
    } finally {
      setStarting(false);
    }
  }, [checkIn, starting]);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .catch(() => undefined)
          .finally(() => {
            try {
              scanner.clear();
            } catch {
              return;
            }
          });
      }
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  async function handleManualSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = manualQuery.trim();
    if (!value || manualLoading) return;

    setManualLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ query: value, eventId });
      const response = await fetch(
        `/api/admin/check-in/search?${params.toString()}`,
        { headers: { "x-admin-token": token } },
      );

      if (response.status === 401) {
        onUnauthorizedRef.current();
        return;
      }

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error ?? "Could not search registrations.");
      }

      setManualResults((body?.results ?? []) as Ticket[]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not search registrations.",
      );
    } finally {
      setManualLoading(false);
    }
  }

  const progress = stats.total
    ? Math.min(100, Math.round((stats.checkedIn / stats.total) * 100))
    : 0;

  return (
    <section className="checkin">
      <header className="checkin__head">
        <div>
          <p className="eyebrow">CHECK-IN / SCANNER</p>
          <h2>Scan tickets</h2>
          <p className="admin__subtitle">
            Live check-in for the selected event. Works on phone and desktop.
          </p>
        </div>

        <div className="checkin__controls">
          <label>
            Event
            <select
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              disabled={scanning}
            >
              {EVENTS.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Volunteer
            <input
              type="text"
              value={volunteerName}
              onChange={(event) => setVolunteerName(event.target.value)}
              placeholder="Your name"
              maxLength={120}
              disabled={scanning}
            />
          </label>
        </div>
      </header>

      <div className="checkin-stats">
        <article className="checkin-stat">
          <small>CHECKED IN</small>
          <strong>
            {stats.checkedIn} / {stats.total}
          </strong>
        </article>
        <div className="checkin-progress" aria-label={`${progress}% checked in`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <article className="checkin-stat">
          <small>QUEUED OFFLINE</small>
          <strong>{queueCount}</strong>
          {queueCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!navigator.onLine) {
                  showFeedback({
                    kind: "warning",
                    title: "STILL OFFLINE",
                    detail: "Reconnect to sync queued check-ins.",
                  });
                  return;
                }
                void flushQueue();
              }}
            >
              Sync now
            </button>
          )}
        </article>
      </div>

      <div className="checkin__grid">
        <div className="checkin-camera">
          <div id={READER_ID} className="checkin-reader" />
          <div className="checkin-camera__actions">
            {scanning ? (
              <button type="button" onClick={() => void stopScanner()}>
                Stop camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startScanner()}
                disabled={starting}
              >
                {starting ? "Starting…" : "Start camera"}
              </button>
            )}
          </div>
          {cameraError && (
            <p className="admin-error" role="alert">
              {cameraError}
            </p>
          )}
          <p className="checkin-hint">
            Point the camera at the participant's QR code. Ask them to turn
            their screen brightness up.
          </p>
        </div>

        <div className="checkin-manual">
          <h3>Manual check-in</h3>
          <form onSubmit={handleManualSearch}>
            <input
              type="search"
              value={manualQuery}
              onChange={(event) => setManualQuery(event.target.value)}
              placeholder="Name, team, mobile, short code…"
              aria-label="Search tickets for manual check-in"
            />
            <button type="submit" disabled={manualLoading}>
              {manualLoading ? "Searching…" : "Search"}
            </button>
          </form>

          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}

          {manualResults.length > 0 && (
            <ul className="checkin-results">
              {manualResults.map((result) => (
                <li key={result.token}>
                  <div>
                    <strong>{result.teamName}</strong>
                    <span>
                      {result.leaderName} · {result.shortCode}
                      {result.leaderMobile ? ` · ${result.leaderMobile}` : ""}
                    </span>
                    <span>
                      {result.checkedIn
                        ? `Checked in ${formatTicketDate(result.checkedInAt)}`
                        : "Not checked in"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={result.checkedIn || checking}
                    onClick={() => void checkIn(result.token)}
                  >
                    {result.checkedIn ? "Done" : "Check in"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {manualResults.length === 0 &&
            manualQuery.trim() &&
            !manualLoading &&
            !error && (
              <p className="checkin-hint">
                No matching tickets for this event.
              </p>
            )}
        </div>
      </div>

      {feedback && (
        <button
          type="button"
          className={`checkin-feedback checkin-feedback--${feedback.kind}`}
          onClick={() => setFeedback(null)}
          aria-live="assertive"
        >
          <span className="checkin-feedback__title">{feedback.title}</span>
          <span className="checkin-feedback__detail">{feedback.detail}</span>
          <span className="checkin-feedback__hint">Tap to dismiss</span>
        </button>
      )}
    </section>
  );
}

export default CheckInScanner;
