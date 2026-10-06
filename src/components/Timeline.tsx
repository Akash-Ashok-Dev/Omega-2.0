import { useEffect, useRef, useState } from "react";

import { TIMELINE } from "@/data/site";
import { Reveal } from "@/components/Reveal";

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function robotPosition(progress: number) {
  const radians = progress * Math.PI * 3;

  return {
    left: `${50 + Math.sin(radians) * 27}%`,
    top: `${progress * 94 + 3}%`,
  };
}

export function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;

      const { top, height } = section.getBoundingClientRect();
      setScrollProgress(
        clamp((window.innerHeight - top) / (height + window.innerHeight)),
      );
    };

    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <section id="timeline" className="proshow" ref={sectionRef}>
      <div className="timeline-intro">
        <p className="eyebrow">{TIMELINE.eyebrow}</p>
        <Reveal as="h2" className="proshow__title">
          {TIMELINE.title}
        </Reveal>
        <Reveal as="p" className="proshow__blurb">
          {TIMELINE.blurb}
        </Reveal>
      </div>

      <div className="timeline" aria-label="Two day event timeline">
        {TIMELINE.days.map((day, dayIndex) => (
          <Reveal as="article" className="timeline-day" key={day.label}>
            <header className="timeline-day__header">
              <div>
                <span className="timeline-day__label">{day.label}</span>
                <h3>{day.date}</h3>
              </div>
              <span className="timeline-day__count">0{dayIndex + 1} / 02</span>
            </header>

            <div className="timeline-track">
              <svg
                className="timeline-track__line"
                viewBox="0 0 100 1000"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M50 0 C10 100 90 180 50 280 S10 460 50 560 S90 740 50 840 S20 960 50 1000" />
              </svg>
              <img
                className="timeline-track__bot"
                src="/Timeline Bot.png"
                alt=""
                style={robotPosition(clamp(scrollProgress * 2 - dayIndex))}
                aria-hidden="true"
              />
              {day.checkpoints.map((checkpoint, checkpointIndex) => (
                <div className="checkpoint" key={checkpoint.title}>
                  <span className="checkpoint__dot" aria-hidden="true" />
                  <div className="checkpoint__card">
                    <span className="checkpoint__time">{checkpoint.time}</span>
                    <h4>{checkpoint.title}</h4>
                    <p>{checkpoint.detail}</p>
                  </div>
                  <span className="checkpoint__index">
                    0{checkpointIndex + 1}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default Timeline;
