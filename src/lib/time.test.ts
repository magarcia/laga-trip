import { describe, expect, it } from "vitest";
import { delta, madridClock, madridMinutes, mDate, parseNowParam } from "./time";

// A note on the offset cases: a real "?now=2026-06-21T12:00:00+02:00" arrives at the app with the "+"
// already decoded to a space by URLSearchParams. We feed parseNowParam the raw query string, so cases
// that want a literal "+" must encode it as "%2B" (a real URL) and cases with a space mimic the decoded
// form. June is CEST (+02:00), so Madrid wall time is two hours ahead of UTC.

describe("parseNowParam", () => {
  it("returns null for impossible calendar dates instead of rolling them over", () => {
    expect(parseNowParam("?now=2026-02-31")).toBeNull();
    expect(parseNowParam("?now=2026-13-01")).toBeNull();
    expect(parseNowParam("?now=2026-02-31T12:00:00%2B02:00")).toBeNull();
  });
  it("returns null when the now param is absent", () => {
    expect(parseNowParam("")).toBeNull();
    expect(parseNowParam("?other=1")).toBeNull();
  });

  it("parses a canonical encoded offset (%2B -> +) to the right UTC instant", () => {
    const d = parseNowParam("?now=2026-06-21T12:00:00%2B02:00");
    expect(d?.toISOString()).toBe("2026-06-21T10:00:00.000Z");
  });

  it("treats a space-decoded trailing offset with seconds as the offset, not wall time", () => {
    // "2026-06-21T12:00:00 02:00" is what "...T12:00:00+02:00" decodes to.
    const d = parseNowParam("?now=2026-06-21T12:00:00 02:00");
    expect(d?.toISOString()).toBe("2026-06-21T10:00:00.000Z");
  });

  it("parses a space-separated date and time with a space-decoded offset", () => {
    const d = parseNowParam("?now=2026-06-21 12:00:00 02:00");
    expect(d?.toISOString()).toBe("2026-06-21T10:00:00.000Z");
  });

  it("forces Madrid CEST for a bare datetime with no offset", () => {
    const d = parseNowParam("?now=2026-06-21T12:00:00");
    expect(d?.toISOString()).toBe("2026-06-21T10:00:00.000Z");
  });

  it("forces Madrid CEST for minute-precision wall time (no seconds, no offset)", () => {
    const d = parseNowParam("?now=2026-06-21 12:00");
    expect(d?.toISOString()).toBe("2026-06-21T10:00:00.000Z");
  });

  it("treats a date-only input as that day at Madrid midnight", () => {
    // Madrid midnight on the 21st is 22:00Z on the 20th in June.
    const d = parseNowParam("?now=2026-06-21");
    expect(d?.toISOString()).toBe("2026-06-20T22:00:00.000Z");
  });

  it("honours an explicit Z (UTC) suffix instead of forcing Madrid", () => {
    const d = parseNowParam("?now=2026-06-21T12:00:00Z");
    expect(d?.toISOString()).toBe("2026-06-21T12:00:00.000Z");
  });

  it("honours a negative explicit offset instead of forcing Madrid", () => {
    const d = parseNowParam("?now=2026-06-21T12:00:00-05:00");
    expect(d?.toISOString()).toBe("2026-06-21T17:00:00.000Z");
  });

  it("returns null for a structurally valid but out-of-range date", () => {
    expect(parseNowParam("?now=2026-13-99")).toBeNull();
  });

  it("returns null for non-date garbage", () => {
    expect(parseNowParam("?now=hello")).toBeNull();
    expect(parseNowParam("?now=2026/06/21")).toBeNull();
  });
});

describe("madridMinutes", () => {
  it("returns minutes-from-midnight in Madrid wall time, device-tz independent", () => {
    // 10:00Z in June is 12:00 in Madrid -> 12*60 = 720.
    expect(madridMinutes(new Date("2026-06-21T10:00:00Z"))).toBe(720);
  });

  it("returns 0 at Madrid midnight", () => {
    expect(madridMinutes(new Date("2026-06-20T22:00:00Z"))).toBe(0);
  });

  it("rolls the wall clock across the UTC day boundary correctly", () => {
    // 23:30Z is 01:30 the next day in Madrid -> 90.
    expect(madridMinutes(new Date("2026-06-20T23:30:00Z"))).toBe(90);
  });
});

describe("mDate", () => {
  it("returns the Madrid calendar date, which can differ from the UTC date", () => {
    // 22:30Z on the 20th is already the 21st in Madrid.
    expect(mDate(new Date("2026-06-20T22:30:00Z"))).toBe("2026-06-21");
  });

  it("returns the same date when the instant is mid-day in both zones", () => {
    expect(mDate(new Date("2026-06-21T10:00:00Z"))).toBe("2026-06-21");
  });
});

describe("delta", () => {
  it("formats days, hours and minutes with no leading zero units", () => {
    const ms = (2 * 1440 + 3 * 60 + 5) * 60_000;
    expect(delta(ms)).toBe("2d 3h 5min");
  });

  it("omits the day unit but keeps hours once any hour is present", () => {
    expect(delta((3 * 60 + 5) * 60_000)).toBe("3h 5min");
  });

  it("shows only minutes under an hour", () => {
    expect(delta(5 * 60_000)).toBe("5min");
  });

  it("clamps negative durations to 0min", () => {
    expect(delta(-1000)).toBe("0min");
  });
});

describe("madridClock", () => {
  it("formats the instant in Madrid time and Spanish locale", () => {
    const s = madridClock(new Date("2026-06-21T10:00:00Z"));
    // 12:00 Madrid on a Sunday in June; exact punctuation is locale-dependent, so assert the pieces.
    expect(s).toMatch(/12:00/);
    expect(s).toMatch(/jun/);
  });
});
