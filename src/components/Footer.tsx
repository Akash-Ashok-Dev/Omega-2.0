import { useState } from "react";

import { ContactModal } from "@/components/ContactModal";
import { FOOTER } from "@/data/site";

export function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className="footer">
        <div>
          <h2>
            {FOOTER.titleLines.map((line) => (
              <span key={line} className="footer__line">
                {line}
              </span>
            ))}
          </h2>
          <p>{FOOTER.note}</p>
        </div>

        <button
          className="button"
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          CONTACT THE TEAM <strong aria-hidden="true">↗</strong>
        </button>
      </footer>

      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
