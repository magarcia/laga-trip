import type { HourlyDay, HourPoint } from "../../types/forecast";
import { nf1 } from "../../lib/format";
import { skyIconFor, skyLabelEs } from "../../lib/openMeteo";
import { tideHeightAt } from "../../lib/tides";
import { Icon } from "../Icon";
import { DirArrow } from "./DirArrow";

// Energy color scale: map the relative index onto a low/mid/high band for a subtle background tint.
const ENERGY_MID = 40;
const ENERGY_HIGH = 80;

function energyBand(energy: number): "lo" | "mid" | "hi" {
  if (energy >= ENERGY_HIGH) return "hi";
  if (energy >= ENERGY_MID) return "mid";
  return "lo";
}

// Always 3-hourly: collapse an hourly (24-pt) live series to the 8 three-hour columns; the seed is
// already 3-hourly so it passes through unchanged.
function sampleColumns(hours: HourPoint[]): HourPoint[] {
  if (hours.length <= 8) return hours; // seed / already coarse
  return hours.filter((h) => h.minutes % 180 === 0);
}

function bar(height: number, max: number): number {
  return Math.round(Math.min(height / max, 1) * 100);
}

const BAR_MAX_M = 1.0; // little wave-height bars in the detail grid; Laga rarely exceeds this

export function DayDetail({ day }: { day: HourlyDay }) {
  const cols = sampleColumns(day.hours);

  return (
    <div className="daydetail" role="group" aria-label={`Detalle cada 3 horas del ${day.date}`}>
      <div className="daydetail-scroll">
        <table className="dd-grid">
          <thead>
            <tr>
              <th scope="col" className="dd-rowhead" />
              {cols.map((h) => (
                <th key={h.minutes} scope="col" className="dd-time mono">
                  {h.timeLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 1. Temperatura del aire */}
            <tr>
              <th scope="row" className="dd-rowhead">
                Temp
              </th>
              {cols.map((h) => (
                <td key={h.minutes} className="dd-temp">
                  <span className="dd-num mono">{h.tempC}°</span>
                </td>
              ))}
            </tr>

            {/* 2. Cielo (WMO -> ES label + icon) */}
            <tr>
              <th scope="row" className="dd-rowhead">
                Cielo
              </th>
              {cols.map((h) => {
                const label = skyLabelEs(h.skyCode);
                return (
                  <td key={h.minutes} className="dd-sky" title={label}>
                    <span className="dd-cell">
                      <Icon name={skyIconFor(h.skyCode)} className="ic dd-sky-ic" />
                      <span className="dd-sub dd-sky-label">{label}</span>
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* 3. Olas combinadas: bar + height + period + direction */}
            <tr>
              <th scope="row" className="dd-rowhead">
                Olas
              </th>
              {cols.map((h) => (
                <td key={h.minutes} className="dd-wave">
                  <span className="dd-cell">
                    <span className="dd-minibar">
                      <span className="dd-minibar-fill" style={{ height: `${bar(h.waveHeight, BAR_MAX_M)}%` }} />
                    </span>
                    <span className="dd-num mono">{nf1(h.waveHeight)}</span>
                    <span className="dd-sub mono">{h.wavePeriod} s</span>
                    <DirArrow fromDeg={h.waveDirDeg} title={`Olas del ${h.waveDirDeg}°`} />
                  </span>
                </td>
              ))}
            </tr>

            {/* 4. Energía (relativa) */}
            <tr>
              <th scope="row" className="dd-rowhead">
                Energía<span className="dd-rel"> (rel.)</span>
              </th>
              {cols.map((h) => (
                <td key={h.minutes} className={`dd-energy dd-energy-${energyBand(h.energy)}`}>
                  <span className="dd-num mono">{h.energy}</span>
                </td>
              ))}
            </tr>

            {/* 5. Viento: arrow + speed */}
            <tr>
              <th scope="row" className="dd-rowhead">
                Viento
              </th>
              {cols.map((h) => (
                <td key={h.minutes} className="dd-wind">
                  <span className="dd-cell">
                    <DirArrow fromDeg={h.windDirDeg} title={`Viento del ${h.windDirDeg}°`} />
                    <span className="dd-num mono">{h.windSpeed}</span>
                    <span className="dd-sub mono">km/h</span>
                  </span>
                </td>
              ))}
            </tr>

            {/* 6. Marea sampled at each column time */}
            <tr>
              <th scope="row" className="dd-rowhead">
                Marea
              </th>
              {cols.map((h) => {
                const tide = tideHeightAt(day.date, h.minutes);
                return (
                  <td key={h.minutes} className="dd-tide">
                    <span className="dd-num mono">{tide == null ? "·" : nf1(tide)}</span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        {/* 5. Análisis de olas: combined / swell / wind-sea (a 2-partition model). */}
        <table className="dd-grid dd-analysis">
          <thead>
            <tr>
              <th scope="col" className="dd-rowhead">
                Análisis
              </th>
              {cols.map((h) => (
                <th key={h.minutes} scope="col" className="dd-time mono">
                  {h.timeLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnalysisRow label="Combinada" cols={cols} pick={(h) => ({ m: h.waveHeight, s: h.wavePeriod, dir: h.waveDirDeg })} />
            <AnalysisRow label="Mar de fondo" cols={cols} pick={(h) => ({ m: h.swellHeight, s: h.swellPeriod, dir: h.swellDirDeg })} />
            <AnalysisRow label="Mar de viento" cols={cols} pick={(h) => ({ m: h.windSeaHeight, s: null, dir: h.windSeaDirDeg })} />
          </tbody>
        </table>
        <p className="dd-note">
          <Icon name="i-info" /> Modelo de 2 particiones (combinada / mar de fondo / mar de viento), no trenes de mar
          independientes.
        </p>
      </div>
    </div>
  );
}

function AnalysisRow({
  label,
  cols,
  pick,
}: {
  label: string;
  cols: HourPoint[];
  pick: (h: HourPoint) => { m: number; s: number | null; dir: number };
}) {
  return (
    <tr>
      <th scope="row" className="dd-rowhead">
        {label}
      </th>
      {cols.map((h) => {
        const v = pick(h);
        return (
          <td key={h.minutes} className="dd-part">
            <span className="dd-cell">
              <span className="dd-num mono">{nf1(v.m)}</span>
              {v.s != null && <span className="dd-sub mono">{v.s} s</span>}
              <DirArrow fromDeg={v.dir} title={`${label} del ${v.dir}°`} />
            </span>
          </td>
        );
      })}
    </tr>
  );
}
