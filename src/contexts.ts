import { createContext, useContext } from "react";
import type { ForecastModel } from "./types/forecast";
import { FORECAST_SEED } from "./lib/forecastSeed";

// Single sources of truth for the tree: the shared clock and the forecast model.
export const NowContext = createContext<Date>(new Date(0));
export const ForecastContext = createContext<ForecastModel>(FORECAST_SEED);

export function useNowValue(): Date {
  return useContext(NowContext);
}
export function useForecastModel(): ForecastModel {
  return useContext(ForecastContext);
}
