import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { eventIdForTitle, randomShortCode } from "./tickets.js";

const databasePath = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : resolve(import.meta.dirname, "data", "omega.db");

mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    mail TEXT NOT NULL,
    department TEXT NOT NULL,
    college TEXT NOT NULL,
    ambassador_code TEXT,
    event_title TEXT NOT NULL DEFAULT '',
    pass_title TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING'
      CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED')),
    order_id TEXT,
    ticket_token TEXT,
    short_code TEXT,
    event_id TEXT NOT NULL DEFAULT '',
    user_id TEXT,
    checked_in INTEGER NOT NULL DEFAULT 0,
    checked_in_at TEXT,
    checked_in_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    registration_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    mail TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    college TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    UNIQUE (registration_id, position)
  );

  CREATE INDEX IF NOT EXISTS registrations_mail_idx
    ON registrations (mail);

  CREATE INDEX IF NOT EXISTS registrations_status_idx
    ON registrations (payment_status);

  CREATE INDEX IF NOT EXISTS team_members_registration_idx
    ON team_members (registration_id);
`);

const registrationColumns = db.prepare("PRAGMA table_info(registrations)").all();
if (!registrationColumns.some((column) => column.name === "event_title")) {
  db.exec(
    "ALTER TABLE registrations ADD COLUMN event_title TEXT NOT NULL DEFAULT ''",
  );
}
if (!registrationColumns.some((column) => column.name === "team_name")) {
  db.exec(
    "ALTER TABLE registrations ADD COLUMN team_name TEXT NOT NULL DEFAULT ''",
  );
}

const teamMemberColumns = db.prepare("PRAGMA table_info(team_members)").all();
let addedDepartment = false;
let addedCollege = false;
if (!teamMemberColumns.some((column) => column.name === "department")) {
  db.exec(
    "ALTER TABLE team_members ADD COLUMN department TEXT NOT NULL DEFAULT ''",
  );
  addedDepartment = true;
}
if (!teamMemberColumns.some((column) => column.name === "college")) {
  db.exec(
    "ALTER TABLE team_members ADD COLUMN college TEXT NOT NULL DEFAULT ''",
  );
  addedCollege = true;
}

db.exec(`
  UPDATE registrations
  SET team_name = name
  WHERE team_name = '';

  INSERT INTO team_members (
    id, registration_id, position, name, mobile_number, mail, department, college
  )
  SELECT
    lower(hex(randomblob(16))), r.id, 1, r.name, r.mobile_number, r.mail,
    r.department, r.college
  FROM registrations r
  WHERE NOT EXISTS (
    SELECT 1 FROM team_members tm WHERE tm.registration_id = r.id
  );
`);

if (addedDepartment || addedCollege) {
  const assignments = [];
  if (addedDepartment) {
    assignments.push(`
      department = COALESCE(
        (SELECT department FROM registrations r
         WHERE r.id = team_members.registration_id),
        ''
      )
    `);
  }
  if (addedCollege) {
    assignments.push(`
      college = COALESCE(
        (SELECT college FROM registrations r
         WHERE r.id = team_members.registration_id),
        ''
      )
    `);
  }
  db.exec(`
    UPDATE team_members
    SET ${assignments.join(", ")}
    WHERE position = 1;
  `);
}

const currentRegistrationColumns = db
  .prepare("PRAGMA table_info(registrations)")
  .all();
const registrationColumnNames = new Set(
  currentRegistrationColumns.map((column) => column.name),
);

function addRegistrationColumn(name, definition) {
  if (registrationColumnNames.has(name)) return;
  db.exec(`ALTER TABLE registrations ADD COLUMN ${name} ${definition}`);
  registrationColumnNames.add(name);
}

addRegistrationColumn("ticket_token", "TEXT");
addRegistrationColumn("short_code", "TEXT");
addRegistrationColumn("event_id", "TEXT NOT NULL DEFAULT ''");
addRegistrationColumn("user_id", "TEXT");
addRegistrationColumn("checked_in", "INTEGER NOT NULL DEFAULT 0");
addRegistrationColumn("checked_in_at", "TEXT");
addRegistrationColumn("checked_in_by", "TEXT");

const ticketRows = db
  .prepare(
    `SELECT id, event_title, ticket_token, short_code, event_id
     FROM registrations`,
  )
  .all();
const updateTicket = db.prepare(`
  UPDATE registrations
  SET ticket_token = ?, short_code = ?, event_id = ?
  WHERE id = ?
`);

const seenTokens = new Set();
const seenShortCodes = new Set();

for (const row of ticketRows) {
  let ticketToken = row.ticket_token || "";
  if (!ticketToken || seenTokens.has(ticketToken)) {
    do {
      ticketToken = randomUUID();
    } while (seenTokens.has(ticketToken));
  }
  seenTokens.add(ticketToken);

  let shortCode = row.short_code || "";
  if (!shortCode || seenShortCodes.has(shortCode)) {
    do {
      shortCode = randomShortCode();
    } while (seenShortCodes.has(shortCode));
  }
  seenShortCodes.add(shortCode);

  const eventId = row.event_id || eventIdForTitle(row.event_title);
  if (
    ticketToken !== row.ticket_token ||
    shortCode !== row.short_code ||
    eventId !== row.event_id
  ) {
    updateTicket.run(ticketToken, shortCode, eventId, row.id);
  }
}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS registrations_ticket_token_idx
    ON registrations (ticket_token)
    WHERE ticket_token IS NOT NULL AND ticket_token <> '';

  CREATE UNIQUE INDEX IF NOT EXISTS registrations_short_code_idx
    ON registrations (short_code)
    WHERE short_code IS NOT NULL AND short_code <> '';

  CREATE INDEX IF NOT EXISTS registrations_event_idx
    ON registrations (event_id);

  CREATE INDEX IF NOT EXISTS registrations_checked_in_idx
    ON registrations (checked_in);
`);

export { databasePath };
