import { HERO, HERO_IMAGE } from "@/data/site";

export function Hero() {
  return (
    <section
      id="home"
      className="hero"
      style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
    >
      <div className="hero-content">
        <h1>
          {HERO.title} <span>{HERO.titleAccent}</span>
        </h1>
      </div>

      <div className="hero-bottom">
        <p>{HERO.blurb}</p>
        <a className="button button--register" href="#passes">
          HEED THE CALL AND JOIN <strong aria-hidden="true">→</strong>
        </a>
      </div>
    </section>
  );
}
