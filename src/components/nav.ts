import type { KeyboardEvent } from "react";

export type TabId = "hoy" | "ruta" | "surf" | "despensa" | "mapa";

export interface TabDef {
  id: TabId;
  icon: string;
  label: string;
}

export const TABS: readonly TabDef[] = [
  { id: "hoy", icon: "i-sun", label: "Hoy" },
  { id: "ruta", icon: "i-compass", label: "Ruta" },
  { id: "surf", icon: "i-waves", label: "Surf" },
  { id: "despensa", icon: "i-basket", label: "Despensa" },
  { id: "mapa", icon: "i-pin", label: "Mapa" },
];

export interface NavProps {
  tab: TabId;
  onSelect: (t: TabId) => void;
}

// Roving-tabindex arrow-key nav, ported from the original setupArrowNav. Attached to the <nav> element;
// queries its [data-tab] buttons and moves focus + selection.
export function handleNavKey(e: KeyboardEvent<HTMLElement>, onSelect: (t: TabId) => void): void {
  const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-tab]"));
  const i = btns.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0) return;
  let to = -1;
  switch (e.key) {
    case "ArrowRight":
    case "ArrowDown":
      to = (i + 1) % btns.length;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      to = (i - 1 + btns.length) % btns.length;
      break;
    case "Home":
      to = 0;
      break;
    case "End":
      to = btns.length - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  btns[to].focus();
  onSelect(btns[to].getAttribute("data-tab") as TabId);
}
