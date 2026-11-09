export type NavItem = {
  id: SectionId;
  index: string;
  label: string;
};

export type SectionId =
  | "home"
  | "events"
  | "gallery"
  | "passes"
  | "timeline"
  | "rules";

export type FestEvent = {
  id: string;
  tag: string;
  title: string;
  description: string;
  image: string;
  accent?: string;
  large?: boolean;
};

export type EventPic = {
  id: string;
  tag: string;
  title: string;
  image: string;
  mediaType: "image" | "video";
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
  { id: "gallery", index: "03", label: "EVENT PICS" },
  { id: "passes", index: "04", label: "PASSES" },
  { id: "timeline", index: "05", label: "TIMELINE" },
  { id: "rules", index: "06", label: "RULES" },
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
      "Race your self-guided bot along a razor-sharp track. Speed, precision, and PID mastery decide who stays on the line.",
    accent: "#ffd400",
    large: true,
    image: "/LineFollower.jpg",
  },
  {
    id: "maze-solver",
    tag: "PATHFINDING",
    title: "Maze Solver",
    description:
      "Shortest path. Tight turns. Pure algorithmic brute force. Give your bot the map and let it think faster than the clock.",
    accent: "#ffb300",
    image: "/MazeSolver.jpg",
  },
] as const;

export const EVENT_PICS: readonly EventPic[] = [
  {
    id: "line-follower",
    tag: "EVENT / 01",
    title: "Omega 1.0",
    image: "/eventPics/1.jpeg",
    mediaType: "image",
  },
  {
    id: "maze-solver",
    tag: "EVENT REEL / 02",
    title: "Event Reel 02",
    image: "/eventPics/2.jpeg",
    mediaType: "image",
  },
  {
    id: "event-video-03",
    tag: "EVENT REEL / 03",
    title: "Event Reel 03",
    image: "/eventPics/3.mp4",
    mediaType: "video",
  },
  {
    id: "event-video-04",
    tag: "EVENT REEL / 04",
    title: "Event Reel 04",
    image: "/eventPics/4.mp4",
    mediaType: "video",
  },
  {
    id: "event-video-05",
    tag: "EVENT REEL / 05",
    title: "Event Reel 05",
    image: "/eventPics/5.mp4",
    mediaType: "video",
  },
  {
    id: "event-video-06",
    tag: "EVENT REEL / 06",
    title: "Event Reel 06",
    image: "/eventPics/6.mp4",
    mediaType: "video",
  },
  {
    id: "event-video-07",
    tag: "EVENT REEL / 07",
    title: "Event Reel 07",
    image: "/eventPics/7.mp4",
    mediaType: "video",
  },
  {
    id: "event-video-08",
    tag: "EVENT REEL / 08",
    title: "Event Reel 08",
    image: "/eventPics/8.mp4",
    mediaType: "video",
  },
  {
    id: "event-video-09",
    tag: "EVENT REEL / 09",
    title: "Event Reel 09",
    image: "/eventPics/9.mp4",
    mediaType: "video",
  },
  {
    id: "event-video-10",
    tag: "EVENT REEL / 10",
    title: "Event Reel 10",
    image: "/eventPics/10.mp4",
    mediaType: "video",
  },
  {
    id: "event-video-11",
    tag: "EVENT REEL / 11",
    title: "Event Reel 11",
    image: "/eventPics/11.mp4",
    mediaType: "video",
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
    price: "1799",
  },
  {
    id: "Maze Solver",
    kind: "OMEGA 2.0/ IEEE",
    title: "IEEE",
    price: "1799",
  },
  {
    id: "day-03",
    kind: "OMEGA 2.0 / Non-IEEE",
    title: "Non-IEEE",
    price: "1799",
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
