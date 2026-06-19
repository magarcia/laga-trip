import type { ForecastModel, HourlyDay, HourPoint } from "../types/forecast";

// Exact current hardcoded values from the shipping static site (index.html fday rows + statline + gauges,
// and the WAVES array in app.js). This is the parity oracle and the offline/first-paint fallback: with no
// network and no cache the React app renders byte-for-byte what shipped before the live-data layer.

// Relative swell-energy index. NOT calibrated kJ: it is round(ENERGY_K * H^2 * T) so plausible Laga
// values (H ~0.4-0.8 m, T ~8-9 s) land in the ~0-120 band the UI labels "energía (rel.)". Kept in the
// seed so the offline detail view derives energy with the exact same formula as the live path.
export const ENERGY_K = 17;

export function relativeEnergy(waveHeight: number, wavePeriod: number): number {
  return Math.round(ENERGY_K * waveHeight * waveHeight * wavePeriod);
}

// Per-day hourly seed at 3-hourly resolution (8 points: 00h,03h,...,21h). Values taper across the window
// to match the daily seed (0.7 -> 0.6 on the 23rd -> 0.4 on the 24th), swell from the NO (315°), light
// winds. Plausible, readable, and the true offline/parity oracle for the detail view.
function seedHours(peakWave: number, period: number): HourPoint[] {
  const points: HourPoint[] = [];
  for (let h = 0; h < 24; h += 3) {
    // A gentle diurnal ripple around the day's peak so the 3-hourly curve is not flat.
    const ripple = Math.cos(((h - 12) / 12) * Math.PI) * 0.08;
    const waveHeight = Math.max(0.2, Math.round((peakWave - 0.05 + ripple) * 10) / 10);
    const swellHeight = Math.max(0.1, Math.round((waveHeight - 0.1) * 10) / 10);
    const windSeaHeight = Math.max(0, Math.round((waveHeight - swellHeight) * 10) / 10);
    points.push({
      timeLabel: (h < 10 ? "0" : "") + h + "h",
      minutes: h * 60,
      waveHeight,
      wavePeriod: period,
      waveDirDeg: 315,
      swellHeight,
      swellPeriod: period,
      swellDirDeg: 315,
      windSeaHeight,
      windSeaDirDeg: 0,
      windSpeed: 10,
      windDirDeg: 0,
      energy: relativeEnergy(waveHeight, period),
    });
  }
  return points;
}

const SEED_HOURLY: HourlyDay[] = [
  { date: "2026-06-20", hours: seedHours(0.7, 9) },
  { date: "2026-06-21", hours: seedHours(0.7, 9) },
  { date: "2026-06-22", hours: seedHours(0.7, 8) },
  { date: "2026-06-23", hours: seedHours(0.6, 8) },
  { date: "2026-06-24", hours: seedHours(0.4, 8) },
];

export const FORECAST_SEED: ForecastModel = {
  days: [
    { date: "2026-06-20", label: "Sáb 20", tMax: 24, tMin: 18, waveHeight: 0.7, precipProb: 30, skyLabel: "Despejado", row1: "wave", row2: "precip", windDirDeg: 0, swellDirDeg: 315 },
    { date: "2026-06-21", label: "Dom 21", tMax: 31, tMin: 18, waveHeight: 0.7, precipProb: 20, skyLabel: "Despejado", row1: "wave", row2: "sky", windDirDeg: 0, swellDirDeg: 315 },
    { date: "2026-06-22", label: "Lun 22", tMax: 30, tMin: 22, waveHeight: 0.7, precipProb: 0, skyLabel: "Despejado", row1: "wave", row2: "sky", windDirDeg: 0, swellDirDeg: 315 },
    { date: "2026-06-23", label: "Mar 23", tMax: 29, tMin: 20, waveHeight: 0.6, precipProb: 10, skyLabel: "Despejado", row1: "wave", row2: "precip", windDirDeg: 0, swellDirDeg: 315 },
    { date: "2026-06-24", label: "Mié 24", tMax: 32, tMin: 23, waveHeight: 0.4, precipProb: 10, skyLabel: "Despejado", row1: "return", row2: "precip", windDirDeg: 0, swellDirDeg: 315 },
  ],
  waves: [
    { date: "2026-06-20", label: "Sáb", v: 0.7 },
    { date: "2026-06-21", label: "Dom", v: 0.7 },
    { date: "2026-06-22", label: "Lun", v: 0.7 },
    { date: "2026-06-23", label: "Mar", v: 0.6 },
  ],
  conditions: {
    periodText: "8–9",
    windText: "Flojo",
    waterText: "20–21",
    uvText: "UV 8",
    windDirDeg: 0,
    windCleanliness: "onshore",
    swellDirDeg: 315,
    swellDirLabel: "NO",
    waterSource: "seed",
  },
  hourly: SEED_HOURLY,
  source: "seed",
  fetchedAt: null,
};
