# CLAUDE.md — laga-trip

Static, date-aware, multi-tab trip dashboard for the **Laga surf trip (20–24 jun 2026)**, shared with the group and used as a phone reference during the trip. Deployed to Cloudflare at **https://laga.magarcia.run**.

## Source of truth

The canonical trip note lives in the Obsidian vault:

- **`~/Notes/Projects/Active/Travel - Laga - June Surf Trip.md`**

This site is a **read-only, prettified, date-aware view** of that note. The note is authoritative; when it changes, update the files in `public/` to match. The note still holds personal details (names, booking codes, ticket locators, seat numbers, PINs) that must **never** appear in the app. Addresses are wanted and are not treated as PII.

## What it does

Five tabs, switched client-side (no reload): **Hoy · Ruta · Surf · Despensa · Mapa**. Both a desktop left rail and a mobile bottom tab bar drive the same panels.

- **Date-aware:** the hero phase + countdown, the itinerary leg states (Hecho / Ahora / Próximo), the ribbon "now" marker, the "today" snapshot, the forecast strip highlight, and the tide now-marker all recompute from the current time vs. the hard-coded timeline in `public/app.js` (the `B` object). Past legs collapse. Add `?now=2026-06-21T12:00:00+02:00` to preview any moment (an offset is appended automatically if omitted; `+` must be `%2B` in a URL).
- **Surf data-viz (Surf tab):** a cosine-interpolated **tide curve** SVG per day with a live now-marker and day/night shading, **wave-height bars** across the 5 days, **gauge tiles** (periodo/viento/agua/UV), and an **AEMET avisos** block (links to the País Vasco warnings page; static heat-warning heads-up).
- **Maps (Ruta + Mapa):** full street addresses everywhere, stable Google Maps `?api=1` search/directions links (open the native app on mobile), keyless **embedded maps** (lazy `output=embed` iframes that degrade gracefully offline), and "buscar cerca" chips centred on the hostel coords (static hrefs, work without JS).
- **Despensa:** a static grouped **pantry/inventory** (Básicos / Verduras / Proteína / Para picar / Desayuno), not a checklist. No local state. Splitwise invite link kept.
- **Parallax hero (Hoy):** a `position:fixed` photo layer behind a solid content sheet; scoped to Hoy, offset past the rail on desktop, and disabled (static) under `prefers-reduced-motion`.
- **Offline-first:** no external fonts/CDN/JS. `sw.js` caches the shell + assets (network-first, same-origin only, navigation-only fallback). Installable as a PWA via `manifest.webmanifest`.

## Files

| File | Purpose |
|---|---|
| `public/index.html` | Markup + inline Lucide SVG sprite. Links `styles.css` and `app.js`. Trip content lives here. |
| `public/styles.css` | All CSS: design tokens, light/dark, layout, surf data-viz, components. |
| `public/app.js` | All logic: timeline (`B`), phase/date helpers (Europe/Madrid via `Intl`), render loop, tabs, tide/wave rendering. |
| `public/sw.js` | Service worker. Bump `CACHE` on every content change or clients keep the stale cache. |
| `public/manifest.webmanifest` | PWA metadata. |
| `public/icon.svg` | App / favicon icon. |
| `public/fonts/`, `public/img/` | Self-hosted woff2 (Bricolage, Geist, Geist Mono) and photos. |
| `wrangler.jsonc` | Cloudflare config. Static-asset-only Worker + custom domain. |

## Deploy

Personal Cloudflare account (`magarcia`), zone `magarcia.run`.

```sh
npx wrangler deploy
```

Custom domain `laga.magarcia.run` is provisioned via the `routes` block (`custom_domain: true`); DNS + cert are managed by Cloudflare automatically.

**After any content edit:** bump `CACHE` in `public/sw.js`, then redeploy, or returning visitors get the cached old version.

## Design notes

- Mobile-first, casual/social vibe. **One locked accent: low-sun amber** (`--accent` for fills, `--accent-text` for amber-as-text/icon on light surfaces, AA-safe). Neutral wet-slate/sea-mist base, Atlantic-deep dark blocks, dark mode via `prefers-color-scheme`. Radius scale locked: panels 18px (`--r`), small/buttons 12px (`--r-sm`), pills 999px.
- Type: **Bricolage Grotesque** (display) · **Geist** (body) · **Geist Mono** (data/times). Signature element: the tide/itinerary **ribbon** with a live now marker. Icons are inline **Lucide** glyphs (no emoji).
- All motion is gated under `@media (prefers-reduced-motion:no-preference)`.
- No build step, no dependencies beyond `wrangler`. Plain HTML/CSS/vanilla JS so it stays trivially offline and forkable.
- Timeline is Europe/Madrid (`+02:00`). To reuse for another trip, edit `B` and the per-day data (`TIDES`, `WAVES`) in `app.js`, the `.leg` `data-start`/`data-end` and `.fday[data-date]` in `index.html`, and the hostel coords in the near-search hrefs.
