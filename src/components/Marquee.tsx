import { MARQUEE_WORDS } from "@/data/site";

function Group({ hidden = false }: { hidden?: boolean }) {
  return (
    <span className="marquee__group" aria-hidden={hidden || undefined}>
      {MARQUEE_WORDS.map((word) => (
        <span key={word} className="marquee__item">
          {word} <span className="marquee__dot">•</span>
        </span>
      ))}
    </span>
  );
}

export function Marquee() {
  return (
    <div className="marquee">
      <div className="marquee__bg" aria-hidden="true" />
      <div className="marquee__track">
        <Group />
        <Group hidden />
      </div>
    </div>
  );
}