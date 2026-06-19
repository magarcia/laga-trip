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
  let p = raw.trim();
  // A literal "+02:00" in the query is decoded by URLSearchParams to " 02:00"; restore the sign.
  p = p.replace(/ (\d\d:?\d\d)$/, "+$1");
  // A bare datetime (no offset) would parse in the device tz; force Madrid CEST so previews are stable everywhere.
  if (!/(?:[zZ]|[+-]\d\d:?\d\d)$/.test(p)) p += "+02:00";
  const d = new Date(p);
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
