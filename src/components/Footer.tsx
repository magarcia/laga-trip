import { useNowValue } from "../contexts";
import { madridClock } from "../lib/time";

export function Footer() {
  const now = useNowValue();
  return (
    <footer>
      Hecho para el viaje · funciona sin conexión
      <br />
      <span className="mono">{madridClock(now)}</span>
    </footer>
  );
}
