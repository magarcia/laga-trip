import { useForecastModel, useNowValue } from "../../contexts";
import { mDate } from "../../lib/time";
import { Icon } from "../Icon";
import { rowContent } from "./forecastRow";

export function ForecastStrip() {
  const now = useNowValue();
  const model = useForecastModel();
  const ds = mDate(now);
  return (
    <div className="fcast">
      {model.days.map((day) => {
        const cls = day.date === ds ? "fday today" : day.date < ds ? "fday past" : "fday";
        const r1 = rowContent(day.row1, day);
        const r2 = rowContent(day.row2, day);
        return (
          <div key={day.date} className={cls} data-date={day.date}>
            <div className="fd-d">{day.label}</div>
            <div className="fd-t">
              {day.tMax}°<small> /{day.tMin}°</small>
            </div>
            <div className="fd-row">
              <Icon name={r1.icon} />
              {r1.text}
            </div>
            <div className="fd-row">
              <Icon name={r2.icon} />
              {r2.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
