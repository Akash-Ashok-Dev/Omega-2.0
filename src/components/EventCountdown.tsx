import { useEffect, useState } from "react";

import { EVENT_END, EVENT_START } from "@/data/site";

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  live: boolean;
  done: boolean;
};

const START_TIME = new Date(EVENT_START).getTime();
const END_TIME = new Date(EVENT_END).getTime();

function getCountdownState(): CountdownState {
  const now = Date.now();

  if (now >= END_TIME) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, live: false, done: true };
  }

  if (now >= START_TIME) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, live: true, done: false };
  }

  const remaining = Math.max(0, START_TIME - now);
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
    live: false,
    done: false,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function EventCountdown() {
  const [state, setState] = useState(getCountdownState);

  useEffect(() => {
    const timer = window.setInterval(() => setState(getCountdownState()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="countdown" aria-label="Countdown to Omega 2.0">
      <p className="countdown__label">
        <time dateTime={EVENT_START}>JAN 16—17, 2027</time>
      </p>

      {state.done || state.live ? (
        <p className="countdown__status" aria-live="polite">
          {state.live ? "EVENT LIVE" : "EVENT CONCLUDED"}
        </p>
      ) : (
        <div className="countdown__units">
          {[
            { label: "DAYS", value: state.days },
            { label: "HRS", value: state.hours },
            { label: "MIN", value: state.minutes },
            { label: "SEC", value: state.seconds },
          ].map((unit) => (
            <div className="countdown__unit" key={unit.label}>
              <span className="countdown__value">{pad(unit.value)}</span>
              <span className="countdown__unit-label">{unit.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
