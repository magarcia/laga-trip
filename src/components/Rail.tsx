import { Icon } from "./Icon";
import { NavButtons } from "./NavButtons";
import { RailStatus } from "./RailStatus";
import { handleNavKey, type NavProps } from "./nav";

export function Rail({ tab, onSelect }: NavProps) {
  return (
    <nav className="rail" aria-label="Secciones" onKeyDown={(e) => handleNavKey(e, onSelect)}>
      <div className="brand">
        <Icon name="i-waves" />
        Laga
      </div>
      <NavButtons tab={tab} onSelect={onSelect} btnClass="navbtn" />
      <RailStatus />
    </nav>
  );
}
