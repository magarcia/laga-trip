import { useNowValue } from "../contexts";
import { phase } from "../lib/timeline";
import { delta } from "../lib/time";
import { Icon } from "./Icon";

export function RailStatus() {
  const now = useNowValue();
  const ph = phase(now);
  return (
    <div className="rail-status">
      <div className="rs-k">Ahora</div>
      <div className="rs-v">{ph.title}</div>
      <div className="rs-c">
        {ph.at && ph.next ? (
          <>
            <Icon name="i-clock" /> {delta(ph.at.getTime() - now.getTime())}
          </>
        ) : null}
      </div>
    </div>
  );
}
