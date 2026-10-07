import { useEffect, useState } from "react";

const LOADER_DELAY = 1500;
const FADE_MS = 700;

export function Loader() {
  const [phase, setPhase] = useState<"on" | "exiting" | "gone">("on");

  useEffect(() => {
    const fade = window.setTimeout(() => setPhase("exiting"), LOADER_DELAY);
    const done = window.setTimeout(
      () => setPhase("gone"),
      LOADER_DELAY + FADE_MS,
    );

    return () => {
      window.clearTimeout(fade);
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
        <div className="loader__core" />
        <div className="loader__logo">Ω</div>
      </div>
    </div>
  );
}

export default Loader;
