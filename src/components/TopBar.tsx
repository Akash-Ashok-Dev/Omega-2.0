import { HERO } from "@/data/site";
import { AutobotDevice } from "@/components/AutobotDevice";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="status">{HERO.status}</div>
        <AutobotDevice />
      </div>
      <div className="topbar__dates">{HERO.dates}</div>
      <div className="topbar__actions">
        <a className="topbar__cta" href="/ticket">
          MY TICKET
        </a>
        <a className="topbar__cta" href="#contact">
          MEET THE TEAM ↗
        </a>
      </div>
    </header>
  );
}