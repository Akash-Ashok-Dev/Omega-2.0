import { useState } from "react";

import { ComingSoonModal } from "@/components/ComingSoonModal";
import { HERO, HERO_IMAGE } from "@/data/site";

export function Hero() {
  const [registrationOpen, setRegistrationOpen] = useState(false);

  return (
    <>
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
          <button
            className="button button--register"
            type="button"
            onClick={() => setRegistrationOpen(true)}
          >
            HEED THE CALL AND JOIN <strong aria-hidden="true">→</strong>
          </button>
        </div>
      </section>

      {registrationOpen ? (
        <ComingSoonModal
          message="Registration will be available soon."
          onClose={() => setRegistrationOpen(false)}
        />
      ) : null}
    </>
  );
}
