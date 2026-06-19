import type {
  Conditions,
  DayForecast,
  ForecastModel,
  HourlyDay,
  HourPoint,
  WaterSource,
  WindCleanliness,
} from "../types/forecast";
import { ENERGY_K, FORECAST_SEED, relativeEnergy } from "./forecastSeed";

// Playa de Laga / Ibarrangelu, Bizkaia. Open-Meteo is keyless and CORS-enabled, so the browser fetches
// directly — no server needed. Fixed-date trip, so start/end are constants.
const LAT = 43.41;
const LON = -2.62;
const START = "2026-06-20";
const END = "2026-06-24";
const TZ = "Europe%2FMadrid";

// Laga faces ~NW. The shore-normal (the direction the beach looks out to, seaward) is ~337°.
// Wind cleanliness is classified by where the wind blows FROM (meteorological convention).
export const SHORE_NORMAL_DEG = 337;
// Half-width of the onshore/offshore sectors around the shore-normal and its opposite.
const SECTOR_HALF_WIDTH = 42;
// Wind FROM the sea (centred on the shore-normal, ~337°) flattens the wave: onshore = "movido".
const ONSHORE_FROM_LO = SHORE_NORMAL_DEG - SECTOR_HALF_WIDTH; // 295
const ONSHORE_FROM_HI = (SHORE_NORMAL_DEG + SECTOR_HALF_WIDTH) % 360; // 379 -> 19, wraps through 0
// Wind FROM the land (the offshore-ward opposite, ~157°) grooms the wave: offshore = "limpio".
const OFFSHORE_CENTER = (SHORE_NORMAL_DEG + 180) % 360; // 157
const OFFSHORE_FROM_LO = OFFSHORE_CENTER - SECTOR_HALF_WIDTH; // 115
const OFFSHORE_FROM_HI = OFFSHORE_CENTER + SECTOR_HALF_WIDTH; // 199

// Open-Meteo (Puertos del Estado has no swell direction here, so this stays Open-Meteo).
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max,wind_speed_10m_max,wind_direction_10m_dominant` +
  `&hourly=wind_speed_10m,wind_direction_10m` +
  `&timezone=${TZ}&start_date=${START}&end_date=${END}`;

const MARINE_URL =
  `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}` +
  `&daily=wave_height_max,wave_period_max,swell_wave_height_max,swell_wave_period_max,swell_wave_direction_dominant` +
  `&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_direction` +
  `&timezone=${TZ}&start_date=${START}&end_date=${END}`;

// Puertos del Estado (Portus) sea-surface temperature. CORS-open, ~2-day rolling horizon, so it only
// fills days within reach; the rest stay on the seed range. Spanish locale for tidy labels.
const PORTUS_SST_URL =
  "https://portus.puertos.es/portussvr/api/predData/portus/WATER_TEMP/3164034?locale=es";

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

// 16-point compass, Spanish abbreviations (NO/SO use the Spanish O for Oeste).
const COMPASS_ES = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];

export function compassEs(deg: number): string {
  const i = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return COMPASS_ES[i];
}

// Classify wind by FROM-direction vs. the Laga shore-normal. Offshore grooms, onshore flattens, else cross.
export function windCleanliness(fromDeg: number): WindCleanliness {
  const d = ((fromDeg % 360) + 360) % 360;
  if (d >= OFFSHORE_FROM_LO && d <= OFFSHORE_FROM_HI) return "offshore";
  if (d >= ONSHORE_FROM_LO || d <= ONSHORE_FROM_HI) return "onshore";
  return "cross";
}

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
interface Hourly {
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

// --- Hourly (marine + weather) -> HourlyDay[], grouped by Madrid date ---

function num(arr: unknown, i: number): number | null {
  if (!Array.isArray(arr)) return null;
  const v = arr[i];
  return typeof v === "number" && isFinite(v) ? v : null;
}

// Build one HourPoint from the marine arrays at index `mi` and the weather arrays at index `wi`
// (the two endpoints share the wall clock, but are indexed against their own time arrays). Falls back
// to a seed point per-field so a partial response never blanks a column.
function hourPointAt(marine: Hourly, weather: Hourly, mi: number, wi: number, label: string, minutes: number, fallback: HourPoint): HourPoint {
  const waveHeight = round1(numOr(num(marine.wave_height, mi), fallback.waveHeight));
  const wavePeriod = Math.round(numOr(num(marine.wave_period, mi), fallback.wavePeriod));
  return {
    timeLabel: label,
    minutes,
    waveHeight,
    wavePeriod,
    waveDirDeg: Math.round(numOr(num(marine.wave_direction, mi), fallback.waveDirDeg)),
    swellHeight: round1(numOr(num(marine.swell_wave_height, mi), fallback.swellHeight)),
    swellPeriod: Math.round(numOr(num(marine.swell_wave_period, mi), fallback.swellPeriod)),
    swellDirDeg: Math.round(numOr(num(marine.swell_wave_direction, mi), fallback.swellDirDeg)),
    windSeaHeight: round1(numOr(num(marine.wind_wave_height, mi), fallback.windSeaHeight)),
    windSeaDirDeg: Math.round(numOr(num(marine.wind_wave_direction, mi), fallback.windSeaDirDeg)),
    windSpeed: Math.round(numOr(num(weather.wind_speed_10m, wi), fallback.windSpeed)),
    windDirDeg: Math.round(numOr(num(weather.wind_direction_10m, wi), fallback.windDirDeg)),
    energy: relativeEnergy(waveHeight, wavePeriod),
  };
}

// timeLabel "HHh" from an Open-Meteo local ISO like "2026-06-20T15:00".
function hourLabel(iso: string): { date: string; label: string; minutes: number } | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, date, hh, mm] = m;
  return { date, label: hh + "h", minutes: +hh * 60 + +mm };
}

function buildHourly(marine: Hourly | undefined, weather: Hourly | undefined): HourlyDay[] {
  const mt = marine?.time;
  if (!Array.isArray(mt)) return FORECAST_SEED.hourly;
  const wt = weather?.time;
  // Weather hourly is keyed by its own time array so wind aligns to the same wall-clock as the marine row.
  const widx = new Map<string, number>();
  if (Array.isArray(wt)) wt.forEach((t, i) => widx.set(String(t), i));

  const byDate = new Map<string, HourPoint[]>();
  mt.forEach((raw, i) => {
    const parsed = hourLabel(String(raw));
    if (!parsed) return;
    const seedDay = FORECAST_SEED.hourly.find((d) => d.date === parsed.date);
    const fallback = seedDay?.hours.find((h) => h.minutes === parsed.minutes) ?? seedDay?.hours[0];
    if (!fallback) return; // outside the trip window, ignore
    const wi = widx.get(String(raw)) ?? i;
    const point = hourPointAt(marine as Hourly, (weather ?? {}) as Hourly, i, wi, parsed.label, parsed.minutes, fallback);
    const list = byDate.get(parsed.date) ?? [];
    list.push(point);
    byDate.set(parsed.date, list);
  });

  // Key by date over the seed days; a day with no/invalid hourly data degrades to its seed hours.
  return FORECAST_SEED.hourly.map((seedDay) => {
    const hours = byDate.get(seedDay.date);
    return hours && hours.length ? { date: seedDay.date, hours } : seedDay;
  });
}

// --- Portus SST ---

interface PortusRecord {
  fecha?: unknown;
  datos?: unknown;
}

// Pull the daily representative water temperature per date from the Portus prediction. We take the value
// nearest local midday (12:00) for each date; missing dates stay on the seed.
function parsePortusSst(raw: unknown): Map<string, number> {
  const out = new Map<string, number>();
  const records = extractPortusRecords(raw);
  if (!records) return out;

  // date -> { temp, distFromNoon } so we keep the reading closest to midday.
  const best = new Map<string, { temp: number; dist: number }>();
  for (const item of records) {
    // A malformed entry (e.g. null) must not throw: Portus has to fail closed so weather/marine still merge.
    if (!item || typeof item !== "object") continue;
    const rec = item as PortusRecord;
    const fecha = typeof rec.fecha === "string" ? rec.fecha : null;
    if (!fecha) continue;
    const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/.exec(fecha);
    if (!m) continue;
    const [, date, hh, mm] = m;
    const temp = portusWaterTemp(rec.datos);
    if (temp == null) continue;
    const dist = Math.abs(+hh * 60 + +mm - 12 * 60);
    const prev = best.get(date);
    if (!prev || dist < prev.dist) best.set(date, { temp, dist });
  }
  for (const [date, v] of best) out.set(date, v.temp);
  return out;
}

function extractPortusRecords(raw: unknown): unknown[] | null {
  if (!raw || typeof raw !== "object") return null;
  // The endpoint returns either an array of records or an object with a records array; accept both.
  // Kept as unknown[] (no cast to PortusRecord) so each entry is validated in the loop, not trusted here.
  if (Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;
  for (const key of ["data", "records", "predData", "values"]) {
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}

// Each record's `datos[]` holds parameter entries; the water temperature is the one whose Ts(ºC) param
// carries a numeric `valor` string.
function portusWaterTemp(datos: unknown): number | null {
  if (!Array.isArray(datos)) return null;
  for (const d of datos) {
    if (!d || typeof d !== "object") continue;
    const entry = d as Record<string, unknown>;
    const isTemp = entry.variableParametro === "TEMP. AGUA" || entry.nombreParametro === "Ts(ºC)";
    if (!isTemp) continue;
    const valor = typeof entry.valor === "string" ? parseFloat(entry.valor) : typeof entry.valor === "number" ? entry.valor : NaN;
    if (isFinite(valor)) return valor;
  }
  return null;
}

// Map Portus SST onto the trip window. Within horizon -> rounded range of available days; beyond -> seed.
function waterFromPortus(sst: Map<string, number>): { text: string; source: WaterSource } {
  const inWindow = FORECAST_SEED.days
    .map((d) => sst.get(d.date))
    .filter((v): v is number => typeof v === "number" && isFinite(v));
  if (!inWindow.length) return { text: FORECAST_SEED.conditions.waterText, source: "seed" };
  return { text: rangeText(inWindow), source: "portus" };
}

// Circular mean of compass degrees. A linear average is wrong across the 0/360 wrap: mean([350,10])
// must be 0, not 180 (which would flip offshore/onshore and the conditions verdict).
export function circularMeanDeg(degs: number[]): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x = degs.reduce((s, d) => s + Math.cos(rad(d)), 0);
  const y = degs.reduce((s, d) => s + Math.sin(rad(d)), 0);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Merge Open-Meteo + Portus over the seed. Date-keyed lookups (not positional) so a shorter or shifted
// response can never misalign a day; any missing/null field falls back to the seed value.
export function mergeForecast(weather: unknown, marine: unknown, portus?: unknown): ForecastModel {
  const seed = FORECAST_SEED;
  const w = (weather as { daily?: Daily; hourly?: Hourly } | null)?.daily;
  const m = (marine as { daily?: Daily; hourly?: Hourly } | null)?.daily;
  const wh = (weather as { hourly?: Hourly } | null)?.hourly;
  const mh = (marine as { hourly?: Hourly } | null)?.hourly;
  const wi = dailyIndex(w);
  const mi = dailyIndex(m);

  const swellFor = (date: string): number | null => {
    const i = mi.get(date);
    return cell(m, "swell_wave_height_max", i) ?? cell(m, "wave_height_max", i);
  };

  const days: DayForecast[] = seed.days.map((day) => {
    const iw = wi.get(day.date);
    const im = mi.get(day.date);
    const code = cell(w, "weather_code", iw);
    const wave = swellFor(day.date);
    return {
      ...day,
      tMax: Math.round(numOr(cell(w, "temperature_2m_max", iw), day.tMax)),
      tMin: Math.round(numOr(cell(w, "temperature_2m_min", iw), day.tMin)),
      precipProb: Math.round(numOr(cell(w, "precipitation_probability_max", iw), day.precipProb)),
      skyLabel: (code != null && WMO_ES[code]) || day.skyLabel,
      waveHeight: day.row1 === "return" ? day.waveHeight : wave != null ? round1(wave) : day.waveHeight,
      windDirDeg: Math.round(numOr(cell(w, "wind_direction_10m_dominant", iw), day.windDirDeg)),
      swellDirDeg: Math.round(numOr(cell(m, "swell_wave_direction_dominant", im), day.swellDirDeg)),
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
  const windDirs = seed.days.map((d) => cell(w, "wind_direction_10m_dominant", wi.get(d.date))).filter((x): x is number => x != null);
  const swellDirs = seed.days.map((d) => cell(m, "swell_wave_direction_dominant", mi.get(d.date))).filter((x): x is number => x != null);

  const windDirDeg = windDirs.length ? Math.round(circularMeanDeg(windDirs)) % 360 : seed.conditions.windDirDeg;
  const swellDirDeg = swellDirs.length ? Math.round(circularMeanDeg(swellDirs)) % 360 : seed.conditions.swellDirDeg;
  const water = portus !== undefined ? waterFromPortus(parsePortusSst(portus)) : { text: seed.conditions.waterText, source: seed.conditions.waterSource };

  const conditions: Conditions = {
    ...seed.conditions,
    uvText: uvs.length ? "UV " + Math.round(Math.max(...uvs)) : seed.conditions.uvText,
    // Mean of the daily-max winds: a window summary, so one breezy day shouldn't flip "Flojo" -> "Moderado".
    windText: winds.length ? windClass(mean(winds)) : seed.conditions.windText,
    periodText: periods.length ? rangeText(periods) : seed.conditions.periodText,
    windDirDeg,
    windCleanliness: windDirs.length ? windCleanliness(windDirDeg) : seed.conditions.windCleanliness,
    swellDirDeg,
    swellDirLabel: swellDirs.length ? compassEs(swellDirDeg) : seed.conditions.swellDirLabel,
    waterText: water.text,
    waterSource: water.source,
  };

  const hourly = buildHourly(mh, wh);

  return { days, waves, conditions, hourly, source: "live", fetchedAt: Date.now() };
}

function okJson(r: Response): Promise<unknown> {
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// A failed Portus fetch must never blank the gauge: resolve to undefined so the merge keeps the seed range.
async function fetchPortus(signal: AbortSignal): Promise<unknown> {
  try {
    return await fetch(PORTUS_SST_URL, { signal, cache: "no-store" }).then(okJson);
  } catch {
    return undefined;
  }
}

// Fetch + merge. Own timeout via AbortController so a hung request falls through to the cache/seed chain.
export async function fetchForecast(): Promise<ForecastModel> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const [w, m, p] = await Promise.all([
      fetch(WEATHER_URL, { signal: ctrl.signal, cache: "no-store" }).then(okJson),
      fetch(MARINE_URL, { signal: ctrl.signal, cache: "no-store" }).then(okJson),
      fetchPortus(ctrl.signal),
    ]);
    return mergeForecast(w, m, p);
  } finally {
    clearTimeout(timer);
  }
}

// --- Cache revive (untrusted localStorage) ---

function reviveHourPoint(raw: unknown, fallback: HourPoint): HourPoint {
  if (!raw || typeof raw !== "object") return fallback;
  const c = raw as Record<string, unknown>;
  const waveHeight = numOr(c.waveHeight, fallback.waveHeight);
  const wavePeriod = numOr(c.wavePeriod, fallback.wavePeriod);
  return {
    timeLabel: strOr(c.timeLabel, fallback.timeLabel),
    minutes: numOr(c.minutes, fallback.minutes),
    waveHeight,
    wavePeriod,
    waveDirDeg: numOr(c.waveDirDeg, fallback.waveDirDeg),
    swellHeight: numOr(c.swellHeight, fallback.swellHeight),
    swellPeriod: numOr(c.swellPeriod, fallback.swellPeriod),
    swellDirDeg: numOr(c.swellDirDeg, fallback.swellDirDeg),
    windSeaHeight: numOr(c.windSeaHeight, fallback.windSeaHeight),
    windSeaDirDeg: numOr(c.windSeaDirDeg, fallback.windSeaDirDeg),
    windSpeed: numOr(c.windSpeed, fallback.windSpeed),
    windDirDeg: numOr(c.windDirDeg, fallback.windDirDeg),
    // Recompute from the (possibly seeded) values so the index stays internally consistent.
    energy: relativeEnergy(waveHeight, wavePeriod),
  };
}

// Revive cached hourly: key by date over the seed, and validate each day's hours array defensively.
// A day with a wrong-length or non-array `hours` drops entirely to its seed hours.
function reviveHourly(raw: unknown): HourlyDay[] {
  const arr = Array.isArray(raw) ? raw : [];
  const byDate = new Map<string, unknown>();
  for (const d of arr) {
    if (d && typeof d === "object" && typeof (d as { date?: unknown }).date === "string") {
      byDate.set((d as { date: string }).date, (d as { hours?: unknown }).hours);
    }
  }
  return FORECAST_SEED.hourly.map((seedDay) => {
    const hours = byDate.get(seedDay.date);
    // Accept whatever length the cache holds: live builds 24 hourly points, the seed is 3-hourly (8).
    // Forcing the seed length would silently drop a cached live day back to 8 points offline-after-live.
    if (!Array.isArray(hours) || hours.length === 0) return seedDay;
    const fb = (i: number) => seedDay.hours[i] ?? seedDay.hours[seedDay.hours.length - 1];
    return { date: seedDay.date, hours: hours.map((h, i) => reviveHourPoint(h, fb(i))) };
  });
}

function reviveCleanliness(v: unknown, fallback: WindCleanliness): WindCleanliness {
  return v === "offshore" || v === "onshore" || v === "cross" ? v : fallback;
}
function reviveWaterSource(v: unknown, fallback: WaterSource): WaterSource {
  return v === "portus" || v === "seed" ? v : fallback;
}

// Revive an untrusted localStorage cache: validate structure + date alignment, merge per-field over the
// seed (so an old/partial/corrupt shape degrades to seed values rather than rendering holes).
export function reviveModel(raw: unknown): ForecastModel | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { days?: unknown; waves?: unknown; conditions?: unknown; hourly?: unknown; fetchedAt?: unknown };
  if (!Array.isArray(r.days) || r.days.length !== FORECAST_SEED.days.length) return null;
  if (!Array.isArray(r.waves) || r.waves.length !== FORECAST_SEED.waves.length) return null;

  const days = r.days as Array<Record<string, unknown>>;
  const waves = r.waves as Array<Record<string, unknown>>;
  if (!FORECAST_SEED.days.every((d, i) => days[i]?.date === d.date)) return null;
  if (!FORECAST_SEED.waves.every((wd, i) => waves[i]?.date === wd.date)) return null;

  const mergedDays: DayForecast[] = FORECAST_SEED.days.map((d, i) => {
    const c = days[i] ?? {};
    return {
      ...d,
      tMax: Math.round(numOr(c.tMax, d.tMax)),
      tMin: Math.round(numOr(c.tMin, d.tMin)),
      precipProb: Math.round(numOr(c.precipProb, d.precipProb)),
      skyLabel: strOr(c.skyLabel, d.skyLabel),
      waveHeight: numOr(c.waveHeight, d.waveHeight),
      windDirDeg: numOr(c.windDirDeg, d.windDirDeg),
      swellDirDeg: numOr(c.swellDirDeg, d.swellDirDeg),
    };
  });
  const mergedWaves = FORECAST_SEED.waves.map((wd, i) => {
    const c = waves[i] ?? {};
    return { ...wd, v: wd.v == null ? null : numOr(c.v, wd.v) };
  });
  const cond = (r.conditions ?? {}) as Record<string, unknown>;
  const sc = FORECAST_SEED.conditions;
  const conditions: Conditions = {
    periodText: strOr(cond.periodText, sc.periodText),
    windText: strOr(cond.windText, sc.windText),
    waterText: strOr(cond.waterText, sc.waterText),
    uvText: strOr(cond.uvText, sc.uvText),
    windDirDeg: numOr(cond.windDirDeg, sc.windDirDeg),
    windCleanliness: reviveCleanliness(cond.windCleanliness, sc.windCleanliness),
    swellDirDeg: numOr(cond.swellDirDeg, sc.swellDirDeg),
    swellDirLabel: strOr(cond.swellDirLabel, sc.swellDirLabel),
    waterSource: reviveWaterSource(cond.waterSource, sc.waterSource),
  };
  const hourly = reviveHourly(r.hourly);
  const fetchedAt = typeof r.fetchedAt === "number" && isFinite(r.fetchedAt) ? r.fetchedAt : null;
  return { days: mergedDays, waves: mergedWaves, conditions, hourly, source: "cache", fetchedAt };
}

// Re-export the energy formula's constant for callers that document the index (kept here for discoverability).
export { ENERGY_K };
