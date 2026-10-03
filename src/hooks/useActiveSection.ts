import { useEffect, useState } from "react";

import { NAV_ITEMS, type SectionId } from "@/data/site";

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

/**
 * Tracks which page section currently owns the viewport so the side nav can
 * highlight it. A band across the middle of the screen decides the winner,
 * which keeps the highlight stable while scrolling past tall sections.
 */
export function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>(SECTION_IDS[0]);

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (section): section is HTMLElement => section !== null,
    );

    const instance = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        setActive(visible.target.id as SectionId);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((section) => instance.observe(section));

    return () => instance.disconnect();
  }, []);

  return active;
}