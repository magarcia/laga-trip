import { useForecastModel } from "../../contexts";
import { Icon } from "../Icon";
import { DirArrow } from "./DirArrow";
import { cleanlinessLabel } from "./surfCopy";

// Pull the first number out of a free-text value ("UV 8" -> 8, "20–21" -> 20). Returns null when
// there is no parseable number, so callers can skip the visual hint gracefully.
function firstNumber(text: string): number | null {
  const match = text.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const n = Number(match[0].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Standard UV-index bands; the gauge fills its track with these and drops a marker on the value.
const UV_BANDS = [
  { until: 2, color: "#3ea72d" }, // low
  { until: 5, color: "#f7d000" }, // moderate
  { until: 7, color: "#f08800" }, // high
  { until: 10, color: "#d8001d" }, // very high
  { until: Infinity, color: "#8a2be2" }, // extreme
] as const;

const UV_GAUGE_MAX = 12; // marker position is uv / UV_GAUGE_MAX; 11+ pins to the extreme end

function uvColor(uv: number): string {
  return (UV_BANDS.find((b) => uv <= b.until) ?? UV_BANDS[UV_BANDS.length - 1]).color;
}

// Cool -> warm water-temp swatch + a one-word qualifier (positive around 20-21 for a wetsuit session).
function waterHint(temp: number): { color: string; word: string } {
  if (temp < 16) return { color: "#2f80c4", word: "fría" };
  if (temp < 19) return { color: "#2aa7a0", word: "fresca" };
  if (temp < 22) return { color: "#3ea72d", word: "agradable" };
  return { color: "#ef8a1f", word: "buena" };
}

// Compass label (ES, 8-point) from a FROM-direction in degrees.
const COMPASS_ES = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;

function compassEs(deg: number): string {
  return COMPASS_ES[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

export function StatLine() {
  const { conditions } = useForecastModel();
  const uv = firstNumber(conditions.uvText);
  const water = firstNumber(conditions.waterText);
  const windCompass = compassEs(conditions.windDirDeg);
  const cleanWord = cleanlinessLabel(conditions.windCleanliness);
  const waterTip = water != null ? waterHint(water) : null;

  return (
    <div className="statline" style={{ margin: "8px 0 14px" }}>
      <div className="stat">
        <div className="v statval">
          {waterTip && <span className="water-dot" style={{ background: waterTip.color }} aria-hidden="true" />}
          {conditions.waterText}°
        </div>
        <div className="k">
          <Icon name="i-drop" />
          Agua{waterTip && ` · ${waterTip.word}`}
        </div>
      </div>
      <div className="stat">
        <div className="v">{conditions.uvText}</div>
        {uv != null && (
          <div className="uv-gauge" role="img" aria-label={`Índice UV ${uv}`}>
            <span className="uv-track" />
            <span
              className="uv-mark"
              style={{
                left: `${Math.min(uv / UV_GAUGE_MAX, 1) * 100}%`,
                background: uvColor(uv),
              }}
            />
          </div>
        )}
        <div className="k">
          <Icon name="i-sun" />
          Crema sí o sí
        </div>
      </div>
      <div className="stat">
        <div className="v statval">
          {conditions.windText}
          <DirArrow fromDeg={conditions.windDirDeg} title={`Viento del ${windCompass}`} />
          <span className="wind-compass mono">{windCompass}</span>
        </div>
        <div className="k">
          <Icon name="i-wind" />
          {cleanWord}
        </div>
      </div>
    </div>
  );
}
