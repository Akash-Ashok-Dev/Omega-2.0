import { RULES } from "@/data/site";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Rules() {
  return (
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

            <a
              className="rule__download"
              href={rule.driveUrl}
              target="_blank"
              rel="noreferrer"
            >
              DOWNLOAD PDF <strong aria-hidden="true">↓</strong>
            </a>

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
  );
}

export default Rules;