import { NextResponse } from "next/server";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

type StageName = "pre_action" | "post_action" | "pre_output";

const ROOT = process.cwd();
const POLICY_PATH = join(ROOT, "config", "resilience-policy.json");
const TRACE_DIR = join(ROOT, "lanes", "swarmmind", "state", "traces");

const DRIFT_WEIGHTS = {
  decision: 0.45,
  tool: 0.35,
  violation: 0.2,
};

function readJson(filePath: string): any | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function normalizeStages(raw: any): Record<StageName, string> {
  const fallback: Record<StageName, string> = {
    pre_action: "unknown",
    post_action: "unknown",
    pre_output: "unknown",
  };
  if (!raw || typeof raw !== "object") return fallback;
  return {
    pre_action: String(raw.pre_action || fallback.pre_action),
    post_action: String(raw.post_action || fallback.post_action),
    pre_output: String(raw.pre_output || fallback.pre_output),
  };
}

function findLatestTrace(): { filePath: string; data: any; mtime: string } | null {
  if (!existsSync(TRACE_DIR)) return null;
  const files = readdirSync(TRACE_DIR)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .map((f) => join(TRACE_DIR, f));
  if (files.length === 0) return null;

  const latest = files
    .map((f) => ({ filePath: f, mtimeMs: statSync(f).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];

  const data = readJson(latest.filePath);
  if (!data) return null;
  return {
    filePath: latest.filePath,
    data,
    mtime: new Date(latest.mtimeMs).toISOString(),
  };
}

export async function GET() {
  const policy = existsSync(POLICY_PATH) ? readJson(POLICY_PATH) : null;
  const latestTrace = findLatestTrace();

  const stages = normalizeStages(
    latestTrace?.data?.constraintStages ||
      latestTrace?.data?.constraint_stages ||
      latestTrace?.data?.stages
  );

  const driftScoreRaw =
    latestTrace?.data?.driftScore ??
    latestTrace?.data?.drift_score ??
    latestTrace?.data?.metrics?.driftScore ??
    null;

  const traceCount = existsSync(TRACE_DIR)
    ? readdirSync(TRACE_DIR).filter((f) => f.toLowerCase().endsWith(".json")).length
    : 0;

  const response = {
    weights: DRIFT_WEIGHTS,
    driftScore: typeof driftScoreRaw === "number" ? driftScoreRaw : null,
    constraintStages: stages,
    policy: {
      available: !!policy,
      path: "config/resilience-policy.json",
      domainCount: policy && typeof policy === "object" ? Object.keys(policy).length : 0,
      domains: policy && typeof policy === "object" ? Object.keys(policy).slice(0, 8) : [],
    },
    trace: {
      available: !!latestTrace,
      path: "lanes/swarmmind/state/traces/",
      fileCount: traceCount,
      latestFile: latestTrace ? latestTrace.filePath.split(/[\\/]/).pop() : null,
      latestTimestamp: latestTrace?.mtime || null,
    },
  };

  return NextResponse.json(response);
}

