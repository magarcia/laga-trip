import { mDate } from "./time";

// Trip phase boundaries, explicit +02:00 (CEST). Static — the date-aware engine depends on these.
export const B = {
  depart: new Date("2026-06-19T23:00:00+02:00"),
  arriveBilbao: new Date("2026-06-20T07:00:00+02:00"),
  checkin: new Date("2026-06-20T14:00:00+02:00"),
  leaveLaga: new Date("2026-06-23T17:00:00+02:00"),
  returnDepart: new Date("2026-06-24T10:30:00+02:00"),
  returnArrive: new Date("2026-06-24T18:00:00+02:00"),
} as const;

export const TRIP_START = B.depart;
export const TRIP_END = B.returnArrive;
export const RIBBON_DAY0 = Date.UTC(2026, 5, 19); // ribbon spans the 6 calendar days Jun 19..24

const Q = "https://www.google.com/maps/search/?api=1&query=";
export type Cta = readonly [href: string, label: string];

export const CTA = {
  bcnNord: [
    Q + "Estaci%C3%B3+d%27Autobusos+Barcelona+Nord%2C+C%2F+Al%C3%AD+Bei+80%2C+08013+Barcelona",
    "Barcelona Nord",
  ],
  bilbao: [Q + "Bilbao+Intermodal%2C+Gurtubay+Kalea+1%2C+48013+Bilbao", "Bilbao Intermodal"],
  rutaLaga: [
    "https://www.google.com/maps/dir/?api=1&origin=Bilbao+Intermodal%2C+Gurtubay+Kalea+1%2C+48013+Bilbao&destination=Laga+Surf+Camp+Hostel%2C+Elexalde+Auzoa+11%2C+48311+Elexalde&travelmode=transit",
    "Ruta a Laga",
  ],
  playa: [Q + "Playa+de+Laga%2C+Ibarrangelu%2C+Bizkaia", "Playa de Laga"],
  cascoViejo: [Q + "Casco+Viejo%2C+Bilbao", "Casco Viejo"],
} satisfies Record<string, Cta>;

export interface Phase {
  title: string;
  sub: string;
  next: string | null;
  at: Date | null;
  cta: Cta | null;
}

export function lagaDay(n: Date): number {
  const d0 = Date.UTC(2026, 5, 20);
  const dn = Date.parse(mDate(n) + "T00:00:00Z");
  return Math.max(1, Math.min(4, Math.floor((dn - d0) / 864e5) + 1));
}

export function phase(n: Date): Phase {
  if (n < B.depart) {
    const depDay = Date.UTC(2026, 5, 19);
    const today = Date.parse(mDate(n) + "T00:00:00Z");
    const days = Math.round((depDay - today) / 864e5);
    if (days > 0) {
      return {
        title: "Faltan " + days + (days === 1 ? " día" : " días"),
        sub: "El bus nocturno sale el viernes a las 23:00",
        next: "Sale el bus",
        at: B.depart,
        cta: CTA.bcnNord,
      };
    }
    return {
      title: "Hoy salimos",
      sub: "Bus nocturno desde Barcelona Nord, 23:00",
      next: "Sale el bus",
      at: B.depart,
      cta: CTA.bcnNord,
    };
  }
  if (n < B.arriveBilbao)
    return { title: "Rumbo al norte", sub: "En el bus nocturno hacia Bilbao", next: "Llegada a Bilbao", at: B.arriveBilbao, cta: CTA.bilbao };
  if (n < B.checkin)
    return { title: "Casi en Laga", sub: "Coge el A3513, check-in a las 14:00", next: "Check-in en Laga", at: B.checkin, cta: CTA.rutaLaga };
  if (n < B.leaveLaga)
    return { title: "En el agua", sub: "Día " + lagaDay(n) + " de 4 en Laga", next: "Salida hacia Bilbao", at: B.leaveLaga, cta: CTA.playa };
  if (n < B.returnDepart)
    return { title: "Noche de San Juan", sub: "Pintxos y hogueras en Bilbao", next: "Bus de vuelta", at: B.returnDepart, cta: CTA.cascoViejo };
  if (n < B.returnArrive)
    return { title: "De vuelta", sub: "Rumbo a Barcelona", next: "Llegada a Sants", at: B.returnArrive, cta: null };
  return { title: "Hasta la próxima", sub: "El viaje ha terminado", next: null, at: null, cta: null };
}

export type LegState = "past" | "active" | "future";
export const SL: Record<LegState, string> = { past: "Hecho", active: "Ahora", future: "Próximo" };

export function legState(start: Date, end: Date, n: Date): LegState {
  return n >= end ? "past" : n >= start ? "active" : "future";
}
