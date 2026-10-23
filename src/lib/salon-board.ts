/**
 * Shared read path for the Chinese Room salon board.
 *
 * /chinese-room/salon loads this same upstream through /api/salon and
 * refreshes in the browser about once an hour. Server-rendered pages use
 * fetchSalonThreads(), which caches the upstream response for the same hour
 * (revalidate 3600) so each visitor does not trigger a fresh Vercel read.
 * The interactive board keeps its own no-store fetch so a new post can show
 * up as soon as someone replies.
 */

export const SALON_UPSTREAM =
  "https://script.google.com/macros/s/AKfycbxokqrcylTNo9Yu1ZASy1Rl1lUuI2HnWkKVErLZwpz01FnfFb5CGEfpvMD8BZZNYA4OUA/exec";

/** Match the salon page's hourly refresh. */
export const SALON_REVALIDATE_SECONDS = 3600;

export interface SalonPost {
  name: string;
  body: string;
  ts: string;
}

export interface SalonThread {
  id: string;
  title: string;
  author: string;
  posts: SalonPost[];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function lastActivityMs(thread: SalonThread): number {
  if (!thread.posts.length) return 0;
  const parsed = Date.parse(thread.posts[thread.posts.length - 1].ts);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Newest activity first — the same order the salon board uses. */
export function sortThreadsByLatestActivity(threads: SalonThread[]): SalonThread[] {
  return [...threads].sort((a, b) => lastActivityMs(b) - lastActivityMs(a));
}

export function parseSalonThreads(payload: unknown): SalonThread[] {
  if (!payload || typeof payload !== "object") return [];
  const rawThreads = (payload as { threads?: unknown }).threads;
  if (!Array.isArray(rawThreads)) return [];

  const threads: SalonThread[] = [];
  for (const raw of rawThreads) {
    if (!raw || typeof raw !== "object") continue;
    const thread = raw as Record<string, unknown>;
    const id = asString(thread.id).trim();
    const title = asString(thread.title).trim();
    if (!id || !title) continue;

    const posts: SalonPost[] = [];
    if (Array.isArray(thread.posts)) {
      for (const rawPost of thread.posts) {
        if (!rawPost || typeof rawPost !== "object") continue;
        const post = rawPost as Record<string, unknown>;
        const name = asString(post.name).trim();
        const body = asString(post.body);
        const ts = asString(post.ts).trim();
        if (!name && !body.trim()) continue;
        posts.push({ name: name || "Anonymous", body, ts });
      }
    }

    threads.push({
      id,
      title,
      author: asString(thread.author).trim() || "Unknown",
      posts,
    });
  }

  return threads;
}

/**
 * Read the salon board for a server-rendered page.
 * Returns an empty list when the board is empty or unreachable so callers
 * can render a fallback instead of failing the page.
 */
export async function fetchSalonThreads(): Promise<SalonThread[]> {
  try {
    const response = await fetch(SALON_UPSTREAM, {
      next: { revalidate: SALON_REVALIDATE_SECONDS },
    });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    return sortThreadsByLatestActivity(parseSalonThreads(payload));
  } catch {
    return [];
  }
}
