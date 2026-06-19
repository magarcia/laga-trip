import { useNowValue } from "../../contexts";
import { B } from "../../lib/timeline";
import { delta } from "../../lib/time";
import { Icon } from "../Icon";

// "Sal ya" amber alert window. One buffer for all stops — walk times differ a bit,
// but ~45 min is a safe heads-up margin to start moving towards any of them.
const LEAVE_BUFFER_MS = 45 * 60 * 1000;

interface Departure {
  at: Date;
  label: string;
  from: string;
}

// The three FIXED departures of the trip, in order. Arrivals/check-ins are not departures.
const DEPARTURES: readonly Departure[] = [
  { at: B.depart, label: "Bus nocturno", from: "Barcelona Nord" },
  { at: B.leaveLaga, label: "A3513", from: "Laga" },
  { at: B.returnDepart, label: "Bus de vuelta", from: "Bilbao" },
] as const;

// Next departure strictly ahead of `now`, or null once the last one has passed (post-trip).
function nextDeparture(now: Date): Departure | null {
  return DEPARTURES.find((d) => d.at.getTime() > now.getTime()) ?? null;
}

export function NextDeparture() {
  const now = useNowValue();
  const dep = nextDeparture(now);
  if (!dep) return null;

  const msLeft = dep.at.getTime() - now.getTime();
  const urgent = msLeft <= LEAVE_BUFFER_MS;

  return (
    <div className={urgent ? "next-dep urgent" : "next-dep"}>
      <div className="next-dep-ic">
        <Icon name="i-bus" />
      </div>
      <div className="next-dep-body">
        <div className="next-dep-label">
          {urgent ? "Sal ya" : "Próxima salida"}
          <span className="next-dep-from">{dep.label} · {dep.from}</span>
        </div>
        <div className="next-dep-count">
          <Icon name="i-clock" />
          <span className="mono">{delta(msLeft)}</span>
        </div>
      </div>
    </div>
  );
}
