import { useState, type CSSProperties, type KeyboardEvent } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { EVENTS } from "@/data/site";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

type EventPanelStyle = CSSProperties & {
  "--event-accent": string;
};

const LAPTOP_QUERY = "(min-width: 1081px)";

export function Events() {
  const isLaptop = useMediaQuery(LAPTOP_QUERY);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    index: number,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    setActiveIndex(index);
  };

  const heading = (
    <SectionHead
      index="02 / PROGRAMS"
      titleLines={["Pick your", "arena"]}
      aside="Two arenas. One weekend. Pick the challenge that matches your build."
    />
  );

  return (
    <section id="events" className="events">
      {isLaptop ? (
        <div className="event-split">
          <div className="event-split__intro">
            {heading}
            <div className="event-split__meta">
              <span className="event-split__meta-key">// 02 ARENAS</span>
              <span className="event-split__meta-hint">
                HOVER / CLICK TO EXPAND
              </span>
            </div>
          </div>

          <div className="event-split__stage">
            <div className="event-accordion event-accordion--duo">
              {EVENTS.map((event, index) => {
                const active = index === activeIndex;

                return (
                  <article
                    key={event.id}
                    className={`event-panel${active ? " is-active" : ""}`}
                    style={
                      {
                        "--event-accent": event.accent ?? "var(--lime)",
                      } as EventPanelStyle
                    }
                    onClick={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onKeyDown={(keyboardEvent) =>
                      handleKeyDown(keyboardEvent, index)
                    }
                    tabIndex={0}
                    role="button"
                    aria-expanded={active}
                    aria-label={`${event.title} — ${event.tag}`}
                  >
                    <img
                      className="event-panel__image"
                      src={event.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                    <span className="event-panel__scrim" aria-hidden="true" />
                    <span className="event-panel__glow" aria-hidden="true" />

                    <span className="event-panel__rail" aria-hidden="true">
                      <span className="event-panel__index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="event-panel__vertical-title">
                        {event.title}
                      </span>
                      <span className="event-panel__plus">+</span>
                    </span>

                    <span className="event-panel__content">
                      <span className="event-panel__kicker">{event.tag}</span>
                      <h3>{event.title}</h3>
                      <p>{event.description}</p>
                    </span>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {heading}
          <div className="event-grid">
            {EVENTS.map((event) => (
              <Reveal
                as="article"
                key={event.id}
                className={`event-card${event.large ? " event-card--large" : ""}`}
              >
                <img
                  className="event-card__image"
                  src={event.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <div className="event-card__scrim" aria-hidden="true" />

                <div className="tag">{event.tag}</div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
