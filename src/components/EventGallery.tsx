import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import { SectionHead } from "@/components/SectionHead";
import { EVENT_PICS } from "@/data/site";

const CARD_COUNT = EVENT_PICS.length;
const HALF = Math.floor(CARD_COUNT / 2);
const SPRING = 0.14;
const DAMPING = 0.78;

type GalleryCardStyle = CSSProperties & {
  "--offset": number;
  "--scale": number;
  "--opacity": number;
  "--blur": string;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startPosition: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
  axis: "x" | "y" | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ringOffset(index: number, position: number) {
  const raw =
    (((index - position + HALF + CARD_COUNT) % CARD_COUNT) + CARD_COUNT) %
    CARD_COUNT;

  return raw - HALF;
}

function dragStepPx() {
  return clamp(window.innerWidth * 0.3, 140, 360);
}

export function EventGallery() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const targetRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);

  const drag = useRef<DragState>({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startPosition: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
    axis: null,
  });

  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const activeIndex = useMemo(() => {
    const rounded = Math.round(position);
    return ((rounded % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
  }, [position]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = (now: number) => {
      const deltaTime = Math.min((now - last) / 16.667, 2);
      last = now;

      if (!draggingRef.current) {
        const difference = targetRef.current - positionRef.current;

        if (
          reduced ||
          (Math.abs(difference) < 0.0005 &&
            Math.abs(velocityRef.current) < 0.0005)
        ) {
          if (positionRef.current !== targetRef.current) {
            positionRef.current = targetRef.current;
            velocityRef.current = 0;
            setPosition(targetRef.current);
          }
        } else {
          velocityRef.current += difference * SPRING * deltaTime;
          velocityRef.current *= Math.pow(DAMPING, deltaTime);
          positionRef.current += velocityRef.current * deltaTime;

          if (
            Math.abs(targetRef.current - positionRef.current) < 0.0005 &&
            Math.abs(velocityRef.current) < 0.0005
          ) {
            positionRef.current = targetRef.current;
            velocityRef.current = 0;
          }

          setPosition(positionRef.current);
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let accumulated = 0;
    let lastStep = 0;

    const onWheel = (event: WheelEvent) => {
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (delta === 0) return;

      event.preventDefault();
      accumulated += delta;

      const now = performance.now();
      if (Math.abs(accumulated) >= 45 && now - lastStep > 110) {
        targetRef.current =
          Math.round(targetRef.current) + Math.sign(accumulated);
        velocityRef.current *= 0.4;
        accumulated = 0;
        lastStep = now;
      }
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  const goTo = useCallback((index: number) => {
    const offset = ringOffset(index, targetRef.current);
    targetRef.current = Math.round(targetRef.current + offset);
  }, []);

  const stepBy = useCallback((direction: number) => {
    targetRef.current = Math.round(targetRef.current) + direction;
    velocityRef.current *= 0.3;
  }, []);

  const handleCardClick = useCallback((index: number) => {
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }

    const offset = ringOffset(index, positionRef.current);
    if (Math.abs(offset) < 0.25) return;

    targetRef.current = Math.round(positionRef.current + offset);
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (draggingRef.current) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const state = drag.current;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startPosition = positionRef.current;
    state.lastX = event.clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
    state.moved = false;
    state.axis = null;

    draggingRef.current = true;
    velocityRef.current = 0;

    function cleanup() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    }

    function onMove(moveEvent: globalThis.PointerEvent) {
      if (moveEvent.pointerId !== state.pointerId) return;

      const dx = moveEvent.clientX - state.startX;
      const dy = moveEvent.clientY - state.startY;

      if (state.axis === null) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

        state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";

        if (state.axis === "y") {
          draggingRef.current = false;
          setIsDragging(false);
          cleanup();
          return;
        }

        setIsDragging(true);

        try {
          viewport?.setPointerCapture(moveEvent.pointerId);
        } catch {
          // Pointer capture can fail if the pointer was already released.
        }
      }

      if (state.axis !== "x") return;

      state.moved = true;
      moveEvent.preventDefault();

      const step = dragStepPx();
      const next = state.startPosition - dx / step;
      positionRef.current = next;
      setPosition(next);

      const now = performance.now();
      const elapsed = Math.max(8, now - state.lastTime);
      state.velocity = (moveEvent.clientX - state.lastX) / elapsed;
      state.lastX = moveEvent.clientX;
      state.lastTime = now;
    }

    function onUp(upEvent: globalThis.PointerEvent) {
      if (upEvent.pointerId !== state.pointerId) return;

      cleanup();
      draggingRef.current = false;
      setIsDragging(false);

      if (viewport?.hasPointerCapture(upEvent.pointerId)) {
        viewport.releasePointerCapture(upEvent.pointerId);
      }

      if (!state.moved) return;

      const step = dragStepPx();
      const momentum = clamp((-state.velocity / step) * 120, -2, 2);

      targetRef.current = Math.round(positionRef.current + momentum);
      velocityRef.current = clamp((-state.velocity / step) * 8, -0.22, 0.22);
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepBy(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepBy(-1);
    }
  };

  return (
    <section id="gallery" className="gallery" aria-label="Event pictures">
      <SectionHead
        index="// EVENT PICS"
        titleLines={["Scenes from", "the floor."]}
        aside="Drag the wheel, swipe, or scroll to rotate through moments from the arena."
      />

      <div
        ref={viewportRef}
        className={`gallery-viewport${isDragging ? " is-dragging" : ""}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Event picture wheel"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      >
        <div className="gallery-floor" aria-hidden="true" />

        <div className="gallery-stage">
          {EVENT_PICS.map((picture, index) => {
            const offset = ringOffset(index, position);
            const distance = Math.abs(offset);
            const active = distance < 0.5;
            const fadeStart = HALF;
            const fadeEnd = HALF + 0.5;
            const opacity =
              distance <= fadeStart
                ? 1 - distance * 0.26
                : Math.max(
                    0,
                    (1 - fadeStart * 0.26) *
                      (1 - (distance - fadeStart) / (fadeEnd - fadeStart)),
                  );

            const style: GalleryCardStyle = {
              "--offset": offset,
              "--scale": Math.max(0.6, 1 - distance * 0.12),
              "--opacity": opacity,
              "--blur": `${Math.min(3.5, distance * 1.25)}px`,
              zIndex: Math.round(100 - distance * 10),
              pointerEvents: opacity < 0.05 ? "none" : "auto",
            };

            return (
              <button
                key={picture.id}
                type="button"
                className={`gallery-card${active ? " is-active" : ""}`}
                style={style}
                onClick={() => handleCardClick(index)}
                aria-label={`${picture.title} — ${picture.tag}`}
                aria-current={active ? "true" : undefined}
                tabIndex={active ? 0 : -1}
              >
                <span className="gallery-card__frame">
                  <img
                    className="gallery-card__image"
                    src={picture.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <span className="gallery-card__scrim" aria-hidden="true" />
                  <span className="gallery-card__glass" aria-hidden="true" />
                  <span className="gallery-card__content">
                    <span className="gallery-card__tag">{picture.tag}</span>
                    <span className="gallery-card__title">
                      {picture.title}
                    </span>
                  </span>
                </span>

                <span
                  className="gallery-card__reflection"
                  style={{ backgroundImage: `url("${picture.image}")` }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <div className="gallery-hint" aria-hidden="true">
          DRAG / SCROLL
        </div>
      </div>

      <div className="gallery-controls">
        <div className="gallery-dots" aria-label="Choose a picture">
          {EVENT_PICS.map((picture, index) => (
            <button
              key={picture.id}
              type="button"
              className={`gallery-dot${
                index === activeIndex ? " is-active" : ""
              }`}
              aria-label={`Show ${picture.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </div>

        <div className="gallery-controls__right">
          <span className="gallery-counter" aria-live="polite">
            <span>{String(activeIndex + 1).padStart(2, "0")}</span> /{" "}
            {String(CARD_COUNT).padStart(2, "0")}
          </span>

          <div className="gallery-arrows">
            <button
              type="button"
              className="gallery-arrow"
              aria-label="Previous picture"
              onClick={() => stepBy(-1)}
            >
              ←
            </button>
            <button
              type="button"
              className="gallery-arrow"
              aria-label="Next picture"
              onClick={() => stepBy(1)}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
