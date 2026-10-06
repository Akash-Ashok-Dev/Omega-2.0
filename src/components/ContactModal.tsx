import { useEffect, useRef } from "react";

import { CONTACT, TEAM } from "@/data/site";

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ContactModal({ open, onClose }: ContactModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const { body } = document;
    const overflow = body.style.overflow;
    body.style.overflow = "hidden";

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="win-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="win"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-window-title"
        ref={dialogRef}
      >
        <div className="win__bar">
          <div className="win__lights" aria-hidden="true">
            <button
              className="win__light win__light--close"
              type="button"
              aria-label="Close window"
              onClick={onClose}
            />
            <span className="win__light win__light--min" />
            <span className="win__light win__light--max" />
          </div>

          <span className="win__title" id="contact-window-title">
            {CONTACT.windowTitle}
          </span>

          <button
            className="win__x"
            type="button"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close contact window"
          >
            ✕
          </button>
        </div>

        <div className="win__addr">
          <span className="win__proto">🔒</span>
          <span className="win__url">omega2k.in/contact?window=team</span>
          <span className="win__badge">6 CREW ONLINE</span>
        </div>

        <div className="win__body">
          <div className="win__intro">
            <p className="win__blurb">{CONTACT.blurb}</p>

            <div className="win__desk">
              <div className="win__desk-title">SHARED DESK</div>
              <a
                className="win__desk-row"
                href={`mailto:${CONTACT.desk.email}`}
              >
                <span>MAIL</span>
                <b>{CONTACT.desk.email}</b>
              </a>
              <a className="win__desk-row" href={`tel:${CONTACT.desk.phone}`}>
                <span>CALL</span>
                <b>{CONTACT.desk.phone}</b>
              </a>
              <div className="win__desk-row">
                <span>HOURS</span>
                <b>{CONTACT.desk.hours}</b>
              </div>
              <div className="win__desk-row">
                <span>VENUE</span>
                <b>{CONTACT.desk.venue}</b>
              </div>
            </div>

            <div className="win__socials">
              {CONTACT.socials.map((social) => (
                <a
                  key={social.label}
                  className="win__social"
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {social.label} ↗
                </a>
              ))}
            </div>
          </div>

          <div className="win__crew">
            <div className="win__crew-head">
              <span>TEAM / CREW DIRECTORY</span>
              <span className="win__crew-count">06</span>
            </div>

            <ul className="win__list">
              {TEAM.map((member, index) => (
                <li className="crew" key={member.email}>
                  <span className="crew__avatar" aria-hidden="true">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>

                  <div className="crew__info">
                    <div className="crew__top">
                      <span className="crew__index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3>{member.name}</h3>
                    </div>
                    <div className="crew__role">{member.role}</div>
                    <p className="crew__focus">{member.focus}</p>

                    <div className="crew__links">
                      <a href={`mailto:${member.email}`}>{member.email}</a>
                      <a href={`tel:${member.phone}`}>{member.phone}</a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="win__status">
          <span>CONNECTED</span>
          <span>Press ESC to minimize</span>
          <span>OMEGA 2.0 · SECURE CHANNEL</span>
        </div>
      </div>
    </div>
  );
}

export default ContactModal;
