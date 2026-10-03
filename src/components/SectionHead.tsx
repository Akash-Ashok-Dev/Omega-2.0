import type { ReactNode } from "react";

import { Reveal } from "@/components/Reveal";

type SectionHeadProps = {
  index: string;
  titleLines: readonly string[];
  aside?: ReactNode;
  accent?: "lime" | "orange";
};

export function SectionHead({ index, titleLines, aside, accent = "lime" }: SectionHeadProps) {
  return (
    <Reveal className="section-head">
      <div>
        <div className={`section-number section-number--${accent}`}>{index}</div>
        <h2>
          {titleLines.map((line) => (
            <span key={line} className="section-head__line">
              {line}
            </span>
          ))}
        </h2>
      </div>
      {aside ? <p className="section-head__aside">{aside}</p> : null}
    </Reveal>
  );
}