import { randomInt } from "node:crypto";

const SHORT_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SQLITE_DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export function eventIdForTitle(title) {
  const normalized = String(title ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "line follower") return "line-follower";
  if (normalized === "maze solver") return "maze-solver";

  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function randomShortCode() {
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += SHORT_CODE_ALPHABET[randomInt(SHORT_CODE_ALPHABET.length)];
  }
  return `EVT${randomInt(10, 100)}-${suffix}`;
}

export function normalizeScannedAt(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  const date = raw
    ? new Date(
        SQLITE_DATETIME_RE.test(raw)
          ? `${raw.replace(" ", "T")}Z`
          : raw,
      )
    : new Date();

  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function ticketUrlFor(req, token) {
  const base =
    process.env.APP_URL?.trim() ||
    `${req.protocol}://${req.get("host") ?? "localhost"}`;
  return `${base.replace(/\/+$/, "")}/ticket/${encodeURIComponent(token)}`;
}

export function extractTicketToken(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  const match = raw.match(/\/ticket\/([^/?#]+)\/?(?:[?#].*)?$/i);
  if (!match) return raw;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
