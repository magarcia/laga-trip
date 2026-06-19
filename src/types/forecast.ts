// The forecast model shape is owned by the static seed (lib/forecastSeed.ts). Live Open-Meteo data
// only ever REPLACES values inside this fixed shape — it never decides the shape. So offline / API-down
// / first paint renders exactly today's static values.

// A forecast-strip row. The kind is fixed per day by the seed (display contract); only values change.
export type RowKind = "wave" | "precip" | "sky" | "return";

export interface DayForecast {
  date: string; // "YYYY-MM-DD"
  label: string; // "Sáb 20"
  tMax: number; // °C
  tMin: number; // °C
  waveHeight: number; // m (used when a row is "wave")
  precipProb: number; // % (used when a row is "precip")
  skyLabel: string; // WMO->ES (used when a row is "sky")
  row1: RowKind; // "wave" for 20-23, "return" for the travel-home day (24)
  row2: RowKind; // "precip" or "sky"
}

export interface WaveDay {
  date: string;
  label: string; // short: "Sáb"
  v: number | null; // m; null renders the "vuelta" na-bar
}

// Window summary tiles (gauges + statline). Values are separate from their labels so live data
// only replaces the value, never the copy ("Viento · NW/NE mañanas", "Crema sí o sí").
export interface Conditions {
  periodText: string; // gauge "Periodo" value, e.g. "8–9"
  windText: string; // "Flojo"
  waterText: string; // "20–21" (gauge adds °, statline shows "20–21°")
  uvText: string; // "UV 8"
}

export type ForecastSource = "seed" | "cache" | "live";

export interface ForecastModel {
  days: DayForecast[]; // 5 entries, 2026-06-20..24
  waves: WaveDay[]; // 4 entries, 2026-06-20..23
  conditions: Conditions;
  source: ForecastSource;
  fetchedAt: number | null;
}
