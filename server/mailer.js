import nodemailer from "nodemailer";
import QRCode from "qrcode";

let transporter;
let warned = false;

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();
  if (!host || !from) return null;

  const requestedPort = Number(process.env.SMTP_PORT ?? 587);
  const port = Number.isFinite(requestedPort) ? requestedPort : 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user && pass ? { user, pass } : undefined,
    from,
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

export async function sendTicketEmail({ to, ticket, registration }) {
  const config = smtpConfig();
  if (!config) {
    if (!warned) {
      console.warn("SMTP is not configured; ticket emails are disabled.");
      warned = true;
    }
    return false;
  }
  if (!to) return false;

  transporter ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  const qrBuffer = await QRCode.toBuffer(ticket.token, {
    type: "png",
    width: 360,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  const eventLine = [registration.eventTitle, registration.passTitle]
    .filter(Boolean)
    .join(" / ");
  const teamName = escapeHtml(registration.teamName);
  const leaderName = escapeHtml(registration.name);
  const shortCode = escapeHtml(ticket.shortCode);
  const eventLabel = escapeHtml(eventLine);
  const ticketUrl = escapeHtml(ticket.url);

  const html = `
    <div style="background:#0d0d0d;padding:24px;font-family:Arial,sans-serif;color:#f5f5f5;">
      <div style="max-width:520px;margin:0 auto;background:#151300;border:1px solid #ffd400;padding:24px;">
        <p style="margin:0 0 8px;color:#ffd400;font-size:12px;letter-spacing:2px;">OMEGA 2.0 / E-TICKET</p>
        <h1 style="margin:0 0 4px;font-size:28px;line-height:1.1;">${teamName}</h1>
        <p style="margin:0 0 20px;color:#c9c9c9;">${eventLabel}</p>
        <div style="background:#ffffff;padding:16px;text-align:center;">
          <img src="cid:omega-ticket" alt="Ticket QR code" width="320" height="320" style="display:block;margin:0 auto;max-width:100%;height:auto;" />
        </div>
        <p style="margin:20px 0 4px;color:#c9c9c9;font-size:12px;letter-spacing:1px;">SHORT CODE</p>
        <p style="margin:0 0 16px;font-family:monospace;font-size:28px;letter-spacing:3px;color:#ffd400;">${shortCode}</p>
        <p style="margin:0 0 16px;color:#c9c9c9;line-height:1.5;">Show this QR code at the venue. Turn your screen brightness up. If the code cannot be scanned, the volunteer can enter the short code.</p>
        <a href="${ticketUrl}" style="display:inline-block;background:#ffd400;color:#111;padding:12px 16px;text-decoration:none;font-weight:bold;">Open ticket page</a>
        <p style="margin:20px 0 0;color:#8f8f8f;font-size:12px;">Leader: ${leaderName}</p>
      </div>
    </div>
  `;

  const text = [
    "OMEGA 2.0 / E-TICKET",
    `Team: ${registration.teamName}`,
    `Event: ${eventLine}`,
    `Leader: ${registration.name}`,
    `Short code: ${ticket.shortCode}`,
    `Ticket: ${ticket.url}`,
    "",
    "Show this QR code at the venue. Turn your screen brightness up.",
    "If the code cannot be scanned, the volunteer can enter the short code.",
  ].join("\n");

  const subjectTeam = String(registration.teamName ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `Your Omega 2.0 ticket — ${subjectTeam}`,
    text,
    html,
    attachments: [
      {
        filename: "omega-ticket.png",
        content: qrBuffer,
        cid: "omega-ticket",
      },
    ],
  });

  return true;
}
