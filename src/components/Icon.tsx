import type { CSSProperties } from "react";

interface IconProps {
  name: string;
  className?: string;
  style?: CSSProperties;
}

// Mirrors the static markup: <svg class="ic"><use href="#id"/></svg>. className overrides for variants
// like "ic ar", "ic go", "ic gauge-ic", "ic pl-ic".
export function Icon({ name, className = "ic", style }: IconProps) {
  return (
    <svg className={className} style={style} aria-hidden="true" focusable="false">
      <use href={`#${name}`} />
    </svg>
  );
}
