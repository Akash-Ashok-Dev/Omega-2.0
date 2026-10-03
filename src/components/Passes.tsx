import { PASSES, PASSES_TYPE } from "@/data/site";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Passes() {
  return (
    <section id="passes" className="passes">
      <SectionHead
        index="03 / ACCESS"
        accent="orange"
        titleLines={["Choose your", "pass"]}
        aside="One badge. A festival-sized experience."
      />

      <div className="timeline">
        {PASSES.map((pass) => (
          <Reveal as="article" key={pass.id} className="pass">
            <small>{pass.kind}</small>

            <p>{pass.description}</p>

            <div className="pass-grid">
              <h3>{pass.title}</h3>
              {PASSES_TYPE.map((pass) => (
                <Reveal as="article" key={pass.id} className="pass">
                  <small>{pass.kind}</small>

                  <div>
                    <h3>{pass.title}</h3>
                  </div>

                  <div className="pass__footer">
                    <span className="price">{pass.price}</span>
                    <a
                      className="pass__buy"
                      href="#passes"
                      aria-label={`Buy ${pass.title} pass`}
                    >
                      BUY ↗
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
