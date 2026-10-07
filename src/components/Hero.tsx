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
        <a className="button" href="#events">
          EXPLORE THE FEST <strong aria-hidden="true">↓</strong>
        </a>
      </div>
    </section>
  );
}
