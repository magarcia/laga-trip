import { Icon } from "../Icon";

interface Place {
  href: string;
  icon: string;
  name: string;
  sub: string;
}

const PLACES: Place[] = [
  {
    href: "https://www.google.com/maps/search/?api=1&query=Laga+Surf+Camp+Hostel%2C+Elexalde+Auzoa+11%2C+48311+Elexalde",
    icon: "i-bed",
    name: "Hostel",
    sub: "Laga Surf Camp · Elexalde Auzoa 11, Ibarrangelu",
  },
  {
    href: "https://www.google.com/maps/search/?api=1&query=Playa+de+Laga%2C+Ibarrangelu%2C+Bizkaia",
    icon: "i-waves",
    name: "Playa de Laga",
    sub: "Ibarrangelu · la playa de surf",
  },
  {
    href: "https://www.google.com/maps/search/?api=1&query=Bilbao+Intermodal%2C+Gurtubay+Kalea+1%2C+48013+Bilbao",
    icon: "i-bus",
    name: "Bus Bilbao",
    sub: "Intermodal · Gurtubay Kalea 1 · A3513",
  },
  {
    href: "https://www.google.com/maps/search/?api=1&query=Mercadona+Gernika%2C+Arana+Auzoa+7%2C+48300+Gernika-Lumo",
    icon: "i-basket",
    name: "Súper Gernika",
    sub: "Mercadona · Arana Auzoa 7 · a la ida",
  },
  {
    href: "https://www.google.com/maps/search/?api=1&query=Eroski+Lekeitio%2C+Sabino+Arana+10-12%2C+48280+Lekeitio",
    icon: "i-basket",
    name: "Súper Lekeitio",
    sub: "Eroski · Sabino Arana 10-12 · ~27 min",
  },
  {
    href: "https://www.google.com/maps/search/?api=1&query=Elantxobe%2C+Bizkaia",
    icon: "i-utensils",
    name: "Elantxobe",
    sub: "pueblo pesquero ~1,4 km · bares",
  },
];

const NEAR: { href: string; icon: string; label: string }[] = [
  { href: "https://www.google.com/maps/search/supermercado/@43.4099,-2.6306,13z", icon: "i-basket", label: "Supermercado" },
  { href: "https://www.google.com/maps/search/farmacia/@43.4099,-2.6306,13z", icon: "i-drop", label: "Farmacia" },
  { href: "https://www.google.com/maps/search/restaurante/@43.4099,-2.6306,13z", icon: "i-utensils", label: "Restaurante" },
  { href: "https://www.google.com/maps/search/cajero/@43.4099,-2.6306,13z", icon: "i-wallet", label: "Cajero" },
];

export function MapaView({ active }: { active: boolean }) {
  return (
    <section className={active ? "view active" : "view"} id="view-mapa" aria-label="Mapa">
      <div className="pad">
        <h2 className="section-h">Sobre el terreno</h2>
        <p className="section-sub">Sitios clave y búsquedas rápidas alrededor de Laga. Cada tarjeta abre Google Maps.</p>

        <div className="places" style={{ marginBottom: 16 }}>
          {PLACES.map((p) => (
            <a key={p.name} className="place" target="_blank" rel="noopener" href={p.href}>
              <Icon name="i-ext" className="ic go" />
              <Icon name={p.icon} className="ic pl-ic" />
              <span className="pl-n">{p.name}</span>
              <span className="pl-s">{p.sub}</span>
            </a>
          ))}
        </div>

        <h3 style={{ fontSize: "1.05rem", margin: "0 0 9px" }}>Buscar cerca</h3>
        <div className="nearrow">
          {NEAR.map((n) => (
            <a key={n.label} className="nearchip" target="_blank" rel="noopener" href={n.href}>
              <Icon name={n.icon} />
              {n.label}
            </a>
          ))}
        </div>

        <div className="note" style={{ marginTop: 14 }}>
          <Icon name="i-info" /> Tienda del camp a ~5 min (stock incierto). El bus pasa cada 2 h: una compra grande se come
          medio día, mejor cargar desde Bilbao.
        </div>
      </div>
    </section>
  );
}
