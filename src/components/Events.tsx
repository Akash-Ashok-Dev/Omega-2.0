import { EVENTS } from "@/data/site";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Events() {
  return (
    <section id="events" className="events">
      <SectionHead
        index="02 / PROGRAMS"
        titleLines={["Pick your", "arena"]}
        aside="Events designed for builders, thinkers, gamers, artists, and everyone in between."
      />

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
    </section>
  );
}