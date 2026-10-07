import { useEffect, useState } from "react";

import { RULES } from "@/data/site";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Rules() {
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRule) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRule(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedRule]);

  return (
    <>
      <section id="rules" className="rules">
        <SectionHead
          index="05 / RULEBOOKS"
          titleLines={["Read the", "rules."]}
          aside="Everything you need to compete fair and square. Download the rulebook for your arena."
        />

        <div className="rules__grid">
          {RULES.map((rule, index) => (
            <Reveal as="article" className="rule" key={rule.id}>
              <div className="rule__head">
                <span className="rule__doc" aria-hidden="true">
                  <span className="rule__doc-fold" />
                  <span className="rule__doc-spine" />
                  <span className="rule__doc-line" />
                  <span className="rule__doc-line" />
                  <span className="rule__doc-line" />
                </span>

                <div className="rule__meta">
                  <span className="rule__index">0{index + 1}</span>
                  <span className="tag rule__tag">{rule.tag}</span>
                </div>
              </div>

              <h3>{rule.title}</h3>
              <p>{rule.description}</p>

              <button
                className="rule__download"
                type="button"
                onClick={() => setSelectedRule(rule.title)}
              >
                COMING SOON <strong aria-hidden="true">↗</strong>
              </button>

              <span className="rule__file">{rule.fileName}</span>
            </Reveal>
          ))}

          <Reveal as="aside" className="rule rule--note">
            <p className="eyebrow">Last checked</p>
            <h3>Keep em printed.</h3>
            <p className="rule--note__body">
              Rulebooks update occasionally. Bring your own copy to the arena —
              the decision desk only follows the print.
            </p>
          </Reveal>
        </div>
      </section>

      {selectedRule ? (
        <div
          className="rules-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedRule(null);
          }}
        >
          <div
            className="rules-modal__window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-modal-title"
          >
            <button
              className="rules-modal__close"
              type="button"
              onClick={() => setSelectedRule(null)}
              aria-label="Close rules notice"
            >
              ×
            </button>
            <p className="eyebrow">RULEBOOK STATUS</p>
            <h2 id="rules-modal-title">Coming soon.</h2>
            <p>{selectedRule} rules will be available soon.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Rules;
