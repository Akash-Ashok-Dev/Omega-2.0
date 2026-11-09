import { HERO, HERO_IMAGE } from "@/data/site";

export function Hero() {
  return (
    <section
      id="home"
      className="hero"
      style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
    >
      <div className="hero-bottom">
        <p>{HERO.blurb}</p>
        <div className="hero-actions">
          <h1>
            {HERO.title} <span>{HERO.titleAccent}</span>
          </h1>
          <a className="button button--register" href="#passes">
            HEED THE CALL AND JOIN <strong aria-hidden="true">→</strong>
          </a>
        </div>
      </div>
    </section>
  );
}
