import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { EVENTS, PASSES_TYPE } from "@/data/site";

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

type Registration = {
  id: string;
  name: string;
  mobileNumber: string;
  mail: string;
  department: string;
  college: string;
  ambassadorCode: string;
  eventTitle: string;
  passTitle: string;
  paymentStatus: PaymentStatus;
  orderId: string | null;
  createdAt: string;
};

type Summary = Record<PaymentStatus, number>;

type ListResponse = {
  registrations: Registration[];
  count: number;
  summary: Summary;
};

const TOKEN_KEY = "omega-admin-token";
const STATUSES = ["ALL", "PENDING", "SUCCESS", "FAILED"] as const;
type StatusFilter = (typeof STATUSES)[number];

const EMPTY_SUMMARY: Summary = { PENDING: 0, SUCCESS: 0, FAILED: 0 };

function formatDate(value: string) {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const PASS_ORDER = EVENTS.flatMap((event) =>
  PASSES_TYPE.map((pass) => ({
    eventTitle: event.title,
    passTitle: pass.title,
  })),
);

function summarize(records: Registration[]): Summary {
  const result: Summary = { PENDING: 0, SUCCESS: 0, FAILED: 0 };
  for (const record of records) {
    result[record.paymentStatus] += 1;
  }
  return result;
}

type PassGroup = {
  eventTitle: string;
  passTitle: string;
  records: Registration[];
};

function groupByPass(records: Registration[]) {
  const groups = new Map<string, PassGroup>();
  const unassigned: Registration[] = [];

  for (const combo of PASS_ORDER) {
    groups.set(`${combo.eventTitle}|${combo.passTitle}`, {
      ...combo,
      records: [],
    });
  }
  for (const record of records) {
    const key = `${record.eventTitle}|${record.passTitle}`;
    const existing = groups.get(key);
    if (existing) {
      existing.records.push(record);
    } else {
      unassigned.push(record);
    }
  }

  return { groups: Array.from(groups.values()), unassigned };
}

const PAYMENT_STATUS_ORDER = ["PENDING", "SUCCESS", "FAILED"] as const;

type StatusGroupProps = {
  status: PaymentStatus;
  records: Registration[];
  updatingId: string | null;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
};

function StatusGroup({
  status,
  records,
  updatingId,
  onUpdateStatus,
}: StatusGroupProps) {
  return (
    <div className={`admin-status-group admin-status-group--${status}`}>
      <h3 className="admin-status-group__head">
        <span className={`admin-badge admin-badge--${status}`}>{status}</span>
        <span className="admin-status-group__count">{records.length}</span>
      </h3>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--pass">
          <thead>
            <tr>
              <th>Created</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Mail</th>
              <th>Dept</th>
              <th>College</th>
              <th>Ambassador</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className="admin-empty" colSpan={8}>
                  No {status.toLowerCase()} registrations.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="admin-table__muted">
                    {formatDate(record.createdAt)}
                  </td>
                  <td>{record.name}</td>
                  <td>{record.mobileNumber}</td>
                  <td>{record.mail}</td>
                  <td>{record.department}</td>
                  <td>{record.college}</td>
                  <td className="admin-table__muted">
                    {record.ambassadorCode || "—"}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {PAYMENT_STATUS_ORDER.filter(
                        (option) => option !== record.paymentStatus,
                      ).map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={updatingId === record.id}
                          onClick={() => onUpdateStatus(record.id, option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type PassSectionProps = {
  eventTitle: string;
  passTitle: string;
  index: number;
  records: Registration[];
  updatingId: string | null;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
};

function PassSection({
  eventTitle,
  passTitle,
  index,
  records,
  updatingId,
  onUpdateStatus,
}: PassSectionProps) {
  const stats = summarize(records);
  const grouped: Record<PaymentStatus, Registration[]> = {
    PENDING: [],
    SUCCESS: [],
    FAILED: [],
  };
  for (const record of records) {
    grouped[record.paymentStatus].push(record);
  }

  return (
    <section
      className="admin-pass"
      aria-label={`${eventTitle} ${passTitle} registrations`}
    >
      <header className="admin-pass__head">
        <div className="admin-pass__title">
          <p className="eyebrow">PASS / {String(index).padStart(2, "0")}</p>
          <h2>
            {eventTitle} / {passTitle}
          </h2>
        </div>
        <div className="admin-pass__stats">
          <span>
            <small>TOTAL</small>
            <strong>{records.length}</strong>
          </span>
          <span>
            <small>PENDING</small>
            <strong>{stats.PENDING}</strong>
          </span>
          <span>
            <small>SUCCESS</small>
            <strong>{stats.SUCCESS}</strong>
          </span>
          <span>
            <small>FAILED</small>
            <strong>{stats.FAILED}</strong>
          </span>
        </div>
      </header>

      {PAYMENT_STATUS_ORDER.map((status) => (
        <StatusGroup
          key={status}
          status={status}
          records={grouped[status]}
          updatingId={updatingId}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </section>
  );
}

type UnassignedSectionProps = {
  records: Registration[];
  updatingId: string | null;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
};

function UnassignedSection({
  records,
  updatingId,
  onUpdateStatus,
}: UnassignedSectionProps) {
  const grouped: Record<PaymentStatus, Registration[]> = {
    PENDING: [],
    SUCCESS: [],
    FAILED: [],
  };
  for (const record of records) {
    grouped[record.paymentStatus].push(record);
  }

  return (
    <section
      className="admin-pass admin-pass--legacy"
      aria-label="Unassigned registrations"
    >
      <header className="admin-pass__head">
        <div className="admin-pass__title">
          <p className="eyebrow">LEGACY / NO EVENT STORED</p>
          <h2>Unassigned records</h2>
          <p className="admin__subtitle">
            Saved before event tracking was added, so they do not belong to one
            of the 6 passes.
          </p>
        </div>
        <div className="admin-pass__stats">
          <span>
            <small>TOTAL</small>
            <strong>{records.length}</strong>
          </span>
        </div>
      </header>

      {PAYMENT_STATUS_ORDER.map((status) => (
        <StatusGroup
          key={status}
          status={status}
          records={grouped[status]}
          updatingId={updatingId}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </section>
  );
}

export function AdminPage() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) ?? "",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState<Registration[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/registrations?${params.toString()}`, {
        headers: { "x-admin-token": token },
      });
      const body = await response.json().catch(() => null);

      if (response.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setError("Session expired. Please log in again.");
        return;
      }
      if (!response.ok) {
        throw new Error(body?.error ?? "Could not load registrations.");
      }

      const data = body as ListResponse;
      setRecords(data.registrations ?? []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load registrations.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, status, search]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [refresh, token]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loggingIn) return;

    setError("");
    setLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Login failed.");
      }

      sessionStorage.setItem(TOKEN_KEY, body.token);
      setToken(body.token);
      setPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setRecords([]);
    setSummary(EMPTY_SUMMARY);
    setError("");
  }

  async function updateStatus(id: string, nextStatus: PaymentStatus) {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      const body = await response.json().catch(() => null);

      if (response.status === 401) {
        handleLogout();
        setError("Session expired. Please log in again.");
        return;
      }
      if (!response.ok) {
        throw new Error(body?.error ?? "Could not update status.");
      }

      const updated = body.registration as Registration;
      setRecords((current) =>
        current.map((record) => (record.id === id ? updated : record)),
      );
      void refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (!token) {
    return (
      <main className="admin-login">
        <div className="admin-login__card">
          <p className="eyebrow">OMEGA 2.0 / RESTRICTED</p>
          <h1>Admin access</h1>
          <p className="admin__subtitle">
            Enter your credentials to view registration records.
          </p>

          <form className="admin-login__form" onSubmit={handleLogin}>
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="admin__button admin__button--primary"
              type="submit"
              disabled={loggingIn}
            >
              {loggingIn ? "Checking…" : "Unlock ↗"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const total = summary.PENDING + summary.SUCCESS + summary.FAILED;
  const { groups, unassigned } = groupByPass(records);

  return (
    <main className="admin">
      <div className="admin__shell">
        <header className="admin__header">
          <div>
            <p className="eyebrow">OMEGA 2.0 / CONTROL ROOM</p>
            <h1 className="admin__title">Registrations</h1>
            <p className="admin__subtitle">
              {records.length} shown · live records from the server database
            </p>
          </div>
          <div className="admin__actions">
            <button
              className="admin__button admin__button--ghost"
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh ↻"}
            </button>
            <button
              className="admin__button admin__button--ghost"
              type="button"
              onClick={handleLogout}
            >
              Lock ✕
            </button>
          </div>
        </header>

        <section className="admin-stats" aria-label="Registration totals">
          <article className="admin-stat">
            <small>TOTAL</small>
            <strong>{total}</strong>
          </article>
          <article className="admin-stat">
            <small>PENDING</small>
            <strong>{summary.PENDING}</strong>
          </article>
          <article className="admin-stat">
            <small>SUCCESS</small>
            <strong>{summary.SUCCESS}</strong>
          </article>
          <article className="admin-stat">
            <small>FAILED</small>
            <strong>{summary.FAILED}</strong>
          </article>
        </section>

        <div className="admin-toolbar">
          <input
            type="search"
            placeholder="Search name, mail, mobile, college…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search registrations"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            aria-label="Filter by payment status"
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "ALL STATUSES" : option}
              </option>
            ))}
          </select>
          {loading && <span className="admin-loading">LOADING…</span>}
        </div>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}

        {groups.map((group, index) => (
          <PassSection
            key={`${group.eventTitle}|${group.passTitle}`}
            eventTitle={group.eventTitle}
            passTitle={group.passTitle}
            index={index + 1}
            records={group.records}
            updatingId={updatingId}
            onUpdateStatus={(id, nextStatus) =>
              void updateStatus(id, nextStatus)
            }
          />
        ))}

        {unassigned.length > 0 && (
          <UnassignedSection
            records={unassigned}
            updatingId={updatingId}
            onUpdateStatus={(id, nextStatus) =>
              void updateStatus(id, nextStatus)
            }
          />
        )}
      </div>
    </main>
  );
}

export default AdminPage;
