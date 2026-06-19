import { useForecastModel, useNowValue } from "../../contexts";
import { mDate } from "../../lib/time";
import { Icon } from "../Icon";
import { meMetoVerdict } from "./surfCopy";

const VERDICT_ICON = { good: "i-check", care: "i-info", watch: "i-triangle-alert" } as const;

// Representative daytime wind for a day: mean of the hourly wind speed over surf hours (09h-21h),
// falling back to the whole day, then to a calm default. We surf in daylight, so a 3 a.m. gust
// shouldn't sway the verdict.
function daytimeWind(windSpeeds: { minutes: number; windSpeed: number }[]): number {
  const day = windSpeeds.filter((h) => h.minutes >= 9 * 60 && h.minutes <= 21 * 60);
  const pool = day.length ? day : windSpeeds;
  if (!pool.length) return 0;
  return pool.reduce((a, h) => a + h.windSpeed, 0) / pool.length;
}

export function MeMeto() {
  const now = useNowValue();
  const { days, conditions, hourly } = useForecastModel();
  const ds = mDate(now);

  // Today when in-window, otherwise the first surfable trip day (the "return" day has no verdict).
  const day = days.find((d) => d.date === ds && d.row1 !== "return") ?? days.find((d) => d.row1 !== "return") ?? days[0];
  const dayHours = hourly.find((h) => h.date === day.date)?.hours ?? [];
  const windSpeed = Math.round(daytimeWind(dayHours));

  const { verdict, title, why } = meMetoVerdict(day.waveHeight, windSpeed, conditions.windCleanliness);

  return (
    <div className={`memeto memeto-${verdict}`} role="status">
      <Icon name={VERDICT_ICON[verdict]} className="ic memeto-ic" />
      <div className="memeto-text">
        <span className="memeto-title">{title}</span>
        <span className="memeto-why mono">{why}</span>
      </div>
    </div>
  );
}
