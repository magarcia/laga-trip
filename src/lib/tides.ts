import { hhmm, nf1 } from "./format";

// Tide extremes per day (CEST). [minutesFromMidnight, heightM, kind] — "B" bajamar / "P" pleamar.
// Static astronomical data, not weather — no live refresh.
export type TideKind = "B" | "P";
export type Extreme = readonly [min: number, height: number, kind: TideKind];

export const TIDES: Record<string, readonly Extreme[]> = {
  "2026-06-20": [[137, 0.17, "B"], [517, 3.38, "P"], [870, 0.44, "B"], [1256, 3.67, "P"]],
  "2026-06-21": [[191, 0.36, "B"], [571, 3.2, "P"], [923, 0.62, "B"], [1311, 3.46, "P"]],
  "2026-06-22": [[246, 0.57, "B"], [627, 3.03, "P"], [980, 0.8, "B"], [1369, 3.24, "P"]],
  "2026-06-23": [[304, 0.75, "B"], [687, 2.91, "P"], [1042, 0.95, "B"], [1430, 3.05, "P"]],
};

export const TIDE_DAYS: readonly { date: string; label: string }[] = [
  { date: "2026-06-20", label: "Sáb 20" },
  { date: "2026-06-21", label: "Dom 21" },
  { date: "2026-06-22", label: "Lun 22" },
  { date: "2026-06-23", label: "Mar 23" },
];

export const SUNRISE = 388; // ~06:28
export const SUNSET = 1316; // ~21:56
const TIDE_HMAX = 3.8; // y-axis ceiling (m)
export const VB_W = 720;
export const VB_H = 250;
export const PAD_T = 30;
const PAD_B = 26;
export const PLOT_H = VB_H - PAD_T - PAD_B;

export function tX(min: number): number {
  return (min / 1440) * VB_W;
}
export function tY(h: number): number {
  return PAD_T + (1 - Math.min(h, TIDE_HMAX) / TIDE_HMAX) * PLOT_H;
}

type Anchor = [number, number];

// Phantom anchors before first / after last extreme so the curve flows past 00:00 and 24:00.
function tideAnchors(ex: readonly Extreme[]): Anchor[] {
  const a: Anchor[] = ex.map((e) => [e[0], e[1]]);
  const g0 = a[1][0] - a[0][0];
  a.unshift([a[0][0] - g0, a[1][1]]);
  const m = a.length;
  const gN = a[m - 1][0] - a[m - 2][0];
  a.push([a[m - 1][0] + gN, a[m - 2][1]]);
  return a;
}

function tideHeight(anch: Anchor[], min: number): number {
  for (let i = 0; i < anch.length - 1; i++) {
    const a = anch[i];
    const b = anch[i + 1];
    if (min >= a[0] && min <= b[0]) {
      const f = (min - a[0]) / (b[0] - a[0]);
      return a[1] + ((b[1] - a[1]) * (1 - Math.cos(f * Math.PI))) / 2;
    }
  }
  return min < anch[0][0] ? anch[0][1] : anch[anch.length - 1][1];
}

export interface GridTick {
  x: number;
  line: boolean;
  label: string;
  anchor: "start" | "middle" | "end";
}
export interface NightRect {
  x: number;
  width: number;
}
export interface ExtremePoint {
  x: number;
  y: number;
  high: boolean;
  timeLabel: string;
  timeY: number;
  kindLabel: string;
  kindY: number;
  anchor: "start" | "middle" | "end";
}
export interface TideModel {
  nightRects: NightRect[];
  grid: GridTick[];
  midY: number;
  areaPath: string;
  curvePath: string;
  extremes: ExtremePoint[];
  desc: string;
}

export function buildTide(dateStr: string): TideModel | null {
  const ex = TIDES[dateStr];
  if (!ex) return null;
  const anch = tideAnchors(ex);

  const pts: [number, number][] = [];
  const step = 12;
  for (let min = 0; min <= 1440; min += step) pts.push([tX(min), tY(tideHeight(anch, min))]);
  const curvePath = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const areaPath = curvePath + " L" + VB_W + " " + (PAD_T + PLOT_H) + " L0 " + (PAD_T + PLOT_H) + " Z";

  const hs = ex.map((e) => e[1]);
  const midY = tY((Math.min(...hs) + Math.max(...hs)) / 2);

  const nightRects: NightRect[] = [
    { x: 0, width: tX(SUNRISE) },
    { x: tX(SUNSET), width: VB_W - tX(SUNSET) },
  ];

  const grid: GridTick[] = [0, 6, 12, 18, 24].map((h) => {
    const x = tX(h * 60);
    const anchor = h === 0 ? "start" : h === 24 ? "end" : "middle";
    return { x, line: h > 0 && h < 24, label: (h < 10 ? "0" : "") + h + ":00", anchor };
  });

  const extremes: ExtremePoint[] = ex.map((e) => {
    const x = tX(e[0]);
    const y = tY(e[1]);
    const high = e[2] === "P";
    const anchor = x < 70 ? "start" : x > VB_W - 70 ? "end" : "middle";
    // Two stacked label rows on the open side of the dot (below a peak, above a trough) so they never overlap.
    return {
      x,
      y,
      high,
      anchor,
      timeLabel: hhmm(e[0]),
      timeY: high ? y + 18 : y - 30,
      kindLabel: (high ? "P" : "B") + " " + nf1(e[1]) + " m",
      kindY: high ? y + 33 : y - 15,
    };
  });

  const desc =
    "Marea en Laga el " +
    dateStr +
    ": " +
    ex.map((e) => (e[2] === "P" ? "pleamar" : "bajamar") + " a las " + hhmm(e[0]) + " de " + nf1(e[1]) + " metros").join(", ") +
    ".";

  return { nightRects, grid, midY, areaPath, curvePath, extremes, desc };
}

export interface TideMarker {
  x: number;
  y: number;
}

// The live "you are here" marker; only meaningful on today's curve.
export function tideMarker(dateStr: string, mins: number): TideMarker | null {
  const ex = TIDES[dateStr];
  if (!ex) return null;
  const anch = tideAnchors(ex);
  return { x: tX(mins), y: tY(tideHeight(anch, mins)) };
}

// Cosine-interpolated tide height (m) at a given minute, for the per-day detail rows. null off-calendar.
export function tideHeightAt(dateStr: string, mins: number): number | null {
  const ex = TIDES[dateStr];
  if (!ex) return null;
  return tideHeight(tideAnchors(ex), mins);
}
