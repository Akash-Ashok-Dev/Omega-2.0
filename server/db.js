import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

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
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS registrations_mail_idx
    ON registrations (mail);

  CREATE INDEX IF NOT EXISTS registrations_status_idx
    ON registrations (payment_status);
`);

const registrationColumns = db.prepare("PRAGMA table_info(registrations)").all();
if (!registrationColumns.some((column) => column.name === "event_title")) {
  db.exec(
    "ALTER TABLE registrations ADD COLUMN event_title TEXT NOT NULL DEFAULT ''",
  );
}

export { databasePath };
