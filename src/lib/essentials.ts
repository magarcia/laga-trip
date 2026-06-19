// Static, offline-safe emergency + essentials data for the Mapa view.
// No PII: addresses are wanted, but no names, booking codes or locators.
// `tel:` links work with no network; `maps` links degrade to plain text offline.

export interface Essential {
  /** Lucide symbol id from Sprite.tsx. */
  icon: string;
  /** Short title. */
  name: string;
  /** Address / detail line, useful as plain text when offline. */
  sub: string;
  /** Optional clickable action: a `tel:` or Google Maps link. */
  href?: string;
  /** Label for the action chip when `href` is present. */
  action?: string;
}

// SOS / primeros auxilios. 112 es el número único de emergencias en toda la UE.
export const EMERGENCY: Essential[] = [
  {
    icon: "i-phone",
    name: "112 · Emergencias",
    sub: "Número único UE · ambulancia, bomberos, policía",
    href: "tel:112",
    action: "Llamar 112",
  },
  {
    icon: "i-triangle-alert",
    name: "Cruz Roja",
    sub: "Ayuda y primeros auxilios · 900 365 145",
    href: "tel:900365145",
    action: "Llamar",
  },
];

// Salud cercana. Si no hay dirección exacta verificable, va localidad + búsqueda en Maps.
export const HEALTH: Essential[] = [
  {
    icon: "i-drop",
    name: "Consultorio Ibarrangelu",
    sub: "Atención primaria en el pueblo · llamar al centro de Gernika para citas",
    href: "https://www.google.com/maps/search/?api=1&query=Consultorio+Ibarrangelu%2C+Bizkaia",
    action: "Maps",
  },
  {
    icon: "i-drop",
    name: "Centro de Salud Gernika",
    sub: "Luis Urrengoetxea 5, 48300 Gernika-Lumo · urgencias de la comarca",
    href: "https://www.google.com/maps/search/?api=1&query=Centro+de+Salud+Gernika%2C+Luis+Urrengoetxea+5%2C+48300+Gernika-Lumo",
    action: "Maps",
  },
  {
    icon: "i-drop",
    name: "Farmazia",
    sub: "Farmacia más cercana a Laga · confirmar horario de guardia",
    href: "https://maps.app.goo.gl/9kXLgYBn99WAuUJj8",
    action: "Maps",
  },
  {
    icon: "i-drop",
    name: "Otras farmacias",
    sub: "Buscar farmacias cerca y la de guardia",
    href: "https://www.google.com/maps/search/farmacia/@43.4099,-2.6306,13z",
    action: "Buscar",
  },
];

// Horarios y recordatorios consolidados (ya mencionados en otras vistas).
export const REMINDERS: Essential[] = [
  {
    icon: "i-house",
    name: "Hostel",
    sub: "Check-in 14:00 · check-out 12:00",
  },
  {
    icon: "i-clock",
    name: "Surf",
    sub: "Estar 30 min antes de cada clase",
  },
];
