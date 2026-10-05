import { NAV_ITEMS } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";

export function SideNav() {
  const active = useActiveSection();

  return (
    <aside className="side-nav">
      <a className="brand" href="#home">
        Ω&apos;26
      </a>

      <nav className="nav-links" aria-label="Section navigation">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="nav-link"
            aria-current={active === item.id ? "true" : undefined}
          >
            <span className="nav-link__index">{item.index}</span>
            <span className="nav-link__label">/ {item.label}</span>
          </a>
        ))}
      </nav>

      <div className="year">
        2026
        <br />
        INDIA
      </div>
    </aside>
  );
}
