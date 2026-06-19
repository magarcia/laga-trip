import { useForecastModel, useNowValue } from "../../contexts";
import { mDate } from "../../lib/time";
import { nf1 } from "../../lib/format";
import { Icon } from "../Icon";

const MAX_WAVE = 1.0;
const DAY_FULL: Record<string, string> = { Sáb: "sábado", Dom: "domingo", Lun: "lunes", Mar: "martes" };

export function WaveBars() {
  const now = useNowValue();
  const { waves } = useForecastModel();
  const ds = mDate(now);

  // Generated from the same data the bars render, so the a11y label can never drift (the old static
  // label was stale: it said lunes 0,5 / martes 0,4 while the bars showed 0,7 / 0,6).
  const ariaLabel =
    "Altura de ola estimada por día: " +
    waves
      .map((w, i) => `${DAY_FULL[w.label] ?? w.label} ${w.v == null ? "—" : nf1(w.v)}${i === 0 ? " metros" : ""}`)
      .join(", ") +
    ".";

  return (
    <div className="panel" id="wavePanel">
      <div className="panel-h">
        <div className="badge">
          <Icon name="i-waves" />
        </div>
        <div>
          <h3>Altura de ola</h3>
          <div className="where">Pico de oleaje por día</div>
        </div>
      </div>
      <div className="bars" role="img" aria-label={ariaLabel}>
        {waves.map((w) => {
          const today = w.date === ds;
          if (w.v == null) {
            return (
              <div key={w.date} className={today ? "bar-col na today" : "bar-col na"}>
                <div className="bar-na">vuelta</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: 0 }} />
                </div>
                <div className="bar-day">{w.label}</div>
              </div>
            );
          }
          const pct = Math.round(Math.min(w.v / MAX_WAVE, 1) * 100);
          return (
            <div key={w.date} className={today ? "bar-col today" : "bar-col"}>
              <div className="bar-val">{nf1(w.v)} m</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ height: `${pct}%` }} />
              </div>
              <div className="bar-day">{w.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
