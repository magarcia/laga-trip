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
  windDirDeg: number; // dominant wind FROM-direction in degrees
  swellDirDeg: number; // dominant swell FROM-direction in degrees
}

export interface WaveDay {
  date: string;
  label: string; // short: "Sáb"
  v: number | null; // m; null renders the "vuelta" na-bar
}

// Wind direction relative to the Laga shore-normal. "offshore" (limpio) grooms the wave, "onshore"
// (movido) flattens it, "cross" (lateral) is in between.
export type WindCleanliness = "offshore" | "onshore" | "cross";

// Where the water temperature came from: a real Portus reading, or the static seed fallback.
export type WaterSource = "portus" | "seed";

// Window summary tiles (gauges + statline). Values are separate from their labels so live data
// only replaces the value, never the copy ("Crema sí o sí").
export interface Conditions {
  periodText: string; // gauge "Periodo" value, e.g. "8–9"
  windText: string; // "Flojo"
  waterText: string; // "20–21" (gauge adds °, statline shows "20–21°")
  uvText: string; // "UV 8"
  windDirDeg: number; // representative wind FROM-direction in degrees
  windCleanliness: WindCleanliness; // offshore / onshore / cross vs. the Laga shore-normal
  swellDirDeg: number; // representative swell FROM-direction in degrees
  swellDirLabel: string; // compass ES, e.g. "NO"
  waterSource: WaterSource; // attribution + freshness for the water-temp gauge
}

// One hourly sample for the expandable per-day detail view. All directions are FROM-direction (deg).
export interface HourPoint {
  timeLabel: string; // "00h".."21h"/"23h", Madrid local
  minutes: number; // minutes from Madrid midnight (used to sample the tide curve)
  waveHeight: number; // m, combined sea
  wavePeriod: number; // s, combined sea
  waveDirDeg: number; // combined sea direction
  swellHeight: number; // m, swell partition (mar de fondo)
  swellPeriod: number; // s, swell partition
  swellDirDeg: number; // swell direction
  windSeaHeight: number; // m, wind-sea partition (mar de viento)
  windSeaDirDeg: number; // wind-sea direction
  windSpeed: number; // km/h
  windDirDeg: number; // wind FROM-direction
  tempC: number; // air temperature, °C (rounded)
  skyCode: number; // raw WMO weather code; the view maps it to an ES label + icon
  energy: number; // derived RELATIVE swell-energy index (not calibrated kJ)
}

export interface HourlyDay {
  date: string; // "YYYY-MM-DD"
  hours: HourPoint[];
}

export type ForecastSource = "seed" | "cache" | "live";

export interface ForecastModel {
  days: DayForecast[]; // 5 entries, 2026-06-20..24
  waves: WaveDay[]; // 4 entries, 2026-06-20..23
  conditions: Conditions;
  hourly: HourlyDay[]; // one entry per trip day (2026-06-20..24), seeded
  source: ForecastSource;
  fetchedAt: number | null;
}
