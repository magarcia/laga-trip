import type { ForecastModel } from "../types/forecast";

// Exact current hardcoded values from the shipping static site (index.html fday rows + statline + gauges,
// and the WAVES array in app.js). This is the parity oracle and the offline/first-paint fallback: with no
// network and no cache the React app renders byte-for-byte what shipped before the live-data layer.
export const FORECAST_SEED: ForecastModel = {
  days: [
    { date: "2026-06-20", label: "Sáb 20", tMax: 24, tMin: 18, waveHeight: 0.7, precipProb: 30, skyLabel: "Despejado", row1: "wave", row2: "precip" },
    { date: "2026-06-21", label: "Dom 21", tMax: 31, tMin: 18, waveHeight: 0.7, precipProb: 20, skyLabel: "Despejado", row1: "wave", row2: "sky" },
    { date: "2026-06-22", label: "Lun 22", tMax: 30, tMin: 22, waveHeight: 0.7, precipProb: 0, skyLabel: "Despejado", row1: "wave", row2: "sky" },
    { date: "2026-06-23", label: "Mar 23", tMax: 29, tMin: 20, waveHeight: 0.6, precipProb: 10, skyLabel: "Despejado", row1: "wave", row2: "precip" },
    { date: "2026-06-24", label: "Mié 24", tMax: 32, tMin: 23, waveHeight: 0.4, precipProb: 10, skyLabel: "Despejado", row1: "return", row2: "precip" },
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
  },
  source: "seed",
  fetchedAt: null,
};
