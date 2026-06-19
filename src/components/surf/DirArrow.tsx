import { Icon } from "../Icon";

// A direction arrow. `fromDeg` is the meteorological FROM-direction (degrees). The base glyph points up
// (toward 0°/N = "coming from the south, travelling north"). Wind/swell FROM `fromDeg` travels toward
// `fromDeg + 180`, so we rotate the travel-direction arrow by that angle: the arrowhead points the way
// the flow is going, which is the intuitive reading on a map.
export function DirArrow({ fromDeg, title }: { fromDeg: number; title?: string }) {
  const travelDeg = (fromDeg + 180) % 360;
  return (
    <span
      className="dir-arrow"
      style={{ transform: `rotate(${travelDeg}deg)` }}
      role="img"
      aria-label={title}
      title={title}
    >
      <Icon name="i-arrow-up" />
    </span>
  );
}
