import { useForecastModel, useNowValue } from "../../contexts";
import type { DayForecast } from "../../types/forecast";
import { mDate } from "../../lib/time";
import { phase } from "../../lib/timeline";
import { Icon } from "../Icon";
import { rowContent } from "../surf/forecastRow";

function TodayChips({ day }: { day: DayForecast }) {
  return (
    <>
      <span className="tag accent">
        <Icon name="i-thermo" />
        {`${day.tMax}° /${day.tMin}°`}
      </span>
      {[day.row1, day.row2].map((kind, i) => {
        const { icon, text } = rowContent(kind, day);
        return (
          <span className="tag" key={i}>
            <Icon name={icon} />
            {text}
          </span>
        );
      })}
    </>
  );
}

export function TodayCard() {
  const now = useNowValue();
  const model = useForecastModel();
  const ph = phase(now);
  const ds = mDate(now);
  const day = model.days.find((d) => d.date === ds);

  return (
    <div className="panel">
      <div className="panel-h">
        <div className="badge">
          <Icon name="i-thermo" />
        </div>
        <div>
          <h3>{ph.title}</h3>
          <div className="where">{ph.sub}</div>
        </div>
      </div>
      <div className="today-strip">
        {day ? (
          <TodayChips day={day} />
        ) : (
          <span className="tag">
            <Icon name="i-cal" />
            20–24 junio · Urdaibai
          </span>
        )}
      </div>
      <div className="actions">
        {ph.cta && (
          <a className="btn btn-primary" href={ph.cta[0]} target="_blank" rel="noopener">
            <Icon name="i-nav" />
            <span>{ph.cta[1]}</span>
          </a>
        )}
        <a
          className="btn"
          target="_blank"
          rel="noopener"
          href="https://www.surf-forecast.com/breaks/Playade-Laga/forecasts/latest/six_day"
        >
          <Icon name="i-waves" />
          Previsión
        </a>
      </div>
    </div>
  );
}
