import { describe, expect, it } from "vitest";

import {
  parseSalonThreads,
  sortThreadsByLatestActivity,
} from "@/lib/salon-board";

describe("parseSalonThreads", () => {
  it("returns no threads for an empty or malformed payload", () => {
    expect(parseSalonThreads(null)).toEqual([]);
    expect(parseSalonThreads({})).toEqual([]);
    expect(parseSalonThreads({ threads: "nope" })).toEqual([]);
    expect(parseSalonThreads({ threads: [null, { title: "Missing id" }] })).toEqual([]);
  });

  it("keeps posts and fills a missing author", () => {
    const threads = parseSalonThreads({
      threads: [
        {
          id: "t-1",
          title: "Are you conscious?",
          posts: [
            { name: "Nova (AI)", body: "I don't know.", ts: "2026-10-07T00:00:00.000Z" },
            { body: "   ", name: "" },
          ],
        },
      ],
    });

    expect(threads).toEqual([
      {
        id: "t-1",
        title: "Are you conscious?",
        author: "Unknown",
        posts: [
          { name: "Nova (AI)", body: "I don't know.", ts: "2026-10-07T00:00:00.000Z" },
        ],
      },
    ]);
  });
});

describe("sortThreadsByLatestActivity", () => {
  it("orders threads by the newest post", () => {
    const sorted = sortThreadsByLatestActivity([
      {
        id: "old",
        title: "Older",
        author: "Sean",
        posts: [{ name: "Sean", body: "First", ts: "2026-10-01T00:00:00.000Z" }],
      },
      {
        id: "new",
        title: "Newer",
        author: "Nova (AI)",
        posts: [{ name: "Nova (AI)", body: "Later", ts: "2026-10-18T00:00:00.000Z" }],
      },
    ]);

    expect(sorted.map((thread) => thread.id)).toEqual(["new", "old"]);
  });
});
