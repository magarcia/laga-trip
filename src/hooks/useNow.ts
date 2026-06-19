import { useEffect, useState } from "react";
import { mDate, madridMinutes } from "../lib/time";

// Minute-level signature: the UI only changes at minute granularity (countdown, leg states, highlights),
// so we avoid re-rendering on the sub-minute ticks.
function minuteSig(d: Date): string {
  return mDate(d) + "|" + madridMinutes(d);
}

// One clock for the whole tree. A ?now= override freezes it (no tick) so previews stay deterministic.
export function useNow(override: Date | null): Date {
  const [now, setNow] = useState<Date>(() => override ?? new Date());

  useEffect(() => {
    if (override) return; // frozen preview — never tick
    let lastSig = minuteSig(new Date());
    const tick = () => {
      const d = new Date();
      const sig = minuteSig(d);
      if (sig !== lastSig) {
        lastSig = sig;
        setNow(d);
      }
    };
    const id = window.setInterval(tick, 30000);
    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", tick);
    };
  }, [override]);

  return now;
}
