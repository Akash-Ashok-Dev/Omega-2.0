import { HERO, HERO_IMAGE } from "@/data/site";

export function Hero() {
  return (
    <section
      id="home"
      className="hero"
      style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
    >
      <div className="hero-content">
        <p className="eyebrow">{HERO.eyebrow}</p>
        <h1>
          {HERO.title} <span>{HERO.titleAccent}</span>
        </h1>
      </div>

      <div className="hero-bottom">
        <p>{HERO.blurb}</p>
        <a
          className="button button--register"
          href="https://example.com/omega-26/register"
          target="_blank"
          rel="noreferrer"
        >
          REGISTER <strong aria-hidden="true">↓</strong>
        </a>
      </div>
    </section>
  );
}
