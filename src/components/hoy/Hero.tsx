import { useEffect, useState } from "react";
import { useNowValue } from "../../contexts";
import { phase } from "../../lib/timeline";
import { delta } from "../../lib/time";
import { Icon } from "../Icon";

export function Hero() {
  const now = useNowValue();
  const ph = phase(now);
  // .boot plays the intro once; drop it after 1200ms so re-renders don't replay it.
  const [boot, setBoot] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setBoot(false), 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <header className={boot ? "hero boot" : "hero"}>
      <div className="hoy-bg" aria-hidden="true">
        <div className="hero-media">
          <img src="/img/surf-hero.jpg" alt="" fetchPriority="high" />
        </div>
        <div className="hero-grain" />
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-inner">
        <span className="eyebrow">
          <Icon name="i-pin" /> Urdaibai · País Vasco
        </span>
        <h1>{ph.title}</h1>
        <p className="h-sub">{ph.sub}</p>
        <div className="cd">
          <Icon name="i-clock" />
          <span>
            {ph.at && ph.next ? (
              <>
                <b>{ph.next}</b> · <span className="mono">{delta(ph.at.getTime() - now.getTime())}</span>
              </>
            ) : (
              "Hasta el próximo viaje"
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
