import { useForecastModel, useNowValue } from "../../contexts";

const HOUR_MS = 60 * 60 * 1000;

// Human freshness for the forecast: "datos de ejemplo" on the seed, otherwise "actualizado hace N".
function freshnessText(source: string, fetchedAt: number | null, now: number): string {
  if (source === "seed" || fetchedAt == null) return "datos de ejemplo";
  const ageMs = Math.max(0, now - fetchedAt);
  const hours = Math.floor(ageMs / HOUR_MS);
  if (hours >= 1) return `actualizado hace ${hours} h`;
  const mins = Math.floor(ageMs / (60 * 1000));
  if (mins >= 1) return `actualizado hace ${mins} min`;
  return "actualizado ahora";
}

export function Freshness() {
  const { source, fetchedAt } = useForecastModel();
  const now = useNowValue();
  return <span className="freshness">{freshnessText(source, fetchedAt, now.getTime())}</span>;
}
