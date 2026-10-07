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
    image: "/MicroMouse.jpg",
  },
  {
    id: "mazesolver",
    tag: "PATHFINDING",
    title: "Maze Solver",
    description: "Shortest path. Tight turns. Pure algorithmic brute force.",
    image: "/LIne follower .jpg",
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

export const TIMELINE_IMAGE = "/MicroMouse.jpg";

export const HERO_IMAGE = "/Hero Cover.jpg";

export const FOOTER = {
  titleLines: ["Autobots!", "Roll out."] as const,
  note: "© 2026 OMEGA 2.0 · Built by Akash Ashok.",
  contactEmail: "hello@omega2k.in",
} as const;

export type TeamMember = {
  name: string;
  role: string;
  focus: string;
  email: string;
  phone: string;
};

export const TEAM: readonly TeamMember[] = [
  {
    name: "Ethan",
    role: "Event Lead",
    focus: "Overall ops, sponsors, and stage",
    email: "aarav@omega2k.in",
    phone: "+91 98470 11223",
  },
  {
    name: "Anan",
    role: "Event Lead",
    focus: "Robowars, line follower, micromouse",
    email: "diya@omega2k.in",
    phone: "+91 98470 44556",
  },
  {
    name: "Aarjith",
    role: "Tech & Workshops",
    focus: "Hack tracks, dev tooling, labs",
    email: "rohan@omega2k.in",
    phone: "+91 98470 77889",
  },
  {
    name: "Sreehari",
    role: "Design & Creative",
    focus: "Posters, motion, merch, web",
    email: "meera@omega2k.in",
    phone: "+91 98470 22334",
  },
  {
    name: "Fidha",
    role: "Publicity Head",
    focus: "Partners, booths, and swag",
    email: "kabir@omega2k.in",
    phone: "+91 98470 55667",
  },
  {
    name: "Akash Ashok",
    role: "Web Lead",
    focus: "Web",
    email: "ananya@omega2k.in",
    phone: "+91 98470 88990",
  },
] as const;

export const CONTACT = {
  windowTitle: "omega://contact-team",
  blurb:
    "Reach the humans behind OMEGA 2.0. Mail any of us directly, or ping the shared desk — we reply within a day.",
  desk: {
    email: "omegamec24@gmail.com",
    phone: "+91 98470 00000",
    hours: "Mon–Sat / 10:00–18:00 IST",
    venue: "CS Dept, Kochi, India",
  },
  socials: [
    { label: "INSTAGRAM", href: "https://www.instagram.com/ieee.omega.mec/.com" },
    { label: "LINKEDIN", href: "https://www.linkedin.com/in/omega-mec-v2/" },
    { label: "WHATSAPP", href: "https://whatsapp.com/channel/0029VbDPraS4inon0RDhAd3P" },
  ],
} as const;
