import { useState } from "react";

import { PASSES, PASSES_TYPE } from "@/data/site";
import { Reveal } from "@/components/Reveal";
import { RegistrationModal } from "@/components/RegistrationModal";
import { SectionHead } from "@/components/SectionHead";

export function Passes() {
  const [selectedPass, setSelectedPass] = useState<{
    eventTitle: string;
    passTitle: string;
  } | null>(null);

  return (
    <>
      <section id="passes" className="passes">
        <SectionHead
          index="03 / REGISTER"
          accent="orange"
          titleLines={["Choose your", "pass"]}
          aside="One badge. A festival-sized experience."
        />

        <div className="pass-groups">
          {PASSES.map((pass) => (
            <Reveal as="section" key={pass.id} className="pass-group">
              <div className="pass-group__heading">
                <small>{pass.kind}</small>
                <p>{pass.description}</p>
              </div>

              <div className="pass-grid" aria-label={`${pass.title} passes`}>
                {PASSES_TYPE.map((passType) => (
                  <Reveal as="article" key={passType.id} className="pass">
                    <div className="pass__topline">
                      <small>{passType.kind}</small>
                      <span>NO. 0{passType.id === "Line Follower" ? "1" : "2"}</span>
                    </div>

                    <div className="pass__details">
                      <span className="pass__eyebrow">OMEGA &apos;26 / ADMIT ONE</span>
                      <h3>{pass.title}</h3>
                      <p>FOR {passType.title} MEMBER</p>
                      <div className="pass__meta">
                        <span><span aria-hidden="true">⌖</span> MEC, KOCHI</span>
                        <span><span aria-hidden="true">◷</span> COMING SOON</span>
                      </div>
                    </div>

                    <div className="pass__footer">
                      <span className="pass__stub-label">OMEGA 2.0</span>
                      <span className="price">
                        <small>₹</small>
                        {passType.price}
                      </span>
                      <button
                        className="pass__buy"
                        type="button"
                        onClick={() =>
                          setSelectedPass({
                            eventTitle: pass.title,
                            passTitle: passType.title,
                          })
                        }
                        aria-label={`Buy ${passType.title} pass for ${pass.title}`}
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
          eventTitle={selectedPass.eventTitle}
          passTitle={selectedPass.passTitle}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </>
  );
}
