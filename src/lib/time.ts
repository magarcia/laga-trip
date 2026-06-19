// All trip logic is Europe/Madrid (CEST +02:00 in June). These formatters are device-tz independent.
const MADRID_YMD = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const MADRID_HM = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Madrid",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// YYYY-MM-DD in Madrid.
export function mDate(d: Date): string {
  return MADRID_YMD.format(d);
}

// Minutes from local midnight in Madrid.
export function madridMinutes(d: Date): number {
  let h = 0;
  let m = 0;
  for (const p of MADRID_HM.formatToParts(d)) {
    if (p.type === "hour") h = +p.value;
    else if (p.type === "minute") m = +p.value;
  }
  return h * 60 + m;
}

// Parse the ?now= preview override. Returns null when absent or unparseable (caller uses the live clock).
export function parseNowParam(search: string): Date | null {
  const raw = new URLSearchParams(search).get("now");
  if (!raw) return null;
  const p = raw.trim();

  // Split into the date and an optional remainder (the time, then optional offset). A "T" or a
  // space separates date from time; a date-only input has no separator.
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](.*))?$/.exec(p);
  if (!m) return null;
  const [, date, rest] = m;

  // Date-only: preview that day at Madrid midnight. A bare "YYYY-MM-DD+02:00" is rejected by Date,
  // so a full time component is required.
  if (rest == null || rest === "") return finalize(`${date}T00:00:00+02:00`);

  // A literal "+02:00" in the query decodes to a leading space in the offset (URLSearchParams turns
  // "+" into " "). The wall-clock time and a space-decoded offset look alike, so we only treat a
  // trailing " HH:MM"/" HHMM" as an offset when a full time already precedes it.
  const offset = / (\d\d:?\d\d)$/;
  let time = rest;
  if (offset.test(time)) {
    time = time.replace(offset, "+$1");
  } else if (!/(?:[zZ]|[+-]\d\d:?\d\d)$/.test(time)) {
    // Bare datetime (no offset): force Madrid CEST so previews are stable regardless of device tz.
    time += "+02:00";
  }
  return finalize(`${date}T${time}`);
}

function finalize(iso: string): Date | null {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// "2d 3h 5min" countdown; clamps negatives, omits leading zero units.
export function delta(ms: number): string {
  if (ms < 0) ms = 0;
  let m = Math.floor(ms / 6e4);
  const d = Math.floor(m / 1440);
  m -= d * 1440;
  const h = Math.floor(m / 60);
  m -= h * 60;
  const out: string[] = [];
  if (d) out.push(d + "d");
  if (d || h) out.push(h + "h");
  out.push(m + "min");
  return out.join(" ");
}

// Footer clock, Madrid time, Spanish locale.
export function madridClock(d: Date): string {
  return d.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
