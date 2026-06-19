import { TIDES } from "../../lib/tides";

// Published lesson turns per day (orientativos: the camp sets the real time by the tide). Times in
// local hours; a turno is [startHour, endHour].
const TURNOS: { date: string; label: string; slots: [number, number][] }[] = [
  { date: "2026-06-20", label: "Sáb 20", slots: [[10, 12], [12, 14], [14, 16], [16, 18]] },
  { date: "2026-06-21", label: "Dom 21", slots: [[10, 12], [12, 14], [14, 16], [16, 18]] },
  { date: "2026-06-22", label: "Lun 22", slots: [[11, 13], [13, 15], [15, 17], [17, 19]] },
  { date: "2026-06-23", label: "Mar 23", slots: [[12, 14], [14, 16], [16, 18], [18, 20]] },
];

// A beach break works best around mid-tide (steepest part of the curve, between each high and low). We
// flag a turno when its window comes within this band of a mid-tide crossing.
const MID_TIDE_BAND_MIN = 90;

// Mid-tide crossing times (min from midnight): the midpoint between each pair of consecutive extremes.
function midTideCrossings(date: string): number[] {
  const ex = TIDES[date];
  if (!ex) return [];
  const out: number[] = [];
  for (let i = 0; i < ex.length - 1; i++) out.push((ex[i][0] + ex[i + 1][0]) / 2);
  return out;
}

// True when [startMin, endMin] comes within MID_TIDE_BAND_MIN of any mid-tide crossing.
function nearMidTide(crossings: number[], startMin: number, endMin: number): boolean {
  return crossings.some((c) => endMin >= c - MID_TIDE_BAND_MIN && startMin <= c + MID_TIDE_BAND_MIN);
}

function fmt(h: number): string {
  return (h < 10 ? "0" : "") + h;
}

export function Turnos() {
  return (
    <>
      <table className="turnos">
        <caption>Turnos publicados por el camp · orientativos, el horario real lo fija el camp según la marea</caption>
        <thead>
          <tr>
            <th>Día</th>
            <th>1º</th>
            <th>2º</th>
            <th>3º</th>
            <th>4º</th>
          </tr>
        </thead>
        <tbody>
          {TURNOS.map((row) => {
            const crossings = midTideCrossings(row.date);
            return (
              <tr key={row.date}>
                <th>{row.label}</th>
                {row.slots.map(([s, e]) => {
                  const good = nearMidTide(crossings, s * 60, e * 60);
                  return (
                    <td key={s} className={good ? "turno-mid" : undefined}>
                      {fmt(s)}–{fmt(e)}
                      {good && (
                        <>
                          <span className="turno-dot" aria-hidden="true" />
                          <span className="sr"> (cerca de la media marea)</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="turnos-legend">
        <span className="turno-dot" aria-hidden="true" /> turnos cerca de la media marea
      </p>
    </>
  );
}
