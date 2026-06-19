import { NavButtons } from "./NavButtons";
import { handleNavKey, type NavProps } from "./nav";

export function TabBar({ tab, onSelect }: NavProps) {
  return (
    <nav className="tabbar" aria-label="Secciones" onKeyDown={(e) => handleNavKey(e, onSelect)}>
      <NavButtons tab={tab} onSelect={onSelect} btnClass="tabbtn" />
    </nav>
  );
}
