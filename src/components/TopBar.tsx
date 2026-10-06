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
      <a className="topbar__cta" href="#passes">
        GET PASSES ↗
      </a>
    </header>
  );
}