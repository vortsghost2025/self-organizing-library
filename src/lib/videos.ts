export interface VideoEntry {
  youtubeId: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: "hackathon" | "system-demo";
}

export const videos: VideoEntry[] = [
  {
    youtubeId: "VjlNpj_ubNc",
    title: "Autonomous Elasticsearch Evolution Agent (v2 — Mar 2026)",
    description:
      "Autonomous agent that evolves Elasticsearch configurations — hackathon project demonstrating self-optimizing infrastructure (updated recording)",
    date: "2026-03-26",
    tags: ["elasticsearch", "autonomous-agent", "hackathon"],
    category: "hackathon",
  },
  {
    youtubeId: "R0-judyIpJk",
    title: "SwarmMind Self Optimizing Multi Agent AI System",
    description:
      "SwarmMind system demo — self-optimizing multi-agent AI architecture with emergent coordination",
    date: "2026-04-13",
    tags: ["swarmmind", "multi-agent", "self-optimizing"],
    category: "system-demo",
  },
  {
    youtubeId: "FPkSXbC5i18",
    title: "Persistent Multi-Lane Agent System (v0.1)",
    description:
      "4-lane persistent agent system — first recording showing Archivist, Library, SwarmMind, and Kernel-Lane operating together",
    date: "2026-04-21",
    tags: ["multi-lane", "persistent-agents", "4-lane-system"],
    category: "system-demo",
  },
  {
    youtubeId: "DqufiPRBALY",
    title: "Autonomous Elasticsearch Evolution Agent (v1 — Feb 2026)",
    description:
      "Earlier recording of the autonomous Elasticsearch evolution agent — initial hackathon demonstration",
    date: "2026-02-26",
    tags: ["elasticsearch", "autonomous-agent", "hackathon"],
    category: "hackathon",
  },
];

export const CHANNEL_META = {
  label: "YouTube",
  icon: "▶",
  color: "#FF0000",
  channelUrl: "https://www.youtube.com/@seandavidramsingh-s9z",
  channelName: "Sean David Ramsingh",
  rssFeed:
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCqPGQ-mXub8BV8KfeeQR6sA",
};

export const CATEGORY_META: Record<
  VideoEntry["category"],
  { label: string; description: string }
> = {
  hackathon: {
    label: "Hackathon Projects",
    description:
      "Autonomous agents and tools built during hackathons — rapid prototyping of self-evolving systems",
  },
  "system-demo": {
    label: "System Demos",
    description:
      "Live demonstrations of the multi-lane agent architecture — SwarmMind, persistent agents, and 4-lane coordination",
  },
};

export function getVideosByCategory(category: VideoEntry["category"]): VideoEntry[] {
  return videos.filter((v) => v.category === category);
}
