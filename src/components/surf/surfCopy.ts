import type { WindCleanliness } from "../../types/forecast";
import { nf1 } from "../../lib/format";

// Plain-language label for wind cleanliness. The word reads at a glance; the arrow/degrees give the detail.
export function cleanlinessLabel(c: WindCleanliness): string {
  switch (c) {
    case "offshore":
      return "Offshore (limpio)";
    case "onshore":
      return "Onshore (movido)";
    case "cross":
      return "Lateral";
    default: {
      const exhaustive: never = c;
      return exhaustive;
    }
  }
}

// "¿Me meto?" conditions-read thresholds (m of wave height, km/h of wind).
const GOOD_MAX_WAVE = 1.2;
const GOOD_MAX_WIND = 20;
const CARE_MAX_WAVE = 1.5;
const CARE_MAX_WIND = 30;

export type Verdict = "good" | "care" | "watch";

export interface VerdictResult {
  verdict: Verdict;
  title: string; // neutral Spanish verdict for the whole group
  why: string; // one-line reason
}

function windWord(windSpeed: number): string {
  if (windSpeed < GOOD_MAX_WIND) return "viento flojo";
  if (windSpeed < CARE_MAX_WIND) return "viento moderado";
  return "viento fuerte";
}

// Synthesize a single conditions signal from wave height, wind speed and wind cleanliness.
export function meMetoVerdict(waveHeight: number, windSpeed: number, cleanliness: WindCleanliness): VerdictResult {
  const offshore = cleanliness === "offshore";
  const cleanWord = cleanliness === "offshore" ? " offshore" : cleanliness === "onshore" ? " onshore" : " lateral";
  const why = `${nf1(waveHeight)} m · ${windWord(windSpeed)}${cleanWord}`;

  if (waveHeight <= GOOD_MAX_WAVE && windSpeed < GOOD_MAX_WIND) {
    return { verdict: "good", title: "Buen día para entrar", why };
  }
  if (waveHeight <= CARE_MAX_WAVE && (windSpeed < CARE_MAX_WIND || offshore)) {
    return { verdict: "care", title: "Con cuidado", why };
  }
  return { verdict: "watch", title: "Hoy, mejor mirar", why };
}
