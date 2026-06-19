import { useState } from "react";
import { useNowValue } from "../../contexts";
import { mDate, madridMinutes } from "../../lib/time";
import { TRIP_END, TRIP_START } from "../../lib/timeline";
import { PAD_T, PLOT_H, TIDE_DAYS, TIDES, VB_H, VB_W, buildTide, tideMarker } from "../../lib/tides";
import { Icon } from "../Icon";

function defaultDay(now: Date): string {
  const ds = mDate(now);
  return now >= TRIP_START && now <= TRIP_END && TIDES[ds] ? ds : "2026-06-20";
}

export function TideChart() {
  const now = useNowValue();
  // Selected day is initialized once from "today"; a manual pick must survive the clock tick, so it is
  // never re-derived from `now`.
  const [sel, setSel] = useState<string>(() => defaultDay(now));
  const tide = buildTide(sel);

  const ds = mDate(now);
  const inWindow = now >= TRIP_START && now <= TRIP_END;
  // The live marker belongs only on today's curve; browsing another day hides it by design.
  const marker = inWindow && sel === ds && TIDES[ds] ? tideMarker(sel, madridMinutes(now)) : null;

  if (!tide) return null; // sel is always a valid TIDES key

  return (
    <div className="panel" id="tidePanel">
      <div className="panel-h">
        <div className="badge">
          <Icon name="i-waves" />
        </div>
        <div>
          <h3>Marea del día</h3>
          <div className="where">Laga · hora local</div>
        </div>
      </div>

      <div className="tide-days" id="tideDays" role="group" aria-label="Día de marea">
        {TIDE_DAYS.map((d) => (
          <button
            key={d.date}
            className="tide-day"
            data-tdate={d.date}
            aria-pressed={d.date === sel}
            onClick={() => setSel(d.date)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="tide-chart">
        <svg id="tideSvg" viewBox="0 0 720 250" preserveAspectRatio="none" role="img" aria-labelledby="tideDesc" focusable="false">
          {tide.nightRects.map((r, i) => (
            <rect key={`night-${i}`} className="tide-night" x={r.x} y={PAD_T} width={r.width} height={PLOT_H} />
          ))}
          {tide.grid.map((g, i) => (
            <g key={`grid-${i}`}>
              {g.line && <line className="tide-grid" x1={g.x} y1={PAD_T} x2={g.x} y2={PAD_T + PLOT_H} />}
              <text className="tide-axis" x={g.x} y={VB_H - 8} textAnchor={g.anchor}>
                {g.label}
              </text>
            </g>
          ))}
          <line className="tide-mid" x1={0} y1={tide.midY} x2={VB_W} y2={tide.midY} />
          <path className="tide-fill" d={tide.areaPath} />
          <path className="tide-curve" d={tide.curvePath} />
          {tide.extremes.map((e, i) => (
            <g key={`ex-${i}`}>
              <circle className="tide-dot" cx={e.x} cy={e.y} r="4" />
              <text className="tide-lbl" x={e.x} y={e.timeY} textAnchor={e.anchor}>
                {e.timeLabel}
              </text>
              <text className="tide-extkind" x={e.x} y={e.kindY} textAnchor={e.anchor}>
                {e.kindLabel}
              </text>
            </g>
          ))}
          {marker && (
            <g id="tideNow">
              <line className="tide-now-line" x1={marker.x} y1={PAD_T} x2={marker.x} y2={PAD_T + PLOT_H} />
              <circle className="tide-now-dot" cx={marker.x} cy={marker.y} r="4.5" />
            </g>
          )}
        </svg>
        <p className="sr" id="tideDesc">
          {tide.desc}
        </p>
      </div>

      <div className="tide-legend">
        <span>
          <i className="sw sw-day" />
          Día
        </span>
        <span>
          <i className="sw sw-night" />
          Noche
        </span>
        <span>
          <i className="sw sw-mid" />
          Media marea
        </span>
      </div>
      <div className="note">
        <Icon name="i-info" /> La media marea suele ser la mejor ventana en esta playa: ni la corriente de la baja ni el
        cierre de la alta.
      </div>
    </div>
  );
}
