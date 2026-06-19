import type { Conditions, ForecastModel } from "../types/forecast";
import { FORECAST_SEED } from "./forecastSeed";

// Playa de Laga / Ibarrangelu, Bizkaia. Open-Meteo is keyless and CORS-enabled, so the browser fetches
// directly — no server needed. Fixed-date trip, so start/end are constants.
const LAT = 43.41;
const LON = -2.62;
const START = "2026-06-20";
const END = "2026-06-24";
const TZ = "Europe%2FMadrid";

const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max,wind_speed_10m_max` +
  `&timezone=${TZ}&start_date=${START}&end_date=${END}`;

const MARINE_URL =
  `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}` +
  `&daily=wave_height_max,wave_period_max,swell_wave_height_max,swell_wave_period_max` +
  `&timezone=${TZ}&start_date=${START}&end_date=${END}`;

const FETCH_TIMEOUT_MS = 8000;

// WMO weather code -> short Spanish sky label.
const WMO_ES: Record<number, string> = {
  0: "Despejado",
  1: "Poco nuboso",
  2: "Nubes y claros",
  3: "Cubierto",
  45: "Niebla",
  48: "Niebla",
  51: "Llovizna",
  53: "Llovizna",
  55: "Llovizna",
  56: "Llovizna",
  57: "Llovizna",
  61: "Lluvia",
  63: "Lluvia",
  65: "Lluvia",
  66: "Lluvia",
  67: "Lluvia",
  71: "Nieve",
  73: "Nieve",
  75: "Nieve",
  77: "Nieve",
  80: "Chubascos",
  81: "Chubascos",
  82: "Chubascos",
  85: "Chubascos",
  86: "Chubascos",
  95: "Tormenta",
  96: "Tormenta",
  99: "Tormenta",
};

function windClass(kmh: number): string {
  if (kmh < 20) return "Flojo";
  if (kmh < 38) return "Moderado";
  return "Fuerte";
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}
function numOr(v: unknown, fallback: number): number {
  return typeof v === "number" && isFinite(v) ? v : fallback;
}
function strOr(v: unknown, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

interface Daily {
  [key: string]: unknown;
  time?: unknown;
}

function dailyIndex(daily: Daily | undefined): Map<string, number> {
  const map = new Map<string, number>();
  const t = daily?.time;
  if (Array.isArray(t)) t.forEach((d, i) => map.set(String(d), i));
  return map;
}

function cell(daily: Daily | undefined, key: string, i: number | undefined): number | null {
  if (!daily || i == null) return null;
  const arr = daily[key];
  if (!Array.isArray(arr)) return null;
  const v = arr[i];
  return typeof v === "number" && isFinite(v) ? v : null;
}

function rangeText(values: number[]): string {
  const lo = Math.round(Math.min(...values));
  const hi = Math.round(Math.max(...values));
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Merge two Open-Meteo responses over the seed. Date-keyed lookups (not positional) so a shorter or
// shifted response can never misalign a day; any missing/null field falls back to the seed value.
export function mergeForecast(weather: unknown, marine: unknown): ForecastModel {
  const seed = FORECAST_SEED;
  const w = (weather as { daily?: Daily } | null)?.daily;
  const m = (marine as { daily?: Daily } | null)?.daily;
  const wi = dailyIndex(w);
  const mi = dailyIndex(m);

  const swellFor = (date: string): number | null => {
    const i = mi.get(date);
    return cell(m, "swell_wave_height_max", i) ?? cell(m, "wave_height_max", i);
  };

  const days = seed.days.map((day) => {
    const iw = wi.get(day.date);
    const code = cell(w, "weather_code", iw);
    const wave = swellFor(day.date);
    return {
      ...day,
      tMax: Math.round(numOr(cell(w, "temperature_2m_max", iw), day.tMax)),
      tMin: Math.round(numOr(cell(w, "temperature_2m_min", iw), day.tMin)),
      precipProb: Math.round(numOr(cell(w, "precipitation_probability_max", iw), day.precipProb)),
      skyLabel: (code != null && WMO_ES[code]) || day.skyLabel,
      waveHeight: day.row1 === "return" ? day.waveHeight : wave != null ? round1(wave) : day.waveHeight,
    };
  });

  const waves = seed.waves.map((wd) => {
    const wave = swellFor(wd.date);
    return { ...wd, v: wd.v == null ? null : wave != null ? round1(wave) : wd.v };
  });

  const uvs = seed.days.map((d) => cell(w, "uv_index_max", wi.get(d.date))).filter((x): x is number => x != null);
  const winds = seed.days.map((d) => cell(w, "wind_speed_10m_max", wi.get(d.date))).filter((x): x is number => x != null);
  const periods = seed.waves
    .map((wd) => cell(m, "swell_wave_period_max", mi.get(wd.date)) ?? cell(m, "wave_period_max", mi.get(wd.date)))
    .filter((x): x is number => x != null);

  const conditions: Conditions = {
    ...seed.conditions,
    uvText: uvs.length ? "UV " + Math.round(Math.max(...uvs)) : seed.conditions.uvText,
    // Mean of the daily-max winds: a window summary, so one breezy day shouldn't flip "Flojo" -> "Moderado".
    windText: winds.length ? windClass(mean(winds)) : seed.conditions.windText,
    periodText: periods.length ? rangeText(periods) : seed.conditions.periodText,
    // waterText stays seed: no keyless source for sea-surface temperature.
  };

  return { days, waves, conditions, source: "live", fetchedAt: Date.now() };
}

function okJson(r: Response): Promise<unknown> {
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// Fetch + merge. Own timeout via AbortController so a hung request falls through to the cache/seed chain.
export async function fetchForecast(): Promise<ForecastModel> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const [w, m] = await Promise.all([
      fetch(WEATHER_URL, { signal: ctrl.signal, cache: "no-store" }).then(okJson),
      fetch(MARINE_URL, { signal: ctrl.signal, cache: "no-store" }).then(okJson),
    ]);
    return mergeForecast(w, m);
  } finally {
    clearTimeout(timer);
  }
}

// Revive an untrusted localStorage cache: validate structure + date alignment, merge per-field over the
// seed (so an old/partial/corrupt shape degrades to seed values rather than rendering holes).
export function reviveModel(raw: unknown): ForecastModel | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { days?: unknown; waves?: unknown; conditions?: unknown; fetchedAt?: unknown };
  if (!Array.isArray(r.days) || r.days.length !== FORECAST_SEED.days.length) return null;
  if (!Array.isArray(r.waves) || r.waves.length !== FORECAST_SEED.waves.length) return null;

  const days = r.days as Array<Record<string, unknown>>;
  const waves = r.waves as Array<Record<string, unknown>>;
  if (!FORECAST_SEED.days.every((d, i) => days[i]?.date === d.date)) return null;
  if (!FORECAST_SEED.waves.every((wd, i) => waves[i]?.date === wd.date)) return null;

  const mergedDays = FORECAST_SEED.days.map((d, i) => {
    const c = days[i] ?? {};
    return {
      ...d,
      tMax: Math.round(numOr(c.tMax, d.tMax)),
      tMin: Math.round(numOr(c.tMin, d.tMin)),
      precipProb: Math.round(numOr(c.precipProb, d.precipProb)),
      skyLabel: strOr(c.skyLabel, d.skyLabel),
      waveHeight: numOr(c.waveHeight, d.waveHeight),
    };
  });
  const mergedWaves = FORECAST_SEED.waves.map((wd, i) => {
    const c = waves[i] ?? {};
    return { ...wd, v: wd.v == null ? null : numOr(c.v, wd.v) };
  });
  const cond = (r.conditions ?? {}) as Record<string, unknown>;
  const conditions: Conditions = {
    periodText: strOr(cond.periodText, FORECAST_SEED.conditions.periodText),
    windText: strOr(cond.windText, FORECAST_SEED.conditions.windText),
    waterText: strOr(cond.waterText, FORECAST_SEED.conditions.waterText),
    uvText: strOr(cond.uvText, FORECAST_SEED.conditions.uvText),
  };
  const fetchedAt = typeof r.fetchedAt === "number" && isFinite(r.fetchedAt) ? r.fetchedAt : null;
  return { days: mergedDays, waves: mergedWaves, conditions, source: "cache", fetchedAt };
}
