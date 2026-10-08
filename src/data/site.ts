export type NavItem = {
  id: SectionId;
  index: string;
  label: string;
};

export type SectionId = "home" | "events" | "passes" | "timeline" | "rules";

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
  { id: "rules", index: "05", label: "RULES" },
] as const;

export const HERO = {
  eyebrow: "OMEGA 2.0 — Robotics Fest",
  title: "OMEGA",
  titleAccent: "2.0",
  blurb:
    "Two days of gears, wires, code, and combustion. Build bots, break records, and send sparks flying.",
  dates: "COMING SOON... / MEC, KOCHI, INDIA",
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
    image: "/MazeSolver.jpg",
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
    id: "Maze Solver",
    kind: "OMEGA 2.0 / Maze Solver",
    title: "Maze Solver",
    description: "Combats, maze runs & tech expos",
  },
] as const;

export const PASSES_TYPE: readonly Pass_type[] = [
  {
    id: "Line Follower",
    kind: "OMEGA 2.0 / RAS",
    title: "RAS",
    price: "REVEALING SOON",
  },
  {
    id: "Maze Solver",
    kind: "OMEGA 2.0/ IEEE",
    title: "IEEE",
    price: "REVEALING SOON",
  },
  {
    id: "day-03",
    kind: "OMEGA 2.0 / Non-IEEE",
    title: "Non-IEEE",
    price: "REVEALING SOON",
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
      date: "Coming Soon...",
      checkpoints: [
        { time: "09:00", title: "Registration starts", detail: "Teams check in and collect their bot tags." },
        { time: "10:30", title: "Line follower competition starts", detail: "The first run enters the arena." },
        { time: "16:30", title: "Line follower competition ends", detail: "Fastest clean runs move to the next day." },
        { time: "18:00", title: "Day 01 closes", detail: "Power down, recalibrate, come back sharper." },
      ],
    },
    {
      label: "DAY 02",
      date: "Coming Soon...",
      checkpoints: [
        { time: "09:30", title: "Pit lane opens", detail: "Final checks, repairs, and route briefing." },
        { time: "11:00", title: "Maze Solver starts", detail: "The remaining bots take the hard route." },
        { time: "15:30", title: "Maze Solver Ends", detail: "The final maze run locks in the rankings." },
        { time: "16:00", title: "Prize Distribution", detail: "Winners take the podium and collect their prizes." },
        { time: "18:00", title: "Culturals", detail: "Music, movement, and a proper festival wind-down." },
        { time: "19:30", title: "Day 02 closes", detail: "Awards, photos, and one last victory lap." },
      ],
    },
  ],
} as const;

export const TIMELINE_IMAGE = "/MazeSolver.jpg";

export const HERO_IMAGE = "/Hero Cover.jpg";

export const FOOTER = {
  titleLines: ["Autobots!", "Roll out."] as const,
  note: "© 2026 OMEGA 2.0 · Built by Akash Ashok.",
  contactEmail: "hello@omega2k.in",
} as const;

export type TeamMember = {
  name: string;
  role: string;
  email: string;
  phone: string;
};

export const TEAM: readonly TeamMember[] = [
  {
    name: "Aarjith",
    role: "RAS Chair",
    email: "aarjithvj@gmail.com",
    phone: "+91 89214 55932",
  },
  {
    name: "Anan",
    role: "Event Lead",
    email: "ananasad80@gmail.com",
    phone: "+91 80757 77821",
  },
  {
    name: "Srihari",
    role: "Tech Lead",
    email: "sriharidileep2@gmail.com",
    phone: "+91 95358 68056",
  },
  {
    name: "Sreesanker",
    role: "Ambiance Lead",
    email: "sreesankerg@gmail.com",
    phone: "+91 94966 41475",
  },
  {
    name: "Hrishidev",
    role: "Marketing Lead",
    email: "hrisidev2005@gmail.com",
    phone: "+91 79073 95973",
  },
  {
    name: "Fidha",
    role: "Publicity Head",
    email: "fidhafathimatj@gmail.com",
    phone: "+91 98470 55667",
  },
  {
    name: "Akash Ashok",
    role: "Web Lead",
    email: "akashashok3907@gmail.com",
    phone: "+91 77363 95106",
  },
] as const;

export const CONTACT = {
  windowTitle: "omega://contact-team",
  blurb:
    "Reach the humans behind OMEGA 2.0. Mail any of us directly, or ping the shared desk — we reply within a day.",
  desk: {
    email: "omegamec24@gmail.com",
    hours: "Mon–Sat / 10:00–18:00 IST",
    venue: "MEC, Kochi, India",
  },
  socials: [
    { label: "INSTAGRAM", href: "https://www.instagram.com/ieee.omega.mec/.com" },
    { label: "LINKEDIN", href: "https://www.linkedin.com/in/omega-mec-v2/" },
    { label: "WHATSAPP", href: "https://whatsapp.com/channel/0029VbDPraS4inon0RDhAd3P" },
  ],
} as const;

export type Rulebook = {
  id: string;
  tag: string;
  title: string;
  description: string;
  driveUrl: string;
  fileName: string;
};

export const RULES: readonly Rulebook[] = [
  {
    id: "line-follower",
    tag: "RULEBOOK / 01",
    title: "Line Follower",
    description:
      "Track specs, sensors, controller limits, lane rules, and how penalties are applied.",
    driveUrl: "https://drive.google.com/file/d/YOUR_LINE_FOLLOWER_FILE_ID/view",
    fileName: "Line_Follower_RuleBook.pdf",
  },
  {
    id: "maze-solver",
    tag: "RULEBOOK / 02",
    title: "Maze Solver",
    description:
      "Maze dimensions, maze-solving rules, time limits, scoring, and disqualifiers.",
    driveUrl: "https://drive.google.com/file/d/YOUR_MAZE_SOLVER_FILE_ID/view",
    fileName: "MazeSolver_RuleBook.pdf",
  },
] as const;
