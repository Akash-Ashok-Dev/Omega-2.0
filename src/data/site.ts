export type NavItem = {
  id: SectionId;
  index: string;
  label: string;
};

export type SectionId = "home" | "events" | "passes" | "timeline";

export type FestEvent = {
  id: string;
  tag: string;
  title: string;
  description: string;
  image: string;
  large?: boolean;
};

export type Pass = {
  id: string;
  kind: string;
  title: string;
  description: string;
};

export type Pass_type = {
  id: string;
  kind: string;
  title: string;
  price: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "home", index: "01", label: "HOME" },
  { id: "events", index: "02", label: "EVENTS" },
  { id: "passes", index: "03", label: "PASSES" },
  { id: "timeline", index: "04", label: "TIMELINE" },
] as const;

export const HERO = {
  eyebrow: "OMEGA 2.0 — Robotics Fest",
  title: "OMEGA",
  titleAccent: "2.0",
  blurb:
    "Three days of gears, wires, code, and combustion. Build bots, break records, and send sparks flying.",
  dates: "DEC 4—5 / MEC, KOCHI, INDIA",
  status: "SYSTEM ONLINE",
} as const;

export const MARQUEE_WORDS = [
  "OPTIMUS PRIME",
  "BUMBLEBEE",
  "MEGATRON",
  "GRIMLOCK",
  "THE NEXT COULD BE YOURS",
  "OMEGA 2.0",
] as const;

export const EVENTS: readonly FestEvent[] = [
  {
    id: "line-follower",
    tag: "AUTONOMOUS",
    title: "Line Follower",
    description:
      "Race your self-guided bot along a razor-sharp track. Speed, precision, and PID mastery.",
    large: true,
    image:
      "https://images.unsplash.com/photo-1581091215367-59ab6b1e8d83?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "mazesolver",
    tag: "PATHFINDING",
    title: "Maze Solver",
    description: "Shortest path. Tight turns. Pure algorithmic brute force.",
    image:
      "https://images.unsplash.com/photo-1609358904803-534b24cf30eb?auto=format&fit=crop&w=900&q=85",
  },
] as const;

export const PASSES: readonly Pass[] = [
  {
    id: "Line Follower",
    kind: "OMEGA 2.0 / Line Follower",
    title: "Line Follower",
    description: "Robotics workshops, prelims & arena time",
  },
  {
    id: "Micro Mouse",
    kind: "OMEGA 2.0 / Micro Mouse",
    title: "Micro Mouse",
    description: "Combats, maze runs & tech expos",
  },
] as const;

export const PASSES_TYPE: readonly Pass_type[] = [
  {
    id: "Line Follower",
    kind: "OMEGA 2.0 / RAS",
    title: "RAS",
    price: "₹999",
  },
  {
    id: "Micro Mouse",
    kind: "OMEGA 2.0/ IEEE",
    title: "IEEE",
    price: "₹1499",
  },
  {
    id: "day-03",
    kind: "OMEGA 2.0 / Non-IEEE",
    title: "Non-IEEE",
    price: "₹1799",
  },
] as const;


export const TIMELINE = {
  eyebrow: "FIELD LOG / OMEGA 2.0",
  title: "Follow the line.",
  blurb:
    "Two days. One course. Keep your bot on the bright line and hit every checkpoint before the final flag.",
  days: [
    {
      label: "DAY 01",
      date: "DEC 4",
      checkpoints: [
        { time: "09:00", title: "Registration starts", detail: "Teams check in and collect their bot tags." },
        { time: "10:30", title: "Line follower competition starts", detail: "The first run enters the arena." },
        { time: "16:30", title: "Qualifiers end", detail: "Fastest clean runs move to the next day." },
        { time: "18:00", title: "Day 01 closes", detail: "Power down, recalibrate, come back sharper." },
      ],
    },
    {
      label: "DAY 02",
      date: "DEC 5",
      checkpoints: [
        { time: "09:30", title: "Pit lane opens", detail: "Final checks, repairs, and route briefing." },
        { time: "11:00", title: "Line follower finals start", detail: "The remaining bots take the hard route." },
        { time: "15:30", title: "Finals end", detail: "The last lap decides the podium." },
        { time: "17:00", title: "Day 02 closes", detail: "Awards, photos, and one last victory lap." },
      ],
    },
  ],
} as const;

export const TIMELINE_IMAGE =
  "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=2000&q=85";

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=2000&q=85";

export const FOOTER = {
  titleLines: ["Autobots!", "Roll out."] as const,
  note: "© 2026 OMEGA 2.0 · Built for tinkerers & circuit breakers.",
  contactEmail: "hello@omega2k.in",
} as const;
