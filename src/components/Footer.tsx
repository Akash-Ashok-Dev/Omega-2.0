import { FOOTER } from "@/data/site";

export function Footer() {
  return (
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

      <a className="button" href={`mailto:${FOOTER.contactEmail}`}>
        CONTACT THE TEAM <strong aria-hidden="true">↗</strong>
      </a>
    </footer>
  );
}