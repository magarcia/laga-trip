# CLAUDE.md — laga-trip

Date-aware, multi-tab trip dashboard for the **Laga surf trip (20–24 jun 2026)**, shared with the group and used as a phone reference during the trip. **Vite + React + TypeScript client-side SPA**, built to static assets and served by a Cloudflare assets-only Worker at **https://laga.magarcia.run**.

## Source of truth

The canonical trip note lives in the Obsidian vault:

- **`~/Notes/Projects/Active/Travel - Laga - June Surf Trip.md`**

This site is a **read-only, prettified, date-aware view** of that note. The note is authoritative; when it changes, update the matching `src/` data modules (`lib/timeline.ts`, `lib/tides.ts`, `lib/forecastSeed.ts`, and the per-view content). The note still holds personal details (names, booking codes, ticket locators, seat numbers, PINs) that must **never** appear in the app. Addresses are wanted and are not treated as PII.

## What it does

Five tabs, switched client-side (no reload), `.view.active` toggles display; a desktop left rail and a mobile bottom tab bar drive the same panels (roving tabindex + `aria-current` + Arrow/Home/End keys).

- **Date-aware:** the hero phase + countdown, itinerary leg states (Hecho / Ahora / Próximo), the ribbon "now" marker, the "today" snapshot, the forecast-strip highlight, and the tide now-marker all recompute from a single shared clock (`useNow` → `NowContext`) vs. the hard-coded timeline in `lib/timeline.ts` (the `B` object). Past legs collapse. Add `?now=2026-06-21T12:00:00+02:00` to preview any moment — this **freezes the clock and forces seed forecast data** so previews are deterministic (an offset is appended if omitted; `+` must be `%2B` in a URL).
- **Live weather + surf (every 6h):** `useForecast` fetches **Open-Meteo** (keyless, CORS-enabled) weather + marine APIs client-side, caches in `localStorage` with a 6h policy (refresh on mount / interval / focus / visibility / reconnect), and falls back **cache → static seed** offline. The seed (`lib/forecastSeed.ts`) is the exact pre-refactor hardcoded values, so first paint / offline / API-down render byte-for-byte as before. Live data only ever **replaces values inside a fixed display shape** (`types/forecast.ts`); it never changes the shape. Tides and the itinerary timeline stay precomputed/static (astronomical / fixed).
- **Surf data-viz (Surf tab):** a cosine-interpolated **tide curve** SVG per day (`lib/tides.ts`) with a live now-marker + day/night shading, **wave-height bars** (4 days, 20–23), **gauge tiles** (periodo/viento/agua/UV), and an **AEMET avisos** block (static heat-warning heads-up).
- **Maps (Ruta + Mapa):** full street addresses, stable Google Maps `?api=1` search/directions links, keyless **embedded maps** (native `loading="lazy"` `output=embed` iframes), and a "buscar cerca" grid centred on the hostel coords.
- **Despensa:** a static grouped **pantry/inventory**. No local state. Splitwise invite link kept.
- **Hero (Hoy):** an `absolute` photo layer (z-index behind the content sheet) that scrolls away with the hero — **not** a fixed/parallax layer. One-time `.boot` intro, dropped after 1200ms, gated under `prefers-reduced-motion`.
- **Offline-first PWA:** no external fonts/CDN. `vite-plugin-pwa` (`generateSW`/Workbox) precaches the hashed build + fonts/images; `navigateFallback` for SPA routing; cross-origin (Maps/AEMET/Open-Meteo) never intercepted. Installable via `manifest.webmanifest`.

## Files

| Path | Purpose |
|---|---|
| `index.html` | Vite entry: `#root` + module script. (No content lives here.) |
| `src/main.tsx` | Mount + `registerSW` + `import "./styles.css"`. |
| `src/App.tsx` | Shell: providers, `activeTab` + `showPast` state, all 5 views, `body.show-past`/`is-offline`. |
| `src/styles.css` | All CSS: design tokens, light/dark, layout, surf data-viz, components (carried over near-verbatim). |
| `src/contexts.ts` | `NowContext`, `ForecastContext` + accessors. |
| `src/hooks/` | `useNow` (single clock), `useForecast` (Open-Meteo + 6h cache + fallback), `useOnline`. |
| `src/lib/` | `time.ts` (Madrid `Intl`, `?now=` parse), `timeline.ts` (`B`, phase, legs), `tides.ts` (`TIDES` + SVG geometry), `forecastSeed.ts` (static seed = parity oracle), `openMeteo.ts` (fetch + WMO→ES + per-field seed merge + cache revive), `format.ts`. |
| `src/types/forecast.ts` | The forecast model shape (owned by the seed). |
| `src/components/` | `Sprite` (27 Lucide symbols), `Icon`, nav (`Rail`/`TabBar`/`NavButtons`), `views/` + `hoy/` `ruta/` `surf/` subcomponents. |
| `public/` | Vite passthrough → `dist/` unhashed: `fonts/` (Bricolage, Geist, Geist Mono woff2), `img/`, `icon.svg`, `manifest.webmanifest`. |
| `wrangler.jsonc` | Cloudflare assets-only Worker (`directory: ./dist`) + custom domain. |
| `vite.config.ts` | React plugin + `vite-plugin-pwa`. |

## Develop / build / deploy

Personal Cloudflare account (`magarcia`), zone `magarcia.run`.

```sh
npm install
npm run dev       # local dev server (HMR)
npm run build     # tsc -b && vite build  -> dist/ (generates the service worker)
npm run preview   # serve the production build locally (exercises the real SW)
npx wrangler deploy   # or: npm run deploy  (= build + deploy)
```

Custom domain `laga.magarcia.run` is provisioned via the `routes` block (`custom_domain: true`); DNS + cert are managed by Cloudflare automatically. The SW is content-hash-versioned by Workbox, so the old "bump `CACHE`" ritual is gone — a rebuild invalidates automatically. **Migration note:** returning visitors still running the old hand-rolled `/sw.js` will see stale content on the first post-deploy visit before the new SW takes over.

## Design notes

- Mobile-first, casual/social vibe. **One locked accent: low-sun amber** (`--accent` for fills, `--accent-text` for amber-as-text/icon on light surfaces, AA-safe). Neutral wet-slate/sea-mist base, Atlantic-deep dark blocks, dark mode via `prefers-color-scheme`. Radius scale locked: panels 18px (`--r`), small/buttons 12px (`--r-sm`), pills 999px.
- Type: **Bricolage Grotesque** (display) · **Geist** (body) · **Geist Mono** (data/times). Signature element: the tide/itinerary **ribbon** with a live now marker. Icons are inline **Lucide** glyphs (no emoji).
- All motion is gated under `@media (prefers-reduced-motion:no-preference)`.
- Has a build step (Vite). Single global stylesheet, no CSS-in-JS. Self-hosted assets so it stays offline-capable. To reuse for another trip, edit `B` + per-day data (`TIDES` in `lib/tides.ts`, the seed in `lib/forecastSeed.ts`), the leg times in `RutaView.tsx`, the Open-Meteo lat/lon in `lib/openMeteo.ts`, and the hostel coords in `MapaView.tsx`.
