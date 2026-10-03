import { HERO } from "@/data/site";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="status">{HERO.status}</div>
      <div className="topbar__dates">{HERO.dates}</div>
      <a className="topbar__cta" href="#passes">
        GET PASSES ↗
      </a>
    </header>
  );
}