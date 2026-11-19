import { randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import cors from "cors";
import express from "express";

import { db } from "./db.js";
import { sendTicketEmail } from "./mailer.js";
import {
  extractTicketToken,
  eventIdForTitle,
  normalizeScannedAt,
  randomShortCode,
  ticketUrlFor,
} from "./tickets.js";

const PORT = Number(process.env.PORT ?? 3001);
const GOOGLE_FORM_URL = process.env.GOOGLE_FORM_URL ?? "https://forms.google.com/";
const GOOGLE_FORM_URLS = {
  RAS: process.env.GOOGLE_FORM_URL_RAS?.trim() || GOOGLE_FORM_URL,
  IEEE: process.env.GOOGLE_FORM_URL_IEEE?.trim() || GOOGLE_FORM_URL,
  "Non-IEEE": process.env.GOOGLE_FORM_URL_NON_IEEE?.trim() || GOOGLE_FORM_URL,
};
const GOOGLE_FORM_URL_BY_COMBO = {
  "Line Follower|RAS": process.env.GOOGLE_FORM_URL_LINE_FOLLOWER_RAS?.trim(),
  "Line Follower|IEEE": process.env.GOOGLE_FORM_URL_LINE_FOLLOWER_IEEE?.trim(),
  "Line Follower|Non-IEEE":
    process.env.GOOGLE_FORM_URL_LINE_FOLLOWER_NON_IEEE?.trim(),
  "Maze Solver|RAS": process.env.GOOGLE_FORM_URL_MAZE_SOLVER_RAS?.trim(),
  "Maze Solver|IEEE": process.env.GOOGLE_FORM_URL_MAZE_SOLVER_IEEE?.trim(),
  "Maze Solver|Non-IEEE":
    process.env.GOOGLE_FORM_URL_MAZE_SOLVER_NON_IEEE?.trim(),
};
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "kz";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "14032000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN?.trim() || randomUUID();

if (!process.env.ADMIN_TOKEN?.trim()) {
  console.warn(
    "ADMIN_TOKEN not set; using a temporary token for this server run.",
  );
}

const ALLOWED_EVENTS = new Set(["Line Follower", "Maze Solver"]);
const ALLOWED_EVENT_IDS = new Set(["line-follower", "maze-solver"]);
const ALLOWED_PASS_TYPES = new Set(["RAS", "IEEE", "Non-IEEE"]);
const PAYMENT_STATUSES = new Set(["PENDING", "SUCCESS", "FAILED"]);
const MAX_TEAM_MEMBERS = 4;

const REGISTRATION_SELECT = `
  id, team_name, name, mobile_number, mail, department, college,
  ambassador_code, event_title, pass_title, payment_status, order_id,
  ticket_token, short_code, event_id, user_id, checked_in, checked_in_at,
  checked_in_by, created_at
`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\d{10}$/;
const AMBASSADOR_RE = /^\d{6}$/;

const insertRegistration = db.prepare(`
  INSERT INTO registrations (
    id, team_name, name, mobile_number, mail, department, college,
    ambassador_code, event_title, pass_title, payment_status,
    ticket_token, short_code, event_id, user_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)
`);

const insertTeamMember = db.prepare(`
  INSERT INTO team_members (
    id, registration_id, position, name, mobile_number, mail, department, college
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectRegistration = db.prepare(`
  SELECT ${REGISTRATION_SELECT}
  FROM registrations
  WHERE id = ?
`);

const selectRegistrationByToken = db.prepare(`
  SELECT ${REGISTRATION_SELECT}
  FROM registrations
  WHERE ticket_token = ?
    AND payment_status = 'SUCCESS'
`);

const selectRegistrationByLookup = db.prepare(`
  SELECT ${REGISTRATION_SELECT}
  FROM registrations
  WHERE payment_status = 'SUCCESS'
    AND ticket_token IS NOT NULL
    AND (short_code = ? COLLATE NOCASE
      OR id = ?
      OR lower(mail) = lower(?)
      OR mobile_number = ?
      OR ticket_token = ?)
  ORDER BY created_at DESC
  LIMIT 1
`);

const ticketExists = db.prepare(`
  SELECT 1 FROM registrations
  WHERE ticket_token = ? OR short_code = ?
  LIMIT 1
`);

const selectTeamMembers = db.prepare(`
  SELECT id, registration_id, position, name, mobile_number, mail, department, college
  FROM team_members
  WHERE registration_id = ?
  ORDER BY position
`);

const updatePaymentStatus = db.prepare(`
  UPDATE registrations SET payment_status = ? WHERE id = ?
`);

const issueTicket = db.prepare(`
  UPDATE registrations
  SET ticket_token = ?, short_code = ?
  WHERE id = ? AND ticket_token IS NULL
`);

const countByStatus = db.prepare(`
  SELECT payment_status AS status, COUNT(*) AS count
  FROM registrations
  GROUP BY payment_status
`);

const countCheckInAll = db.prepare(`
  SELECT COUNT(*) AS total, COALESCE(SUM(checked_in), 0) AS checkedIn
  FROM registrations
  WHERE payment_status = 'SUCCESS' AND ticket_token IS NOT NULL
`);

const countCheckInByEvent = db.prepare(`
  SELECT COUNT(*) AS total, COALESCE(SUM(checked_in), 0) AS checkedIn
  FROM registrations
  WHERE payment_status = 'SUCCESS' AND ticket_token IS NOT NULL
    AND event_id = ?
`);

const markCheckedIn = db.prepare(`
  UPDATE registrations
  SET checked_in = 1, checked_in_at = ?, checked_in_by = ?
  WHERE id = ? AND checked_in = 0
`);

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPublicMember(member) {
  return {
    id: member.id,
    position: member.position,
    name: member.name,
    mobileNumber: member.mobile_number,
    mail: member.mail,
    department: member.department,
    college: member.college,
  };
}

function toPublicRegistration(row, members = []) {
  if (!row) return null;
  return {
    id: row.id,
    teamName: row.team_name ?? "",
    name: row.name,
    mobileNumber: row.mobile_number,
    mail: row.mail,
    department: row.department,
    college: row.college,
    ambassadorCode: row.ambassador_code ?? "",
    eventTitle: row.event_title ?? "",
    passTitle: row.pass_title,
    paymentStatus: row.payment_status,
    orderId: row.order_id ?? null,
    ticketToken: row.ticket_token ?? "",
    shortCode: row.short_code ?? "",
    eventId: row.event_id ?? "",
    userId: row.user_id ?? null,
    checkedIn: Boolean(row.checked_in),
    checkedInAt: row.checked_in_at ?? null,
    checkedInBy: row.checked_in_by ?? null,
    createdAt: row.created_at,
    members: members.map(toPublicMember),
  };
}

function toPublicTicket(row, req) {
  if (!row) return null;
  return {
    token: row.ticket_token,
    shortCode: row.short_code,
    eventId: row.event_id,
    eventTitle: row.event_title,
    passTitle: row.pass_title,
    teamName: row.team_name || row.name,
    leaderName: row.name,
    checkedIn: Boolean(row.checked_in),
    checkedInAt: row.checked_in_at ?? null,
    checkedInBy: row.checked_in_by ?? null,
    ticketUrl: ticketUrlFor(req, row.ticket_token),
  };
}

function toPublicCheckInResult(row, req) {
  const ticket = toPublicTicket(row, req);
  if (!ticket) return null;
  return {
    ...ticket,
    leaderMobile: row.mobile_number,
    leaderMail: row.mail,
  };
}

function createUniqueTicket() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const token = randomUUID();
    const shortCode = randomShortCode();
    if (!ticketExists.get(token, shortCode)) {
      return { token, shortCode };
    }
  }
  throw new Error("Could not generate a unique ticket.");
}

function normalizeMember(value) {
  return {
    name: asString(value?.name),
    mobileNumber: asString(value?.mobileNumber ?? value?.mobile ?? value?.phone),
    mail: asString(value?.mail ?? value?.email).toLowerCase(),
    department: asString(value?.department),
    college: asString(value?.college),
  };
}

function validateMember(member, index, errors) {
  const prefix = `members[${index}]`;

  if (!member.name || member.name.length > 255) {
    errors[`${prefix}.name`] =
      `Team member ${index + 1} name is required (max 255 characters).`;
  }
  if (!MOBILE_RE.test(member.mobileNumber)) {
    errors[`${prefix}.mobileNumber`] =
      `Team member ${index + 1} mobile number must be exactly 10 digits.`;
  }
  if (!EMAIL_RE.test(member.mail) || member.mail.length > 255) {
    errors[`${prefix}.mail`] =
      `Team member ${index + 1} needs a valid email address.`;
  }
  if (!member.department || member.department.length > 255) {
    errors[`${prefix}.department`] =
      `Team member ${index + 1} department is required (max 255 characters).`;
  }
  if (!member.college || member.college.length > 255) {
    errors[`${prefix}.college`] =
      `Team member ${index + 1} college is required (max 255 characters).`;
  }
}

function validateRegistration(body) {
  const teamName = asString(body?.teamName);
  const ambassadorCode = asString(body?.ambassadorCode);
  const eventTitle = asString(body?.eventTitle);
  const passTitle = asString(body?.passTitle);
  const rawMembers = Array.isArray(body?.members) ? body.members : [];

  const errors = {};
  const members = [];

  if (!teamName || teamName.length > 255) {
    errors.teamName = "Team name is required (max 255 characters).";
  }
  if (ambassadorCode && !AMBASSADOR_RE.test(ambassadorCode)) {
    errors.ambassadorCode = "Ambassador code must be exactly 6 digits.";
  }
  if (!ALLOWED_EVENTS.has(eventTitle)) {
    errors.eventTitle = "Select a valid event.";
  }
  if (!ALLOWED_PASS_TYPES.has(passTitle)) {
    errors.passTitle = "Select a valid pass type.";
  }

  if (rawMembers.length === 0) {
    errors.members = "Add at least the team leader (member 1).";
  } else if (rawMembers.length > MAX_TEAM_MEMBERS) {
    errors.members = `A team can have at most ${MAX_TEAM_MEMBERS} members.`;
  } else {
    rawMembers.forEach((rawMember, index) => {
      const member = normalizeMember(rawMember);
      const provided = Boolean(
        member.name ||
          member.mobileNumber ||
          member.mail ||
          member.department ||
          member.college,
      );

      if (index === 0 && !provided) {
        errors["members[0].name"] = "Team member 1 (leader) is required.";
        return;
      }
      if (index > 0 && !provided) {
        return;
      }

      members.push({ ...member, position: index + 1 });
      validateMember(member, index, errors);
    });
  }

  const leader = members.find((member) => member.position === 1);
  const data = {
    teamName,
    members,
    name: leader?.name ?? "",
    mobileNumber: leader?.mobileNumber ?? "",
    mail: leader?.mail ?? "",
    department: leader?.department ?? "",
    college: leader?.college ?? "",
    ambassadorCode,
    eventTitle,
    passTitle,
  };

  return { data, errors };
}

function googleFormUrlFor(eventTitle, passTitle) {
  return (
    GOOGLE_FORM_URL_BY_COMBO[`${eventTitle}|${passTitle}`] ||
    GOOGLE_FORM_URLS[passTitle] ||
    GOOGLE_FORM_URL
  );
}

function createRateLimit(maxAttempts, windowMs, message) {
  const hits = new Map();

  return function rateLimiter(req, res, next) {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxAttempts) {
      return res.status(429).json({ error: message });
    }

    return next();
  };
}

const registerRateLimit = createRateLimit(
  10,
  10 * 60 * 1000,
  "Too many registration attempts. Please try again later.",
);

const loginRateLimit = createRateLimit(
  5,
  15 * 60 * 1000,
  "Too many login attempts. Please try again later.",
);

const ticketLookupRateLimit = createRateLimit(
  60,
  60 * 1000,
  "Too many ticket lookups. Please try again later.",
);

function safeEqual(value, expected) {
  const provided = Buffer.from(value);
  const target = Buffer.from(expected);
  return (
    provided.length === target.length && timingSafeEqual(provided, target)
  );
}

function hasValidAdminToken(req) {
  return safeEqual(req.get("x-admin-token") ?? "", ADMIN_TOKEN);
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "16kb" }));

app.use((req, res, next) => {
  if (/\.(db|sqlite|sqlite3)$/i.test(req.path)) {
    return res.status(404).end();
  }
  return next();
});

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-token"],
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/admin/backup", (req, res) => {
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  let tempDir;
  try {
    tempDir = mkdtempSync(join(tmpdir(), "omega-backup-"));
    const backupPath = join(tempDir, "omega.db");
    db.exec(`VACUUM INTO '${backupPath.replaceAll("'", "''")}'`);
    const stamp = new Date().toISOString().slice(0, 10);

    return res.download(backupPath, `omega-${stamp}.db`, (error) => {
      rmSync(tempDir, { recursive: true, force: true });
      if (error && !res.headersSent) {
        res.status(500).json({ error: "Could not export database." });
      }
    });
  } catch (error) {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    console.error("Database export failed:", error);
    return res.status(500).json({ error: "Could not export database." });
  }
});

app.post("/api/admin/login", loginRateLimit, (req, res) => {
  const username = asString(req.body?.username);
  const password = asString(req.body?.password);

  const usernameOk = safeEqual(username, ADMIN_USERNAME);
  const passwordOk = safeEqual(password, ADMIN_PASSWORD);

  if (!usernameOk || !passwordOk) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  return res.json({ token: ADMIN_TOKEN });
});

app.post("/api/register", registerRateLimit, (req, res) => {
  const { data, errors } = validateRegistration(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: "Please fix the highlighted fields.",
      fields: errors,
    });
  }

  const id = randomUUID();
  const eventId = eventIdForTitle(data.eventTitle);

  try {
    db.exec("BEGIN");
    insertRegistration.run(
      id,
      data.teamName,
      data.name,
      data.mobileNumber,
      data.mail,
      data.department,
      data.college,
      data.ambassadorCode || null,
      data.eventTitle,
      data.passTitle,
      null,
      null,
      eventId,
      data.mail,
    );
    for (const member of data.members) {
      insertTeamMember.run(
        randomUUID(),
        id,
        member.position,
        member.name,
        member.mobileNumber,
        member.mail,
        member.department,
        member.college,
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch (rollbackError) {
      console.error("Failed to roll back registration:", rollbackError);
    }
    console.error("Failed to save registration:", error);
    return res.status(500).json({
      error: "Could not save your registration. Please try again.",
    });
  }

  return res.status(201).json({
    id,
    paymentStatus: "PENDING",
    googleFormUrl: googleFormUrlFor(data.eventTitle, data.passTitle),
    registration: {
      teamName: data.teamName,
      name: data.name,
      mail: data.mail,
      eventTitle: data.eventTitle,
      passTitle: data.passTitle,
      memberCount: data.members.length,
    },
  });
});

app.get("/api/ticket/lookup", ticketLookupRateLimit, (req, res) => {
  const query = asString(req.query.query).slice(0, 100);
  if (!query) {
    return res.status(400).json({
      error: "Enter a registration ID, short code, email, or mobile number.",
    });
  }

  const registration = selectRegistrationByLookup.get(
    query,
    query,
    query,
    query,
    extractTicketToken(query),
  );
  if (!registration) {
    return res
      .status(404)
      .json({ error: "Ticket not found or not confirmed yet." });
  }

  return res.json({ ticket: toPublicTicket(registration, req) });
});

app.get("/api/ticket/:token", ticketLookupRateLimit, (req, res) => {
  const token = extractTicketToken(req.params.token);
  if (!token) {
    return res.status(400).json({ error: "Ticket token is required." });
  }

  const registration = selectRegistrationByToken.get(token);
  if (!registration) {
    return res
      .status(404)
      .json({ error: "Ticket not found or not confirmed yet." });
  }

  return res.json({ ticket: toPublicTicket(registration, req) });
});

app.get("/api/admin/check-in/stats", (req, res) => {
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const eventId = asString(req.query.eventId);
  if (eventId && !ALLOWED_EVENT_IDS.has(eventId)) {
    return res.status(400).json({ error: "Invalid event." });
  }

  const counts = eventId
    ? countCheckInByEvent.get(eventId)
    : countCheckInAll.get();

  return res.json({
    total: Number(counts?.total ?? 0),
    checkedIn: Number(counts?.checkedIn ?? 0),
  });
});

app.get("/api/admin/check-in/search", (req, res) => {
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const query = asString(req.query.query).slice(0, 100);
  if (!query) {
    return res.json({ results: [] });
  }

  const eventId = asString(req.query.eventId);
  if (eventId && !ALLOWED_EVENT_IDS.has(eventId)) {
    return res.status(400).json({ error: "Invalid event." });
  }

  const like = `%${query}%`;
  const conditions = [
    "payment_status = 'SUCCESS'",
    "ticket_token IS NOT NULL",
    `(team_name LIKE ? OR name LIKE ? OR mobile_number LIKE ? OR mail LIKE ?
      OR short_code LIKE ? OR id = ?)`,
  ];
  const params = [like, like, like, like, like, query];

  if (eventId) {
    conditions.push("event_id = ?");
    params.push(eventId);
  }

  const rows = db
    .prepare(
      `SELECT ${REGISTRATION_SELECT}
       FROM registrations
       WHERE ${conditions.join(" AND ")}
       ORDER BY checked_in ASC, created_at DESC
       LIMIT 20`,
    )
    .all(...params);

  return res.json({
    results: rows.map((row) => toPublicCheckInResult(row, req)),
  });
});

app.post("/api/admin/check-in", (req, res) => {
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const token = extractTicketToken(req.body?.token);
  if (!token) {
    return res.status(400).json({ error: "Ticket token is required." });
  }

  const eventId = asString(req.body?.eventId);
  if (!ALLOWED_EVENT_IDS.has(eventId)) {
    return res.status(400).json({ error: "Select a valid event." });
  }

  const scannedAt = normalizeScannedAt(req.body?.scannedAt);
  if (!scannedAt) {
    return res.status(400).json({ error: "Invalid scan time." });
  }

  const volunteerName =
    asString(req.body?.volunteerName).slice(0, 120) || ADMIN_USERNAME;

  const registration = selectRegistrationByToken.get(token);
  if (!registration) {
    return res.status(404).json({
      result: "invalid",
      error: "Ticket not found.",
    });
  }

  if (registration.event_id !== eventId) {
    return res.status(409).json({
      result: "wrong-event",
      error: `This ticket is for ${registration.event_title}, not the selected event.`,
      ticket: toPublicCheckInResult(registration, req),
    });
  }

  if (registration.checked_in) {
    return res.json({
      result: "duplicate",
      error: "Ticket already checked in.",
      ticket: toPublicCheckInResult(registration, req),
    });
  }

  const update = markCheckedIn.run(scannedAt, volunteerName, registration.id);
  if (update.changes === 0) {
    const current = selectRegistration.get(registration.id);
    return res.json({
      result: "duplicate",
      error: "Ticket already checked in.",
      ticket: toPublicCheckInResult(current, req),
    });
  }

  const updated = selectRegistration.get(registration.id);
  return res.json({
    result: "checked-in",
    ticket: toPublicCheckInResult(updated, req),
  });
});

app.get("/api/registrations", (req, res) => {
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const status = asString(req.query.status).toUpperCase();
  if (status && !PAYMENT_STATUSES.has(status)) {
    return res.status(400).json({ error: "Invalid status filter." });
  }

  const search = asString(req.query.search).slice(0, 100);
  const requestedLimit = Number(req.query.limit ?? 200);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 500)
    : 200;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push("payment_status = ?");
    params.push(status);
  }
  if (search) {
    conditions.push(
      `(team_name LIKE ? OR name LIKE ? OR mail LIKE ? OR mobile_number LIKE ?
        OR department LIKE ? OR college LIKE ? OR short_code LIKE ?
        OR ticket_token LIKE ? OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.registration_id = registrations.id
            AND (tm.name LIKE ? OR tm.mail LIKE ? OR tm.mobile_number LIKE ?
                 OR tm.department LIKE ? OR tm.college LIKE ?)
        ))`,
    );
    const like = `%${search}%`;
    params.push(
      like,
      like,
      like,
      like,
      like,
      like,
      like,
      like,
      like,
      like,
      like,
      like,
      like,
    );
  }

  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT ${REGISTRATION_SELECT}
       FROM registrations${where}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(...params, limit);

  const memberRows = rows.length
    ? db
        .prepare(
          `SELECT id, registration_id, position, name, mobile_number, mail,
                  department, college
           FROM team_members
           WHERE registration_id IN (${rows.map(() => "?").join(", ")})
           ORDER BY registration_id, position`,
        )
        .all(...rows.map((row) => row.id))
    : [];

  const membersByRegistration = new Map();
  for (const member of memberRows) {
    const list = membersByRegistration.get(member.registration_id) ?? [];
    list.push(member);
    membersByRegistration.set(member.registration_id, list);
  }

  const summary = { PENDING: 0, SUCCESS: 0, FAILED: 0 };
  for (const row of countByStatus.all()) {
    summary[row.status] = Number(row.count);
  }

  const checkInCounts = countCheckInAll.get();

  return res.json({
    registrations: rows.map((row) =>
      toPublicRegistration(row, membersByRegistration.get(row.id) ?? []),
    ),
    count: rows.length,
    summary,
    checkIn: {
      total: Number(checkInCounts?.total ?? 0),
      checkedIn: Number(checkInCounts?.checkedIn ?? 0),
    },
    filters: { status: status || null, search: search || null, limit },
  });
});

app.get("/api/registrations/:id", (req, res) => {
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const registration = selectRegistration.get(req.params.id);
  if (!registration) {
    return res.status(404).json({ error: "Registration not found." });
  }
  return res.json({
    registration: toPublicRegistration(
      registration,
      selectTeamMembers.all(registration.id),
    ),
  });
});

app.patch("/api/registrations/:id", async (req, res) => {
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const paymentStatus = asString(req.body?.paymentStatus).toUpperCase();
  if (!PAYMENT_STATUSES.has(paymentStatus)) {
    return res.status(400).json({
      error: "paymentStatus must be PENDING, SUCCESS, or FAILED.",
    });
  }

  const current = selectRegistration.get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: "Registration not found." });
  }

  let ticket = null;
  try {
    db.exec("BEGIN");
    if (paymentStatus === "SUCCESS" && !current.ticket_token) {
      ticket = createUniqueTicket();
      const issued = issueTicket.run(
        ticket.token,
        ticket.shortCode,
        req.params.id,
      );
      if (issued.changes === 0) {
        throw new Error("Could not issue ticket for this registration.");
      }
    }
    updatePaymentStatus.run(paymentStatus, req.params.id);
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch (rollbackError) {
      console.error("Failed to roll back confirmation:", rollbackError);
    }
    console.error("Failed to confirm registration:", error);
    return res.status(500).json({
      error: "Could not confirm this registration. Please try again.",
    });
  }

  let emailSent = false;
  if (ticket) {
    const ticketUrl = ticketUrlFor(req, ticket.token);
    try {
      emailSent = await sendTicketEmail({
        to: current.mail,
        ticket: {
          token: ticket.token,
          shortCode: ticket.shortCode,
          url: ticketUrl,
        },
        registration: {
          teamName: current.team_name,
          name: current.name,
          eventTitle: current.event_title,
          passTitle: current.pass_title,
        },
      });
    } catch (error) {
      console.error("Ticket email failed:", error);
    }
  }

  return res.json({
    registration: toPublicRegistration(
      selectRegistration.get(req.params.id),
      selectTeamMembers.all(req.params.id),
    ),
    ticketIssued: Boolean(ticket),
    emailSent,
  });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." });
});

const distDir = resolve(import.meta.dirname, "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    return res.sendFile(resolve(distDir, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  console.error("Unexpected server error:", error);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`OMEGA API listening on http://localhost:${PORT}`);
});
