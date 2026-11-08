import { useState } from "react";

import { PASSES, PASSES_TYPE } from "@/data/site";
import { Reveal } from "@/components/Reveal";
import { RegistrationModal } from "@/components/RegistrationModal";
import { SectionHead } from "@/components/SectionHead";

export function Passes() {
  const [selectedPass, setSelectedPass] = useState<string | null>(null);

  return (
    <>
      <section id="passes" className="passes">
        <SectionHead
          index="03 / REGISTER"
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
                {PASSES_TYPE.map((passType) => (
                  <Reveal as="article" key={passType.id} className="pass">
                    <small>{passType.kind}</small>

                    <div>
                      <span className="pass__member">FOR</span>
                      <h3>{passType.title}</h3>
                      <span className="pass__member">member</span>
                    </div>

                    <div className="pass__footer">
                      <span className="price">{passType.price}</span>
                      <button
                        className="pass__buy"
                        type="button"
                        onClick={() => setSelectedPass(passType.title)}
                        aria-label={`Buy ${passType.title} pass`}
                      >
                        BUY ↗
                      </button>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {selectedPass && (
        <RegistrationModal
          passTitle={selectedPass}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </>
  );
}
