import { PROSHOW, PROSHOW_IMAGE } from "@/data/site";
import { Reveal } from "@/components/Reveal";

export function Proshow() {
  return (
    <section
      id="proshow"
      className="proshow"
      style={{ backgroundImage: `url("${PROSHOW_IMAGE}")` }}
    >
      <p className="eyebrow">{PROSHOW.eyebrow}</p>

      <Reveal as="h2" className="proshow__title">
        {PROSHOW.titleLines.map((line) => (
          <span key={line} className="proshow__line">
            {line}
          </span>
        ))}
      </Reveal>

      <Reveal as="p" className="proshow__blurb">
        {PROSHOW.blurb}
      </Reveal>

      <Reveal className="details">
        {PROSHOW.details.map((detail) => (
          <span key={detail.label}>
            <b>{detail.label}:</b> {detail.value}
          </span>
        ))}
      </Reveal>
    </section>
  );
}