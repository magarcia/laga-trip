import { describe, expect, it } from "vitest";
import { FORECAST_SEED } from "./forecastSeed";
import { circularMeanDeg, compassEs, mergeForecast, reviveModel, SHORE_NORMAL_DEG, windCleanliness } from "./openMeteo";
import type { ForecastModel } from "../types/forecast";

// Compare the data payload of a model against the seed, ignoring the provenance fields (source/fetchedAt)
// which legitimately change between seed/live/cache. The fixed-shape contract is about the VALUES.
function expectDataMatchesSeed(model: ForecastModel) {
  const { source: _s, fetchedAt: _f, ...data } = model;
  const { source: _ss, fetchedAt: _ff, ...seedData } = FORECAST_SEED;
  expect(data).toEqual(seedData);
}

describe("circularMeanDeg — compass average across the 0/360 wrap", () => {
  it("averages to 0 not 180 when directions straddle north", () => {
    expect(Math.round(circularMeanDeg([350, 10]))).toBe(0);
  });
  it("returns a plain mean away from the wrap", () => {
    expect(Math.round(circularMeanDeg([90, 110]))).toBe(100);
  });
  it("stays within [0, 360)", () => {
    const v = circularMeanDeg([359, 1, 2]);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(360);
  });
});

describe("mergeForecast — does not throw on malformed Portus data", () => {
  it("degrades water temp to seed when a Portus record is null", () => {
    const model = mergeForecast(null, null, { data: [null, { fecha: 5 }] });
    expect(model.conditions.waterText).toBe(FORECAST_SEED.conditions.waterText);
    expect(model.conditions.waterSource).toBe("seed");
  });
});

describe("mergeForecast — parity oracle (fixed-shape contract)", () => {
  it("deep-equals the seed data when live inputs are null", () => {
    const model = mergeForecast(null, null);
    expectDataMatchesSeed(model);
  });

  it("deep-equals the seed data when live inputs are empty objects", () => {
    const model = mergeForecast({ daily: {}, hourly: {} }, { daily: {}, hourly: {} });
    expectDataMatchesSeed(model);
  });

  it("deep-equals the seed data when daily/hourly arrays are present but empty", () => {
    const empty = { daily: { time: [] }, hourly: { time: [] } };
    const model = mergeForecast(empty, empty);
    expectDataMatchesSeed(model);
  });

  it("tags a freshly merged model as 'live' with a numeric fetchedAt", () => {
    const before = Date.now();
    const model = mergeForecast(null, null);
    expect(model.source).toBe("live");
    expect(model.fetchedAt).toBeGreaterThanOrEqual(before);
  });

  it("keeps the seed water range and 'seed' source when no portus argument is given", () => {
    const model = mergeForecast(null, null);
    expect(model.conditions.waterText).toBe(FORECAST_SEED.conditions.waterText);
    expect(model.conditions.waterSource).toBe("seed");
  });

  it("replaces only the targeted value inside the fixed shape, keeping every other field on the seed", () => {
    // A single live daily field for one date: temperature_2m_max on the 21st.
    const weather = {
      daily: { time: ["2026-06-21"], temperature_2m_max: [27] },
      hourly: {},
    };
    const model = mergeForecast(weather, null);
    const day21 = model.days.find((d) => d.date === "2026-06-21");
    expect(day21?.tMax).toBe(27); // replaced
    expect(day21?.tMin).toBe(FORECAST_SEED.days[1].tMin); // untouched -> seed
    // Other days fully on the seed.
    expect(model.days[0].tMax).toBe(FORECAST_SEED.days[0].tMax);
    // Shape preserved: same number of days/waves/hourly.
    expect(model.days).toHaveLength(FORECAST_SEED.days.length);
    expect(model.waves).toHaveLength(FORECAST_SEED.waves.length);
    expect(model.hourly).toHaveLength(FORECAST_SEED.hourly.length);
  });

  it("derives windText through the private windClass via the daily wind mean", () => {
    // All days windy enough to mean >= 38 km/h -> "Fuerte"; the seed is "Flojo".
    const dates = FORECAST_SEED.days.map((d) => d.date);
    const weather = {
      daily: { time: dates, wind_speed_10m_max: dates.map(() => 40) },
      hourly: {},
    };
    const model = mergeForecast(weather, null);
    expect(model.conditions.windText).toBe("Fuerte");
  });

  it("does not flip windText to a stronger class when only one day is breezy (uses the mean)", () => {
    const dates = FORECAST_SEED.days.map((d) => d.date);
    // One day at 50, the rest calm: mean stays in the "Flojo" band (<20).
    const speeds = dates.map((_, i) => (i === 0 ? 50 : 1));
    const weather = { daily: { time: dates, wind_speed_10m_max: speeds }, hourly: {} };
    const model = mergeForecast(weather, null);
    expect(model.conditions.windText).toBe("Flojo");
  });
});

describe("mergeForecast — portus water source", () => {
  it("falls back to the seed water range when portus yields nothing for the window", () => {
    const model = mergeForecast(null, null, {});
    expect(model.conditions.waterText).toBe(FORECAST_SEED.conditions.waterText);
    expect(model.conditions.waterSource).toBe("seed");
  });

  it("uses the portus reading nearest midday for an in-window date", () => {
    const portus = {
      data: [
        { fecha: "2026-06-20 12:00", datos: [{ variableParametro: "TEMP. AGUA", valor: "19.5" }] },
      ],
    };
    const model = mergeForecast(null, null, portus);
    expect(model.conditions.waterText).toBe("20"); // rounded single value
    expect(model.conditions.waterSource).toBe("portus");
  });
});

describe("compassEs", () => {
  it("maps the cardinal degrees to Spanish abbreviations (O for Oeste)", () => {
    expect(compassEs(0)).toBe("N");
    expect(compassEs(90)).toBe("E");
    expect(compassEs(180)).toBe("S");
    expect(compassEs(270)).toBe("O");
  });

  it("rounds to the nearest of 16 sectors", () => {
    expect(compassEs(45)).toBe("NE");
    expect(compassEs(315)).toBe("NO");
  });

  it("normalizes degrees outside [0,360) and wraps 360 to N", () => {
    expect(compassEs(360)).toBe("N");
    expect(compassEs(-90)).toBe("O");
    expect(compassEs(450)).toBe("E");
  });
});

describe("windCleanliness — relative to the Laga shore-normal (337°)", () => {
  it("classifies the shore-normal itself as onshore (wind from the sea flattens the wave)", () => {
    expect(windCleanliness(SHORE_NORMAL_DEG)).toBe("onshore");
  });

  it("classifies wind from the land (offshore sector ~157°) as offshore", () => {
    expect(windCleanliness(157)).toBe("offshore");
    expect(windCleanliness(115)).toBe("offshore"); // lower edge
    expect(windCleanliness(199)).toBe("offshore"); // upper edge
  });

  it("treats the onshore sector as wrapping through 0 (295°..19°)", () => {
    expect(windCleanliness(295)).toBe("onshore"); // lower edge
    expect(windCleanliness(0)).toBe("onshore"); // wraps through north
    expect(windCleanliness(19)).toBe("onshore"); // upper edge
  });

  it("classifies in-between sectors as cross", () => {
    expect(windCleanliness(90)).toBe("cross");
    expect(windCleanliness(250)).toBe("cross");
  });

  it("normalizes out-of-range degrees before classifying", () => {
    expect(windCleanliness(360 + 157)).toBe("offshore");
    expect(windCleanliness(-360 + 90)).toBe("cross");
  });
});

describe("reviveModel — untrusted cache revival", () => {
  it("returns null for non-object input", () => {
    expect(reviveModel(null)).toBeNull();
    expect(reviveModel("nope")).toBeNull();
  });

  it("rejects a cache whose days array length or dates do not match the seed", () => {
    expect(reviveModel({ days: [], waves: FORECAST_SEED.waves })).toBeNull();
    const shifted = FORECAST_SEED.days.map((d) => ({ ...d, date: "1999-01-01" }));
    expect(reviveModel({ days: shifted, waves: FORECAST_SEED.waves })).toBeNull();
  });

  it("degrades a structurally valid but empty cache to seed values, tagged 'cache'", () => {
    const raw = {
      days: FORECAST_SEED.days.map((d) => ({ date: d.date })),
      waves: FORECAST_SEED.waves.map((w) => ({ date: w.date })),
      fetchedAt: 12345,
    };
    const model = reviveModel(raw);
    expect(model).not.toBeNull();
    expect(model?.source).toBe("cache");
    expect(model?.fetchedAt).toBe(12345);
    expect(model?.days[0].tMax).toBe(FORECAST_SEED.days[0].tMax);
    expect(model?.conditions.waterText).toBe(FORECAST_SEED.conditions.waterText);
  });
});
