import { randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import cors from "cors";
import express from "express";

import { databasePath, db } from "./db.js";

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

const ALLOWED_DEPARTMENTS = new Set(["CS", "EC", "EE", "Mech", "Others"]);
const ALLOWED_EVENTS = new Set(["Line Follower", "Maze Solver"]);
const ALLOWED_PASS_TYPES = new Set(["RAS", "IEEE", "Non-IEEE"]);
const PAYMENT_STATUSES = new Set(["PENDING", "SUCCESS", "FAILED"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\d{10}$/;
const AMBASSADOR_RE = /^\d{6}$/;

const insertRegistration = db.prepare(`
  INSERT INTO registrations (
    id, name, mobile_number, mail, department, college,
    ambassador_code, event_title, pass_title, payment_status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
`);

const selectRegistration = db.prepare(`
  SELECT id, name, mobile_number, mail, department, college,
         ambassador_code, event_title, pass_title, payment_status, order_id,
         created_at
  FROM registrations
  WHERE id = ?
`);

const updatePaymentStatus = db.prepare(`
  UPDATE registrations SET payment_status = ? WHERE id = ?
`);

const countByStatus = db.prepare(`
  SELECT payment_status AS status, COUNT(*) AS count
  FROM registrations
  GROUP BY payment_status
`);

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPublicRegistration(row) {
  if (!row) return null;
  return {
    id: row.id,
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
    createdAt: row.created_at,
  };
}

function validateRegistration(body) {
  const data = {
    name: asString(body?.name),
    mobileNumber: asString(body?.mobileNumber ?? body?.mobile),
    mail: asString(body?.mail ?? body?.email).toLowerCase(),
    department: asString(body?.department),
    college: asString(body?.college),
    ambassadorCode: asString(body?.ambassadorCode),
    eventTitle: asString(body?.eventTitle),
    passTitle: asString(body?.passTitle),
  };

  const errors = {};

  if (!data.name || data.name.length > 255) {
    errors.name = "Name is required (max 255 characters).";
  }
  if (!MOBILE_RE.test(data.mobileNumber)) {
    errors.mobileNumber = "Mobile number must be exactly 10 digits.";
  }
  if (!EMAIL_RE.test(data.mail) || data.mail.length > 255) {
    errors.mail = "A valid email address is required.";
  }
  if (!ALLOWED_DEPARTMENTS.has(data.department)) {
    errors.department = "Select a valid department.";
  }
  if (!data.college || data.college.length > 255) {
    errors.college = "College is required (max 255 characters).";
  }
  if (data.ambassadorCode && !AMBASSADOR_RE.test(data.ambassadorCode)) {
    errors.ambassadorCode = "Ambassador code must be exactly 6 digits.";
  }
  if (!ALLOWED_EVENTS.has(data.eventTitle)) {
    errors.eventTitle = "Select a valid event.";
  }
  if (!ALLOWED_PASS_TYPES.has(data.passTitle)) {
    errors.passTitle = "Select a valid pass type.";
  }

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
app.use(express.json({ limit: "16kb" }));

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
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: databasePath });
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

  try {
    insertRegistration.run(
      id,
      data.name,
      data.mobileNumber,
      data.mail,
      data.department,
      data.college,
      data.ambassadorCode || null,
      data.eventTitle,
      data.passTitle,
    );
  } catch (error) {
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
      name: data.name,
      mail: data.mail,
      eventTitle: data.eventTitle,
      passTitle: data.passTitle,
    },
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
      "(name LIKE ? OR mail LIKE ? OR mobile_number LIKE ? OR college LIKE ?)",
    );
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT id, name, mobile_number, mail, department, college,
              ambassador_code, event_title, pass_title, payment_status,
              order_id, created_at
       FROM registrations${where}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(...params, limit);

  const summary = { PENDING: 0, SUCCESS: 0, FAILED: 0 };
  for (const row of countByStatus.all()) {
    summary[row.status] = Number(row.count);
  }

  return res.json({
    registrations: rows.map(toPublicRegistration),
    count: rows.length,
    summary,
    filters: { status: status || null, search: search || null, limit },
  });
});

app.get("/api/registrations/:id", (req, res) => {
  const registration = selectRegistration.get(req.params.id);
  if (!registration) {
    return res.status(404).json({ error: "Registration not found." });
  }
  return res.json({ registration: toPublicRegistration(registration) });
});

app.patch("/api/registrations/:id", (req, res) => {
  if (!hasValidAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const paymentStatus = asString(req.body?.paymentStatus).toUpperCase();
  if (!PAYMENT_STATUSES.has(paymentStatus)) {
    return res.status(400).json({
      error: "paymentStatus must be PENDING, SUCCESS, or FAILED.",
    });
  }

  const result = updatePaymentStatus.run(paymentStatus, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Registration not found." });
  }

  return res.json({
    registration: toPublicRegistration(selectRegistration.get(req.params.id)),
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
