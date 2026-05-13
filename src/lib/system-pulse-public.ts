import fs from "fs";
import path from "path";
import { collectTimelineEvents } from "@/lib/system-timeline";

type LaneId = "archivist" | "library" | "swarmmind" | "kernel";
type LaneHealth = "active" | "watch" | "blocked" | "down";
type IssueType = "operator" | "agent" | "code" | "info";
type SurfaceStatus = "active" | "watch" | "limited" | "offline";
type SurfaceId = "local" | "headless" | "gastown" | "control-plane";

interface HeadlessLaneSnapshot {
  lane: LaneId;
  state?: string;
  head?: string;
  dirty?: string;
  focus?: string;
  last_cycle_start?: string;
  last_cycle_exit?: string;
  repo?: string;
  log?: string;
}

interface HeadlessSnapshot {
  timestamp: string;
  event?: string;
  lanes?: HeadlessLaneSnapshot[];
}

interface LocalHeartbeatSummary {
  lane: LaneId;
  status: "fresh" | "stale" | "missing";
  lastHeartbeat: string | null;
}

export interface SystemPulseLane {
  id: LaneId;
  label: string;
  role: string;
  whatItDoes: string;
  health: LaneHealth;
  type: IssueType;
  changed: string;
  summary: string;
  surface: "headless" | "local";
  lastUpdated: string | null;
  head?: string | null;
  dirty?: string | null;
}

export interface SystemPulseSurface {
  id: SurfaceId;
  label: string;
  status: SurfaceStatus;
  summary: string;
  description: string;
}

export interface SystemPulseTimelineItem {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  lane: LaneId | "system";
  surface: "headless" | "site" | "local" | "gastown" | "control-plane";
  type: "governance" | "verification" | "graph" | "coordination" | "activity";
}

export interface SystemPulseData {
  generatedAt: string;
  title: string;
  summary: string;
  focus: string;
  stats: {
    totalLanes: number;
    activeHeadless: number;
    blockedHeadless: number;
    localSignals: number;
    timelineEvents: number;
  };
  lanes: SystemPulseLane[];
  surfaces: SystemPulseSurface[];
  blockers: Array<{
    lane: LaneId;
    summary: string;
    type: IssueType;
  }>;
  recentChanges: Array<{
    lane: LaneId;
    changed: string;
    summary: string;
  }>;
  timeline: SystemPulseTimelineItem[];
}

const REPO_ROOT = process.cwd();
const CONTROL_PLANE_ROOT = "S:/WE4FREE-Control-Plane";
const HEADLESS_JOURNAL_PATH = path.join(CONTROL_PLANE_ROOT, "agent-logs", "headless-supervision-journal.jsonl");
const CONTROL_PLANE_FILES = [
  path.join(CONTROL_PLANE_ROOT, "agent-logs", "latest-headless-supervision-board.md"),
  path.join(CONTROL_PLANE_ROOT, "agent-logs", "latest-headless-supervision-dashboard.html"),
  HEADLESS_JOURNAL_PATH,
];
const HEADLESS_FRESHNESS_MS = 30 * 60 * 1000;
const LOCAL_FRESHNESS_MS = 15 * 60 * 1000;

const LANE_META: Record<LaneId, { label: string; role: string; whatItDoes: string }> = {
  archivist: {
    label: "Archivist",
    role: "Final authority",
    whatItDoes: "Ratifies proposals, stores permanent artifacts, and maintains the canonical record.",
  },
  swarmmind: {
    label: "SwarmMind",
    role: "Idea engine",
    whatItDoes: "Generates proposals, runs autonomous loops, and challenges existing assumptions.",
  },
  library: {
    label: "Library",
    role: "Verification",
    whatItDoes: "Proves or rejects claims with runtime evidence before anything can be ratified.",
  },
  kernel: {
    label: "Kernel",
    role: "Infrastructure",
    whatItDoes: "Maintains system health, coordinates cross-lane work, and keeps runtime routing intact.",
  },
};

const LOCAL_HEARTBEAT_PATHS: Record<LaneId, string> = {
  library: path.join(REPO_ROOT, "lanes", "library", "inbox", "heartbeat-library.json"),
  archivist: "S:/Archivist-Agent/lanes/archivist/inbox/heartbeat-archivist.json",
  swarmmind: "S:/SwarmMind/lanes/swarmmind/inbox/heartbeat-swarmmind.json",
  kernel: "S:/kernel-lane/lanes/kernel/inbox/heartbeat-kernel.json",
};

function readJsonSafe<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function readHeadlessSnapshots(): HeadlessSnapshot[] {
  if (!fs.existsSync(HEADLESS_JOURNAL_PATH)) {
    return [];
  }

  try {
    return fs
      .readFileSync(HEADLESS_JOURNAL_PATH, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as HeadlessSnapshot)
      .filter((entry) => entry.timestamp && Array.isArray(entry.lanes))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch {
    return [];
  }
}

function sanitizeSummary(raw: string | undefined | null): string {
  if (!raw) {
    return "No current activity summary captured.";
  }

  const cleaned = raw
    .replace(/S:\\[^|\n]+/g, "local source")
    .replace(/C:\\[^|\n]+/g, "local source")
    .replace(/\/home\/[^|\n]+/g, "headless source")
    .replace(/https?:\/\/\S+/g, "public link")
    .replace(/\s*\|\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= 170) {
    return cleaned;
  }

  return `${cleaned.slice(0, 167).trimEnd()}…`;
}

function inferLaneHealth(state: string | undefined, summary: string): LaneHealth {
  const normalizedState = (state || "").toUpperCase();
  const normalizedSummary = summary.toLowerCase();

  if (normalizedState && normalizedState !== "RUNNING") {
    return "down";
  }

  if (
    normalizedSummary.includes("blocked") ||
    normalizedSummary.includes("error:") ||
    normalizedSummary.includes("compaction exhausted") ||
    normalizedSummary.includes("cannot pull with rebase") ||
    normalizedSummary.includes("failed")
  ) {
    return "blocked";
  }

  if (
    normalizedSummary.includes("warning") ||
    normalizedSummary.includes("stale") ||
    normalizedSummary.includes("investigation needed") ||
    normalizedSummary.includes("next recommended task")
  ) {
    return "watch";
  }

  return "active";
}

function inferIssueType(summary: string): IssueType {
  const normalized = summary.toLowerCase();

  if (
    normalized.includes("secret") ||
    normalized.includes("operator") ||
    normalized.includes("rotate") ||
    normalized.includes("key")
  ) {
    return "operator";
  }

  if (
    normalized.includes("compaction") ||
    normalized.includes("nack") ||
    normalized.includes("queue") ||
    normalized.includes("heartbeat")
  ) {
    return "agent";
  }

  if (
    normalized.includes("fix") ||
    normalized.includes("test") ||
    normalized.includes("commit") ||
    normalized.includes("build") ||
    normalized.includes("node") ||
    normalized.includes("script")
  ) {
    return "code";
  }

  return "info";
}

function describeChange(current: HeadlessLaneSnapshot, previous?: HeadlessLaneSnapshot): string {
  if (!previous) {
    return "first snapshot";
  }

  const changes: string[] = [];

  if (current.head !== previous.head) {
    changes.push("head");
  }
  if (current.dirty !== previous.dirty) {
    changes.push("dirty");
  }
  if ((current.focus || "") !== (previous.focus || "")) {
    changes.push("focus");
  }
  if ((current.state || "") !== (previous.state || "")) {
    changes.push("state");
  }

  return changes.length > 0 ? changes.join("+") : "same";
}

function buildLocalHeartbeatSummary(): LocalHeartbeatSummary[] {
  const now = Date.now();

  return (Object.entries(LOCAL_HEARTBEAT_PATHS) as Array<[LaneId, string]>).map(([lane, filePath]) => {
    const payload = readJsonSafe<{ timestamp?: string }>(filePath);
    const timestamp = payload?.timestamp || null;
    if (!timestamp) {
      return { lane, status: "missing", lastHeartbeat: null };
    }

    const age = now - new Date(timestamp).getTime();
    if (Number.isNaN(age)) {
      return { lane, status: "missing", lastHeartbeat: null };
    }

    return {
      lane,
      status: age <= LOCAL_FRESHNESS_MS ? "fresh" : "stale",
      lastHeartbeat: timestamp,
    };
  });
}

function buildHeadlessLanes(snapshots: HeadlessSnapshot[]): SystemPulseLane[] {
  const latest = snapshots.at(-1);
  const previous = snapshots.length > 1 ? snapshots.at(-2) : undefined;

  const lanes = (latest?.lanes || []).map((lane) => {
    const previousLane = previous?.lanes?.find((entry) => entry.lane === lane.lane);
    const meta = LANE_META[lane.lane];
    const summary = sanitizeSummary(lane.focus);

    return {
      id: lane.lane,
      label: meta.label,
      role: meta.role,
      whatItDoes: meta.whatItDoes,
      health: inferLaneHealth(lane.state, summary),
      type: inferIssueType(summary),
      changed: describeChange(lane, previousLane),
      summary,
      surface: "headless",
      lastUpdated: latest?.timestamp || null,
      head: lane.head || null,
      dirty: lane.dirty || null,
    } satisfies SystemPulseLane;
  });

  if (lanes.length > 0) {
    return lanes;
  }

  return (Object.entries(LANE_META) as Array<[LaneId, (typeof LANE_META)[LaneId]]>).map(([lane, meta]) => ({
    id: lane,
    label: meta.label,
    role: meta.role,
    whatItDoes: meta.whatItDoes,
    health: "watch",
    type: "info",
    changed: "same",
    summary: "Headless supervision is not currently attached, so this page is showing site-native governance history only.",
    surface: "headless",
    lastUpdated: null,
    head: null,
    dirty: null,
  }));
}

function buildHeadlessTimeline(snapshots: HeadlessSnapshot[]): SystemPulseTimelineItem[] {
  const items: SystemPulseTimelineItem[] = [];

  for (let index = Math.max(0, snapshots.length - 8); index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];
    const previous = index > 0 ? snapshots[index - 1] : undefined;
    const lanes = snapshot.lanes || [];

    for (const lane of lanes) {
      const previousLane = previous?.lanes?.find((entry) => entry.lane === lane.lane);
      const changed = describeChange(lane, previousLane);
      if (previousLane && changed === "same") {
        continue;
      }

      const summary = sanitizeSummary(lane.focus);
      items.push({
        id: `headless:${snapshot.timestamp}:${lane.lane}`,
        timestamp: snapshot.timestamp,
        title: `${LANE_META[lane.lane].label} headless snapshot`,
        summary: changed === "first snapshot" ? summary : `${changed}: ${summary}`,
        lane: lane.lane,
        surface: "headless",
        type: "activity",
      });
    }
  }

  return items;
}

function buildSiteTimeline(): SystemPulseTimelineItem[] {
  return collectTimelineEvents(8).map((event) => ({
    id: `site:${event.id}`,
    timestamp: event.timestamp,
    title: event.title,
    summary: sanitizeSummary(event.description),
    lane: event.lane,
    surface: "site",
    type:
      event.type === "deployment" || event.type === "contradiction"
        ? "coordination"
        : event.type,
  }));
}

function buildSurfaces(
  headlessLanes: SystemPulseLane[],
  localHeartbeats: LocalHeartbeatSummary[],
  timelineCount: number,
): SystemPulseSurface[] {
  const freshLocalCount = localHeartbeats.filter((item) => item.status === "fresh").length;
  const seenLocalCount = localHeartbeats.filter((item) => item.status !== "missing").length;
  const activeHeadless = headlessLanes.filter((lane) => lane.health === "active").length;
  const blockedHeadless = headlessLanes.filter((lane) => lane.health === "blocked" || lane.health === "down").length;
  const hasControlPlaneFiles = CONTROL_PLANE_FILES.some((filePath) => fs.existsSync(filePath));
  const latestHeadlessTimestamp = headlessLanes.find((lane) => lane.lastUpdated)?.lastUpdated;
  const latestHeadlessAge = latestHeadlessTimestamp ? Date.now() - new Date(latestHeadlessTimestamp).getTime() : Number.POSITIVE_INFINITY;

  const localStatus: SurfaceStatus =
    freshLocalCount > 0 ? "active" : seenLocalCount > 0 ? "watch" : "limited";

  const headlessStatus: SurfaceStatus =
    activeHeadless === 0 && blockedHeadless === 0
      ? "limited"
      : blockedHeadless > 0
        ? "watch"
        : latestHeadlessAge <= HEADLESS_FRESHNESS_MS
          ? "active"
          : "watch";

  return [
    {
      id: "local",
      label: "Local",
      status: localStatus,
      summary:
        freshLocalCount > 0
          ? `${freshLocalCount}/4 lane heartbeats are fresh on the workstation surface.`
          : seenLocalCount > 0
            ? `${seenLocalCount}/4 lane heartbeats are visible locally, but they are stale.`
            : "No fresh workstation heartbeats are being published to the public view right now.",
      description:
        "Direct workstation activity. Best for hands-on edits, immediate verification, and short-lived experiments before they become governance artifacts.",
    },
    {
      id: "headless",
      label: "Headless",
      status: headlessStatus,
      summary:
        activeHeadless > 0
          ? `${activeHeadless}/4 headless lanes are active${blockedHeadless > 0 ? `, with ${blockedHeadless} needing attention` : ""}.`
          : "The page is falling back to site-native governance history because no current headless supervision snapshot is available.",
      description:
        "Remote autonomous execution. This is where long-running lane loops continue working even when the local workstation is offline.",
    },
    {
      id: "gastown",
      label: "Gastown",
      status: timelineCount > 0 ? "active" : "limited",
      summary:
        timelineCount > 0
          ? `${timelineCount} recent public governance events are available to trace cross-rig progress.`
          : "Coordination history is available once governance events are published into the archive.",
      description:
        "Town-level coordination. Gastown tracks work across rigs, convoys, and governance lanes, then turns that activity into reviewable progress.",
    },
    {
      id: "control-plane",
      label: "Control Plane",
      status: hasControlPlaneFiles ? "active" : "limited",
      summary: hasControlPlaneFiles
        ? "Board, dashboard, and journal artifacts are available to drive the live public monitor."
        : "Control-plane artifacts are not mounted in this runtime, so the page is using repository-native history instead.",
      description:
        "Operator-facing supervision. It emits the board, journal, and status views that make headless activity legible without exposing raw internals.",
    },
  ];
}

export function getSystemPulseData(): SystemPulseData {
  const snapshots = readHeadlessSnapshots();
  const lanes = buildHeadlessLanes(snapshots);
  const localHeartbeats = buildLocalHeartbeatSummary();
  const headlessTimeline = buildHeadlessTimeline(snapshots);
  const siteTimeline = buildSiteTimeline();
  const timeline = [...headlessTimeline, ...siteTimeline]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 16);
  const surfaces = buildSurfaces(lanes, localHeartbeats, timeline.length);
  const blockers = lanes
    .filter((lane) => lane.health === "blocked" || lane.health === "down")
    .map((lane) => ({ lane: lane.id, summary: lane.summary, type: lane.type }));
  const recentChanges = lanes
    .filter((lane) => lane.changed !== "same")
    .map((lane) => ({
      lane: lane.id,
      changed: lane.changed,
      summary: lane.summary,
    }));
  const activeHeadless = lanes.filter((lane) => lane.health === "active").length;
  const localSignals = localHeartbeats.filter((item) => item.status === "fresh").length;
  const blockedHeadless = blockers.length;

  const summary =
    blockedHeadless > 0
      ? `${blockedHeadless} lane${blockedHeadless === 1 ? " is" : "s are"} blocked or down. Headless progress is still visible, but it needs operator attention.`
      : activeHeadless > 0
        ? `All four lane identities stay intact while the page blends live headless supervision with the website's archived governance history.`
        : "The page is running from archived governance history right now because no fresh headless snapshot is available in this runtime.";

  const focus =
    recentChanges[0]?.summary ||
    timeline[0]?.summary ||
    "System Pulse highlights the latest governance movement, lane activity, and surface-level differences without dumping raw operator logs.";

  return {
    generatedAt: new Date().toISOString(),
    title: "LIVE SYSTEM PULSE",
    summary,
    focus,
    stats: {
      totalLanes: 4,
      activeHeadless,
      blockedHeadless,
      localSignals,
      timelineEvents: timeline.length,
    },
    lanes,
    surfaces,
    blockers,
    recentChanges,
    timeline,
  };
}
