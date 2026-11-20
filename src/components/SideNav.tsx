import type { ReactNode } from "react";
import { NAV_ITEMS } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV_ICONS: Record<string, ReactNode> = {
  home: (
    <svg {...iconProps}>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
    </svg>
  ),
  events: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  gallery: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  passes: (
    <svg {...iconProps}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2M13 11v2M13 17v2" />
    </svg>
  ),
  timeline: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  rules: (
    <svg {...iconProps}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z" />
    </svg>
  ),
  contact: (
    <svg {...iconProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export function SideNav() {
  const active = useActiveSection();

  return (
    <aside className="side-nav">
      <a className="brand" href="#home">
        <img className="brand__logo" src="/Omega%20Logo.jpeg" alt="Omega 26" />
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
            <span className="nav-link__icon" aria-hidden="true">
              {NAV_ICONS[item.id]}
            </span>
            <span className="nav-link__label">/ {item.label}</span>
          </a>
        ))}
        <a className="nav-link" href="#contact">
          <span className="nav-link__index">07</span>
          <span className="nav-link__icon" aria-hidden="true">
            {NAV_ICONS.contact}
          </span>
          <span className="nav-link__label">/ MEET TEAM</span>
        </a>
      </nav>

      <div className="year">
        2027
        <br />
        INDIA
      </div>
    </aside>
  );
}
