import { describe, expect, it } from "vitest";

import { computeCameraFitFromDisplayPoints } from "@/lib/graph-camera-fit";

describe("computeCameraFitFromDisplayPoints", () => {
  it("keeps a full normalized graph centered with a meaningful camera ratio", () => {
    const fit = computeCameraFitFromDisplayPoints(
      [
        { x: 0, y: 0.02 },
        { x: 1, y: 0.98 },
        { x: 0.5, y: 0.5 },
      ],
      { containerWidth: 1014, containerHeight: 898 }
    );

    expect(fit).not.toBeNull();
    expect(fit?.x).toBeCloseTo(0.5, 3);
    expect(fit?.y).toBeCloseTo(0.5, 3);
    expect(fit?.ratio).toBeGreaterThan(0.9);
    expect(fit?.ratio).toBeLessThan(1.2);
  });

  it("does not collapse small normalized selections into unusably tiny camera ratios", () => {
    const fit = computeCameraFitFromDisplayPoints(
      [
        { x: 0.49, y: 0.5 },
        { x: 0.5, y: 0.51 },
        { x: 0.51, y: 0.49 },
      ],
      { containerWidth: 1014, containerHeight: 898 }
    );

    expect(fit).not.toBeNull();
    expect(fit?.x).toBeCloseTo(0.5, 2);
    expect(fit?.y).toBeCloseTo(0.5, 2);
    expect(fit?.ratio).toBeGreaterThan(0.15);
    expect(fit?.ratio).toBeLessThan(0.35);
  });
});
