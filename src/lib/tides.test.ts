import { describe, expect, it } from "vitest";
import { buildTide, TIDES, tideHeightAt, tideMarker } from "./tides";

const DAY = "2026-06-21";
// Extremes for the 21st: [191, 0.36 B], [571, 3.2 P], [923, 0.62 B], [1311, 3.46 P].
const EXTREMES = TIDES[DAY];

describe("tideHeightAt", () => {
  it("returns exactly the extreme height at each extreme minute", () => {
    for (const [min, height] of EXTREMES) {
      expect(tideHeightAt(DAY, min)).toBeCloseTo(height, 10);
    }
  });

  it("rises monotonically from a low to the following high", () => {
    const [lowMin] = EXTREMES[0]; // 191, bajamar
    const [highMin] = EXTREMES[1]; // 571, pleamar
    let prev = tideHeightAt(DAY, lowMin);
    for (let m = lowMin + 10; m <= highMin; m += 10) {
      const h = tideHeightAt(DAY, m);
      expect(h).not.toBeNull();
      expect(h).toBeGreaterThan(prev ?? -Infinity);
      prev = h;
    }
  });

  it("falls monotonically from a high to the following low", () => {
    const [highMin] = EXTREMES[1]; // 571, pleamar
    const [lowMin] = EXTREMES[2]; // 923, bajamar
    let prev = tideHeightAt(DAY, highMin);
    for (let m = highMin + 10; m <= lowMin; m += 10) {
      const h = tideHeightAt(DAY, m);
      expect(h).not.toBeNull();
      expect(h).toBeLessThan(prev ?? Infinity);
      prev = h;
    }
  });

  it("places the midpoint between two extremes near their average (cosine symmetry)", () => {
    const [aMin, aH] = EXTREMES[0];
    const [bMin, bH] = EXTREMES[1];
    const mid = tideHeightAt(DAY, (aMin + bMin) / 2);
    expect(mid).toBeCloseTo((aH + bH) / 2, 6);
  });

  it("flows continuously across the 00:00 boundary via the phantom anchor", () => {
    // The curve is defined for the whole day including minute 0 and 1440.
    expect(tideHeightAt(DAY, 0)).not.toBeNull();
    expect(tideHeightAt(DAY, 1440)).not.toBeNull();
  });

  it("returns null for a date outside the tide calendar", () => {
    expect(tideHeightAt("2026-06-19", 600)).toBeNull();
    expect(tideHeightAt("2026-06-24", 600)).toBeNull();
  });
});

describe("tideMarker", () => {
  it("returns null off-calendar", () => {
    expect(tideMarker("2026-06-19", 600)).toBeNull();
  });

  it("returns finite x/y SVG coordinates on a calendar day", () => {
    const marker = tideMarker(DAY, 600);
    expect(marker).not.toBeNull();
    expect(Number.isFinite(marker?.x)).toBe(true);
    expect(Number.isFinite(marker?.y)).toBe(true);
  });
});

describe("buildTide", () => {
  it("returns null for a date with no tide data", () => {
    expect(buildTide("2026-06-19")).toBeNull();
  });

  it("emits one extreme point per tide extreme with correct high/low flags", () => {
    const model = buildTide(DAY);
    expect(model).not.toBeNull();
    expect(model?.extremes).toHaveLength(EXTREMES.length);
    const highs = model?.extremes.map((e) => e.high);
    // EXTREMES order is B, P, B, P -> low, high, low, high.
    expect(highs).toEqual([false, true, false, true]);
  });

  it("builds a curve path that starts with a moveto and an area path that closes", () => {
    const model = buildTide(DAY);
    expect(model?.curvePath.startsWith("M")).toBe(true);
    expect(model?.areaPath.endsWith("Z")).toBe(true);
  });

  it("renders a Spanish accessible description naming pleamar and bajamar", () => {
    const model = buildTide(DAY);
    expect(model?.desc).toContain("Marea en Laga el " + DAY);
    expect(model?.desc).toContain("pleamar");
    expect(model?.desc).toContain("bajamar");
  });

  it("emits two night rectangles (pre-sunrise and post-sunset)", () => {
    const model = buildTide(DAY);
    expect(model?.nightRects).toHaveLength(2);
    expect(model?.nightRects[0].x).toBe(0);
  });
});
