import { describe, expect, it } from "vitest";

import {
  getGraphWorkspacePreset,
  getGraphWorkspaceRegionTheme,
  getGraphWorkspaceRegions,
} from "./graph-workspace-theme";

describe("graph workspace theme", () => {
  it("uses the architecture preset for navigation views", () => {
    expect(getGraphWorkspacePreset("navigation")).toBe("architecture");
  });

  it("uses the systems preset for authority views", () => {
    expect(getGraphWorkspacePreset("authority")).toBe("systems");
  });

  it("returns an ordered region palette for the active preset", () => {
    expect(getGraphWorkspaceRegions("navigation").map((entry) => entry.region)).toEqual([
      "archive",
      "graph",
      "governance",
      "runtime",
      "experience",
      "conflicts",
    ]);
  });

  it("falls back gracefully for unknown regions", () => {
    expect(getGraphWorkspaceRegionTheme("missing", "authority").color).toBe("#A1A1AA");
  });
});
