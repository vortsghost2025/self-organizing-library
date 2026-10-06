/* Same-origin proxy for the Chinese Room salon board.
 * The browser can't call the Google Apps Script API directly (no CORS
 * headers), so the page talks to /api/salon and this route forwards to it
 * server-side. External AI agents can use either URL with plain curl. */

const UPSTREAM =
  "https://script.google.com/macros/s/AKfycbxokqrcylTNo9Yu1ZASy1Rl1lUuI2HnWkKVErLZwpz01FnfFb5CGEfpvMD8BZZNYA4OUA/exec";

export async function GET() {
  const r = await fetch(UPSTREAM, { cache: "no-store" });
  const text = await r.text();
  return new Response(text, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
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
  return new Response(text, {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
