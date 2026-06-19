import { useCallback, useEffect, useRef, useState } from "react";
import type { ForecastModel } from "../types/forecast";
import { FORECAST_SEED } from "../lib/forecastSeed";
import { fetchForecast, reviveModel } from "../lib/openMeteo";

const CACHE_KEY = "laga:forecast:v1";
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

function readCache(): ForecastModel | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return reviveModel(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeCache(model: ForecastModel): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(model));
  } catch {
    // quota / private mode — runtime state still holds the data, so just skip persisting.
  }
}

function isFresh(fetchedAt: number | null): boolean {
  if (fetchedAt == null) return false;
  const age = Date.now() - fetchedAt;
  return age >= 0 && age < MAX_AGE_MS; // negative age => clock skew => treat as stale
}

// `frozen` = a ?now= override is active: render the deterministic seed, never fetch or read cache.
// Otherwise: paint immediately from cache (or seed), then refresh from Open-Meteo on a 6h policy,
// re-checking on focus / visibility / reconnect. All trip days (20-24) come back in one fetch, so the
// strip always has data for every day regardless of which is "today".
export function useForecast(frozen: boolean): ForecastModel {
  const [model, setModel] = useState<ForecastModel>(() => (frozen ? FORECAST_SEED : readCache() ?? FORECAST_SEED));
  const inFlight = useRef(false);

  const refresh = useCallback(
    async (force: boolean) => {
      if (frozen || inFlight.current) return;
      const cached = readCache();
      if (!force && cached && isFresh(cached.fetchedAt)) return; // still fresh — no network
      inFlight.current = true;
      try {
        const live = await fetchForecast();
        writeCache(live);
        setModel(live);
      } catch {
        // Offline / API down / timeout: keep whatever we have (cache or seed). Never surface an error.
      } finally {
        inFlight.current = false;
      }
    },
    [frozen],
  );

  useEffect(() => {
    if (frozen) return;
    void refresh(false);
    const id = window.setInterval(() => void refresh(false), MAX_AGE_MS);
    const onFocus = () => void refresh(false);
    const onVisibility = () => {
      if (!document.hidden) void refresh(false);
    };
    const onOnline = () => void refresh(true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [frozen, refresh]);

  return model;
}
