export type NavItem = {
  id: SectionId;
  index: string;
  label: string;
};

export type SectionId = "home" | "events" | "passes" | "proshow";

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
  price: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "home", index: "01", label: "HOME" },
  { id: "events", index: "02", label: "EVENTS" },
  { id: "passes", index: "03", label: "PASSES" },
  { id: "proshow", index: "04", label: "PROSHOW" },
] as const;

export const HERO = {
  eyebrow: "Annual Techno-Cultural Festival",
  title: "NEXUS",
  titleAccent: "UNBOUND",
  blurb:
    "Three days of technology, culture, machines, ideas, music, competition, and conversations that shape what comes next.",
  dates: "OCT 16—18 / KOCHI, INDIA",
  status: "SYSTEM ONLINE",
} as const;

export const MARQUEE_WORDS = [
  "INNOVATE",
  "BUILD",
  "COMPETE",
  "CREATE",
  "EXPERIENCE",
  "NEXUS '26",
] as const;

export const EVENTS: readonly FestEvent[] = [
  {
    id: "workshops",
    tag: "TECHNICAL",
    title: "Workshops",
    description:
      "Hands-on sessions on AI, robotics, web development, design, cybersecurity, and more.",
    large: true,
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "robowars",
    tag: "BATTLE",
    title: "Robowars",
    description: "Steel, sparks, strategy.",
    image:
      "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "gameverse",
    tag: "GAMING",
    title: "Gameverse",
    description: "Take the arena. Own the leaderboard.",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "proshows",
    tag: "CULTURAL",
    title: "Proshows",
    description:
      "Live music, performers, visual spectacle, and a crowd that refuses to stand still.",
    large: true,
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "conclave",
    tag: "SPEAKERS",
    title: "Conclave",
    description: "Ideas from people building tomorrow.",
    image:
      "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=900&q=85",
  },
] as const;

export const PASSES: readonly Pass[] = [
  {
    id: "day-01",
    kind: "NEXUS '26 / ADMIT ONE",
    title: "Day 01",
    description: "Events, competitions, conclave",
    price: "₹399",
  },
  {
    id: "day-02",
    kind: "NEXUS '26 / ADMIT ONE",
    title: "Day 02",
    description: "Workshops, gaming, proshow",
    price: "₹599",
  },
  {
    id: "day-03",
    kind: "NEXUS '26 / ADMIT ONE",
    title: "Day 03",
    description: "Finals, showcase, proshow",
    price: "₹799",
  },
  {
    id: "full-fest",
    kind: "NEXUS '26 / ALL ACCESS",
    title: "Full Fest",
    description: "Every day. Every moment.",
    price: "₹1,499",
  },
] as const;

export const PROSHOW = {
  eyebrow: "The main stage / October 18",
  titleLines: ["Feel the", "frequency."] as const,
  blurb:
    "When the sun goes down, NEXUS turns into a massive live-music playground featuring headline artists, DJ sets, visual installations, and thousands of voices in sync.",
  details: [
    { label: "VENUE", value: "Main Arena" },
    { label: "GATES", value: "06:00 PM" },
    { label: "ENTRY", value: "Festival Pass Required" },
  ] as const,
} as const;

export const PROSHOW_IMAGE =
  "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=2000&q=85";

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=2000&q=85";

export const FOOTER = {
  titleLines: ["See you", "in the future."] as const,
  note: "© 2026 NEXUS FESTIVAL · Built for curious minds.",
  contactEmail: "hello@nexusfest.in",
} as const;