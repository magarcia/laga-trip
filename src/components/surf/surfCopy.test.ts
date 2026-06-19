import { describe, expect, it } from "vitest";
import { cleanlinessLabel, meMetoVerdict } from "./surfCopy";

// Thresholds under test (from surfCopy.ts):
//   good:  wave <= 1.2 m AND wind < 20 km/h
//   care:  wave <= 1.5 m AND (wind < 30 km/h OR offshore)
//   watch: anything bigger / blown out

describe("meMetoVerdict", () => {
  it("says 'Buen día para entrar' for a small, light-wind day", () => {
    expect(meMetoVerdict(0.7, 10, "offshore").verdict).toBe("good");
    expect(meMetoVerdict(0.7, 10, "offshore").title).toBe("Buen día para entrar");
  });

  it("treats the good wave ceiling (exactly 1.2 m) as still good when wind is light", () => {
    expect(meMetoVerdict(1.2, 19, "cross").verdict).toBe("good");
  });

  it("steps down to 'care' the moment wind reaches the good ceiling (20 km/h)", () => {
    // wind 20 is no longer < 20 -> not good; wave 1.2 <= 1.5 and wind < 30 -> care.
    const r = meMetoVerdict(1.2, 20, "cross");
    expect(r.verdict).toBe("care");
    expect(r.title).toBe("Con cuidado");
  });

  it("steps down to 'care' the moment wave exceeds the good ceiling", () => {
    expect(meMetoVerdict(1.3, 10, "cross").verdict).toBe("care");
  });

  it("treats the care wave ceiling (exactly 1.5 m) with moderate wind as care", () => {
    expect(meMetoVerdict(1.5, 29, "cross").verdict).toBe("care");
  });

  it("rescues a strong-wind borderline day to 'care' when the wind is offshore", () => {
    // wind 30 is not < 30, but offshore grooms it: wave 1.5 <= 1.5 -> care, not watch.
    expect(meMetoVerdict(1.5, 30, "offshore").verdict).toBe("care");
  });

  it("drops to 'watch' for a strong cross/onshore wind even at a surfable wave height", () => {
    // wave 1.5 <= 1.5 but wind 30 not < 30 and not offshore -> watch.
    const r = meMetoVerdict(1.5, 30, "onshore");
    expect(r.verdict).toBe("watch");
    expect(r.title).toBe("Hoy, mejor mirar");
  });

  it("drops to 'watch' once the wave exceeds the care ceiling, regardless of wind", () => {
    expect(meMetoVerdict(1.6, 5, "offshore").verdict).toBe("watch");
  });

  it("describes the conditions with Spanish decimal comma and a wind word", () => {
    expect(meMetoVerdict(0.7, 10, "offshore").why).toBe("0,7 m · viento flojo offshore");
    expect(meMetoVerdict(1.4, 25, "onshore").why).toBe("1,4 m · viento moderado onshore");
    expect(meMetoVerdict(2.0, 40, "cross").why).toBe("2,0 m · viento fuerte lateral");
  });
});

describe("cleanlinessLabel", () => {
  it("labels each wind cleanliness in plain Spanish", () => {
    expect(cleanlinessLabel("offshore")).toBe("Offshore (limpio)");
    expect(cleanlinessLabel("onshore")).toBe("Onshore (movido)");
    expect(cleanlinessLabel("cross")).toBe("Lateral");
  });
});
