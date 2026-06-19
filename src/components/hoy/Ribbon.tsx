import { useNowValue } from "../../contexts";
import { mDate, madridMinutes } from "../../lib/time";
import { RIBBON_DAY0 } from "../../lib/timeline";
import { Icon } from "../Icon";

const RIBBON_DAYS = [
  { date: "2026-06-19", d: "Vie", n: "19", icon: "i-bus" },
  { date: "2026-06-20", d: "Sáb", n: "20", icon: "i-waves" },
  { date: "2026-06-21", d: "Dom", n: "21", icon: "i-waves" },
  { date: "2026-06-22", d: "Lun", n: "22", icon: "i-waves" },
  { date: "2026-06-23", d: "Mar", n: "23", icon: "i-flame" },
  { date: "2026-06-24", d: "Mié", n: "24", icon: "i-bus" },
] as const;

export function Ribbon() {
  const now = useNowValue();
  const ds = mDate(now);
  const mins = madridMinutes(now);
  const dayIndex = Math.round((Date.parse(ds + "T00:00:00Z") - RIBBON_DAY0) / 864e5);
  const showNow = dayIndex >= 0 && dayIndex <= 5;
  const left = ((dayIndex + mins / 1440) / 6) * 100;

  return (
    <div className="ribbon-wrap">
      <div className="ribbon-head">
        <span>El viaje</span>
        <span>Vie → Mié</span>
      </div>
      <div className="ribbon">
        {RIBBON_DAYS.map((r) => {
          const cls = r.date === ds ? "rday today" : r.date < ds ? "rday past" : "rday";
          return (
            <div key={r.date} className={cls} data-date={r.date}>
              <div className="rd-d">{r.d}</div>
              <div className="rd-n">{r.n}</div>
              <Icon name={r.icon} />
            </div>
          );
        })}
        <div className="now-line" style={{ display: showNow ? "block" : "none", left: showNow ? `${left}%` : undefined }} />
      </div>
    </div>
  );
}
