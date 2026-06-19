// Spanish decimal comma: 0.7 -> "0,7"
export function nf1(x: number): string {
  return x.toFixed(1).replace(".", ",");
}

export function hhmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}
