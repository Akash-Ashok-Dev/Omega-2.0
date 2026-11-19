export type Ticket = {
  token: string;
  shortCode: string;
  eventId: string;
  eventTitle: string;
  passTitle: string;
  teamName: string;
  leaderName: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedInBy: string | null;
  ticketUrl: string;
  leaderMobile?: string;
  leaderMail?: string;
};

export function extractTicketToken(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  const match = raw.match(/\/ticket\/([^/?#]+)\/?(?:[?#].*)?$/i);
  if (!match) return raw;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function formatTicketDate(value: string | null) {
  if (!value) return "";
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
