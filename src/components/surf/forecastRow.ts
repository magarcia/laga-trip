import type { DayForecast, RowKind } from "../../types/forecast";
import { nf1 } from "../../lib/format";

// Maps a fixed row kind (set by the seed) to its icon + value text. Shared by ForecastStrip and the
// Hoy TodayCard so the "today" chip can never disagree with the strip card.
export function rowContent(kind: RowKind, day: DayForecast): { icon: string; text: string } {
  switch (kind) {
    case "wave":
      return { icon: "i-waves", text: `~${nf1(day.waveHeight)} m` };
    case "precip":
      return { icon: "i-drop", text: `${day.precipProb}%` };
    case "sky":
      return { icon: "i-sun", text: day.skyLabel };
    case "return":
      return { icon: "i-bus", text: "Vuelta" };
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
