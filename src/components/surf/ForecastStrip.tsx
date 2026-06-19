import { useState } from "react";
import { useForecastModel, useNowValue } from "../../contexts";
import { mDate } from "../../lib/time";
import { Icon } from "../Icon";
import { rowContent } from "./forecastRow";
import { DayDetail } from "./DayDetail";

export function ForecastStrip() {
  const now = useNowValue();
  const model = useForecastModel();
  const ds = mDate(now);
  // Accordion: at most one day expanded. Default to today's card if the trip is in progress; otherwise
  // (pre/post trip) all collapsed. In frozen ?now= mode "today" is the frozen date, so its card auto-opens.
  const [openDate, setOpenDate] = useState<string | null>(() =>
    model.days.some((d) => d.date === ds) ? ds : null,
  );
  const openDay = openDate ? model.hourly.find((h) => h.date === openDate) : undefined;

  return (
    <>
      <div className="fcast">
        {model.days.map((day) => {
          const isOpen = day.date === openDate;
          const cls = day.date === ds ? "fday today" : day.date < ds ? "fday past" : "fday";
          const r1 = rowContent(day.row1, day);
          const r2 = rowContent(day.row2, day);
          return (
            <button
              key={day.date}
              type="button"
              className={isOpen ? `${cls} fday-open` : cls}
              data-date={day.date}
              aria-expanded={isOpen}
              aria-label={`Ver detalle por horas de ${day.label}`}
              onClick={() => setOpenDate(isOpen ? null : day.date)}
            >
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
              <div className="fd-toggle" aria-hidden="true">
                <Icon name="i-chev" className="ic fd-chev" />
              </div>
            </button>
          );
        })}
      </div>
      {openDay && <DayDetail day={openDay} />}
    </>
  );
}
