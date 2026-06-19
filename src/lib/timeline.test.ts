import { describe, expect, it } from "vitest";
import { B, lagaDay, legState, phase } from "./timeline";

// All instants are frozen UTC. June in Madrid is CEST (+02:00). The boundaries in B carry an explicit
// +02:00, so e.g. B.depart (2026-06-19T23:00+02:00) is 2026-06-19T21:00Z. We probe each boundary
// just-before / at / just-after, since phase() uses strict "<" comparisons (at the boundary belongs to
// the next phase).

const justBefore = (d: Date) => new Date(d.getTime() - 1);
const justAfter = (d: Date) => new Date(d.getTime() + 1);

describe("phase", () => {
  it("counts down the days before departure using Madrid calendar days", () => {
    // 2026-06-17T12:00Z is the 17th in Madrid; depart day is the 19th -> 2 days out.
    const p = phase(new Date("2026-06-17T12:00:00Z"));
    expect(p.title).toBe("Faltan 2 días");
    expect(p.next).toBe("Sale el bus");
  });

  it("uses the singular 'día' when exactly one day remains", () => {
    const p = phase(new Date("2026-06-18T12:00:00Z"));
    expect(p.title).toBe("Faltan 1 día");
  });

  it("says 'Hoy salimos' on departure day before the bus leaves", () => {
    // 2026-06-19T12:00Z is the 19th in Madrid, still before B.depart (21:00Z).
    const p = phase(new Date("2026-06-19T12:00:00Z"));
    expect(p.title).toBe("Hoy salimos");
    expect(p.at).toEqual(B.depart);
  });

  it("is still pre-departure one millisecond before the bus leaves", () => {
    expect(phase(justBefore(B.depart)).title).toBe("Hoy salimos");
  });

  it("flips to 'Rumbo al norte' at the exact departure instant", () => {
    expect(phase(B.depart).title).toBe("Rumbo al norte");
    expect(phase(justAfter(B.depart)).title).toBe("Rumbo al norte");
  });

  it("flips to 'Casi en Laga' at the Bilbao arrival instant", () => {
    expect(phase(justBefore(B.arriveBilbao)).title).toBe("Rumbo al norte");
    expect(phase(B.arriveBilbao).title).toBe("Casi en Laga");
  });

  it("flips to 'En el agua' at check-in and reports the Laga day", () => {
    expect(phase(justBefore(B.checkin)).title).toBe("Casi en Laga");
    const p = phase(B.checkin);
    expect(p.title).toBe("En el agua");
    expect(p.sub).toBe("Día 1 de 4 en Laga");
  });

  it("flips to 'Noche de San Juan' when leaving Laga", () => {
    expect(phase(justBefore(B.leaveLaga)).title).toBe("En el agua");
    expect(phase(B.leaveLaga).title).toBe("Noche de San Juan");
  });

  it("flips to 'De vuelta' at the return departure and drops the cta", () => {
    expect(phase(justBefore(B.returnDepart)).title).toBe("Noche de San Juan");
    const p = phase(B.returnDepart);
    expect(p.title).toBe("De vuelta");
    expect(p.cta).toBeNull();
  });

  it("ends with 'Hasta la próxima' at and after the final arrival", () => {
    expect(phase(justBefore(B.returnArrive)).title).toBe("De vuelta");
    const p = phase(B.returnArrive);
    expect(p.title).toBe("Hasta la próxima");
    expect(p.next).toBeNull();
    expect(p.at).toBeNull();
    expect(p.cta).toBeNull();
  });
});

describe("legState", () => {
  const start = new Date("2026-06-21T08:00:00Z");
  const end = new Date("2026-06-21T10:00:00Z");

  it("is future strictly before the start", () => {
    expect(legState(start, end, justBefore(start))).toBe("future");
  });

  it("is active at the start instant", () => {
    expect(legState(start, end, start)).toBe("active");
  });

  it("is active between start and end", () => {
    expect(legState(start, end, new Date("2026-06-21T09:00:00Z"))).toBe("active");
  });

  it("is past at the end instant (end is exclusive of active)", () => {
    expect(legState(start, end, end)).toBe("past");
  });

  it("is past after the end", () => {
    expect(legState(start, end, justAfter(end))).toBe("past");
  });
});

describe("lagaDay", () => {
  it("returns day 1 on the check-in day (Jun 20 Madrid)", () => {
    expect(lagaDay(new Date("2026-06-20T12:00:00Z"))).toBe(1);
  });

  it("increments one per Madrid calendar day", () => {
    expect(lagaDay(new Date("2026-06-21T12:00:00Z"))).toBe(2);
    expect(lagaDay(new Date("2026-06-22T12:00:00Z"))).toBe(3);
    expect(lagaDay(new Date("2026-06-23T12:00:00Z"))).toBe(4);
  });

  it("clamps Jun 24 to day 4 (the upper bound)", () => {
    expect(lagaDay(new Date("2026-06-24T12:00:00Z"))).toBe(4);
  });

  it("clamps dates before the trip to day 1 (the lower bound)", () => {
    expect(lagaDay(new Date("2026-06-15T12:00:00Z"))).toBe(1);
  });

  it("clamps far-future dates to day 4", () => {
    expect(lagaDay(new Date("2026-07-01T12:00:00Z"))).toBe(4);
  });

  it("uses the Madrid calendar day, not UTC, near midnight", () => {
    // 2026-06-20T22:30Z is already the 21st in Madrid -> day 2, not day 1.
    expect(lagaDay(new Date("2026-06-20T22:30:00Z"))).toBe(2);
  });
});
