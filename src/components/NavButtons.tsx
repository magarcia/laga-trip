import { Icon } from "./Icon";
import { TABS, type NavProps } from "./nav";

export function NavButtons({ tab, onSelect, btnClass }: NavProps & { btnClass: string }) {
  return (
    <>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={btnClass}
          data-tab={t.id}
          aria-current={tab === t.id ? "page" : undefined}
          tabIndex={tab === t.id ? 0 : -1}
          onClick={() => onSelect(t.id)}
        >
          <Icon name={t.icon} />
          {t.label}
        </button>
      ))}
    </>
  );
}
