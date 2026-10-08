import { useEffect, useState } from "react";

const COUNTDOWN_SECONDS = 10;
const LOGO_DELAY = 900;
const FADE_MS = 700;

export function Loader() {
  const [phase, setPhase] = useState<"on" | "exiting" | "gone">("on");
  const [countdown, setCountdown] = useState<number | null>(COUNTDOWN_SECONDS);

  useEffect(() => {
    let fade: number | undefined;

    const countdownTimer = window.setInterval(() => {
      setCountdown((current) => {
        if (current === null || current <= 1) {
          window.clearInterval(countdownTimer);
          fade = window.setTimeout(() => setPhase("exiting"), LOGO_DELAY);
          return null;
        }

        return current - 1;
      });
    }, 1000);

    const done = window.setTimeout(
      () => setPhase("gone"),
      COUNTDOWN_SECONDS * 1000 + LOGO_DELAY + FADE_MS,
    );

    return () => {
      window.clearInterval(countdownTimer);
      if (fade !== undefined) window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`loader ${phase === "exiting" ? "loader--off" : ""}`}
      aria-hidden="true"
    >
      <div className="loader__ring">
        {countdown !== null ? (
          <div className="loader__countdown">{countdown}</div>
        ) : (
          <img className="loader__logo" src="/Omega%20Logo.jpeg" alt="" />
        )}
      </div>
    </div>
  );
}

export default Loader;
