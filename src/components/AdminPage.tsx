import {
  Fragment,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { EVENTS, PASSES_TYPE } from "@/data/site";
import { apiUrl } from "@/lib/api";
import { formatTicketDate } from "@/lib/tickets";

const CheckInScanner = lazy(() => import("@/components/CheckInScanner"));

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

type TeamMember = {
  id: string;
  position: number;
  name: string;
  mobileNumber: string;
  mail: string;
  department: string;
  college: string;
  rasId: string;
  ieeeId: string;
};

type Registration = {
  id: string;
  teamName: string;
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
  ticketToken: string;
  shortCode: string;
  eventId: string;
  userId: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedInBy: string | null;
  createdAt: string;
  members: TeamMember[];
};

type Summary = Record<PaymentStatus, number>;

type CheckInSummary = {
  total: number;
  checkedIn: number;
};

type ListResponse = {
  registrations: Registration[];
  count: number;
  summary: Summary;
  checkIn?: CheckInSummary;
};

const TOKEN_KEY = "omega-admin-token";
const STATUSES = ["ALL", "PENDING", "SUCCESS", "FAILED"] as const;
type StatusFilter = (typeof STATUSES)[number];

const EMPTY_SUMMARY: Summary = { PENDING: 0, SUCCESS: 0, FAILED: 0 };
const EMPTY_CHECK_IN: CheckInSummary = { total: 0, checkedIn: 0 };

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

function teamMembersOf(record: Registration): TeamMember[] {
  if (record.members?.length) return record.members;
  return [
    {
      id: `${record.id}-leader`,
      position: 1,
      name: record.name,
      mobileNumber: record.mobileNumber,
      mail: record.mail,
      department: record.department,
      college: record.college,
      rasId: "",
      ieeeId: "",
    },
  ];
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
  expandedId: string | null;
  onToggleRow: (id: string) => void;
};

function StatusGroup({
  status,
  records,
  updatingId,
  onUpdateStatus,
  expandedId,
  onToggleRow,
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
              <th>Check-in</th>
              <th>Team / Leader</th>
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
                <td className="admin-empty" colSpan={9}>
                  No {status.toLowerCase()} registrations.
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const isExpanded = expandedId === record.id;
                const members = teamMembersOf(record);

                return (
                  <Fragment key={record.id}>
                    <tr
                      className={`admin-table__row${
                        isExpanded ? " is-expanded" : ""
                      }`}
                      onClick={() => onToggleRow(record.id)}
                    >
                      <td className="admin-table__muted">
                        {formatTicketDate(record.createdAt)}
                      </td>
                      <td>
                        <span
                          className={`admin-checkin${
                            record.checkedIn ? " admin-checkin--yes" : ""
                          }`}
                        >
                          {record.checkedIn
                            ? `✓ ${
                                record.checkedInAt
                                  ? formatTicketDate(record.checkedInAt)
                                  : "IN"
                              }`
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-team__toggle"
                          aria-expanded={isExpanded}
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleRow(record.id);
                          }}
                        >
                          <span className="admin-team__name">
                            {record.teamName || record.name}
                          </span>
                          <span className="admin-team__leader">
                            {isExpanded ? "▾" : "▸"} Leader: {record.name} ·{" "}
                            {members.length} member
                            {members.length === 1 ? "" : "s"}
                          </span>
                        </button>
                      </td>
                      <td>{record.mobileNumber}</td>
                      <td>{record.mail}</td>
                      <td>{record.department}</td>
                      <td>{record.college}</td>
                      <td className="admin-table__muted">
                        {record.ambassadorCode || "—"}
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className="admin-row-actions">
                          {PAYMENT_STATUS_ORDER.filter(
                            (option) => option !== record.paymentStatus,
                          ).map((option) => (
                            <button
                              key={option}
                              type="button"
                              title={
                                option === "SUCCESS"
                                  ? "Confirm payment and issue ticket"
                                  : undefined
                              }
                              disabled={updatingId === record.id}
                              onClick={() => onUpdateStatus(record.id, option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="admin-table__details-row">
                        <td colSpan={9}>
                          <div className="admin-team-details">
                            <p className="admin-team-details__head">
                              TEAM MEMBERS / {members.length} OF 4
                            </p>
                            {record.checkedIn && (
                              <p className="admin-team-details__checkin">
                                CHECKED IN{" "}
                                {record.checkedInAt
                                  ? formatTicketDate(record.checkedInAt)
                                  : ""}
                                {record.checkedInBy
                                  ? ` BY ${record.checkedInBy}`
                                  : ""}
                              </p>
                            )}
                            <p className="admin-team-details__checkin">
                              {record.ticketToken
                                ? `TICKET ISSUED / ${record.shortCode}`
                                : "TICKET PENDING CONFIRMATION"}
                            </p>
                            <ul>
                              {members.map((member) => (
                                <li key={member.id}>
                                  <span className="admin-team-details__pos">
                                    {member.position === 1
                                      ? "LEADER"
                                      : `MEMBER ${member.position}`}
                                  </span>
                                  <span className="admin-team-details__name">
                                    {member.name}
                                  </span>
                                  <a href={`tel:${member.mobileNumber}`}>
                                    {member.mobileNumber}
                                  </a>
                                  <a href={`mailto:${member.mail}`}>
                                    {member.mail}
                                  </a>
                                  <span className="admin-team-details__meta">
                                    DEPT {member.department || "—"} · COLLEGE{" "}
                                    {member.college || "—"}
                                    {member.rasId
                                      ? ` · RAS ${member.rasId}`
                                      : ""}
                                    {member.ieeeId
                                      ? ` · IEEE ${member.ieeeId}`
                                      : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
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
  expandedId: string | null;
  onToggleRow: (id: string) => void;
};

function PassSection({
  eventTitle,
  passTitle,
  index,
  records,
  updatingId,
  onUpdateStatus,
  expandedId,
  onToggleRow,
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
          <span>
            <small>CHECKED IN</small>
            <strong>
              {records.filter((record) => record.checkedIn).length}
            </strong>
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
          expandedId={expandedId}
          onToggleRow={onToggleRow}
        />
      ))}
    </section>
  );
}

type UnassignedSectionProps = {
  records: Registration[];
  updatingId: string | null;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  expandedId: string | null;
  onToggleRow: (id: string) => void;
};

function UnassignedSection({
  records,
  updatingId,
  onUpdateStatus,
  expandedId,
  onToggleRow,
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
          expandedId={expandedId}
          onToggleRow={onToggleRow}
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
  const [checkInSummary, setCheckInSummary] =
    useState<CheckInSummary>(EMPTY_CHECK_IN);
  const [view, setView] = useState<"registrations" | "scanner">(
    "registrations",
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    setNotice("");

    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(
        apiUrl(`/api/registrations?${params.toString()}`),
        {
          headers: { "x-admin-token": token },
        },
      );
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
      setCheckInSummary(data.checkIn ?? EMPTY_CHECK_IN);
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
    if (!token || view === "scanner") return;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [refresh, token, view]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loggingIn) return;

    setError("");
    setNotice("");
    setLoggingIn(true);

    try {
      const response = await fetch(apiUrl("/api/admin/login"), {
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
    setCheckInSummary(EMPTY_CHECK_IN);
    setView("registrations");
    setError("");
    setNotice("");
    setExpandedId(null);
  }

  function toggleRow(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  async function handleDownloadBackup() {
    setError("");

    try {
      const response = await fetch(apiUrl("/api/admin/backup"), {
        headers: { "x-admin-token": token },
      });

      if (response.status === 401) {
        handleLogout();
        setError("Session expired. Please log in again.");
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not download database.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `omega-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not download database.",
      );
    }
  }

  async function updateStatus(id: string, nextStatus: PaymentStatus) {
    if (
      nextStatus === "SUCCESS" &&
      !window.confirm("Confirm this payment and issue the ticket?")
    ) {
      return;
    }

    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(apiUrl(`/api/registrations/${id}`), {
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
      if (body?.ticketIssued) {
        setNotice(
          body.emailSent
            ? "Ticket issued and emailed."
            : "Ticket issued, but email delivery failed.",
        );
      }
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
            <h1 className="admin__title">
              {view === "scanner" ? "Check-in" : "Registrations"}
            </h1>
            <p className="admin__subtitle">
              {view === "scanner"
                ? "Scan and verify tickets at the venue"
                : `${records.length} shown · live records from the server database`}
            </p>
          </div>
          <div className="admin__actions">
            {view === "registrations" && (
              <button
                className="admin__button admin__button--ghost"
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh ↻"}
              </button>
            )}
            <button
              className="admin__button admin__button--ghost"
              type="button"
              onClick={() => void handleDownloadBackup()}
            >
              Download DB ⤓
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

        <div className="admin-tabs" role="tablist" aria-label="Admin views">
          <button
            type="button"
            role="tab"
            aria-selected={view === "registrations"}
            className={view === "registrations" ? "is-active" : ""}
            onClick={() => setView("registrations")}
          >
            Registrations
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "scanner"}
            className={view === "scanner" ? "is-active" : ""}
            onClick={() => setView("scanner")}
          >
            Check-in scanner
          </button>
        </div>

        {view === "scanner" ? (
          <Suspense
            fallback={<p className="admin-loading">Loading scanner…</p>}
          >
            <CheckInScanner token={token} onUnauthorized={handleLogout} />
          </Suspense>
        ) : (
          <>
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
              <article className="admin-stat">
                <small>CHECKED IN</small>
                <strong>
                  {checkInSummary.checkedIn} / {checkInSummary.total}
                </strong>
              </article>
            </section>

            <div className="admin-toolbar">
              <input
                type="search"
                placeholder="Search team, leader, member, mail, mobile, short code…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search registrations"
              />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusFilter)
                }
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

            {notice && (
              <p className="admin-notice" role="status">
                {notice}
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
                expandedId={expandedId}
                onToggleRow={toggleRow}
              />
            ))}

            {unassigned.length > 0 && (
              <UnassignedSection
                records={unassigned}
                updatingId={updatingId}
                onUpdateStatus={(id, nextStatus) =>
                  void updateStatus(id, nextStatus)
                }
                expandedId={expandedId}
                onToggleRow={toggleRow}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default AdminPage;
