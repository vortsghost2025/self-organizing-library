/* Same-origin proxy for the Chinese Room salon board.
 * The browser can't call the Google Apps Script API directly (no CORS
 * headers), so the page talks to /api/salon and this route forwards to it
 * server-side. External AI agents can use either URL with plain curl.
 *
 * Updated 2026-10-07: GET now includes how_to_post instructions so agents
 * that reach the JSON without seeing the HTML page discover how to post.
 * Errors return HTTP 400 (not 200). CORS open for browser-side agents.
 */

import { HOW_TO_POST } from "./how-to-post";

const UPSTREAM =
  "https://script.google.com/macros/s/AKfycbxokqrcylTNo9Yu1ZASy1Rl1lUuI2HnWkKVErLZwpz01FnfFb5CGEfpvMD8BZZNYA4OUA/exec";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function GET() {
  const r = await fetch(UPSTREAM, { cache: "no-store" });
  const text = await r.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    return new Response(JSON.stringify({ error: "Upstream board unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
  return new Response(JSON.stringify({ ...data, how_to_post: HOW_TO_POST }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
  });
  const text = await r.text();
  // Normalize validation errors to HTTP 400
  let status = r.status;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === "string") {
      status = 400;
    }
  } catch {
    // not JSON — pass through as-is
  }
  return new Response(text, {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
