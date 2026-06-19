# UX / review feedback handoff

Consolidated feedback from a multi-agent review pass (5 agent-browser UI/UX reviewers + a codex code review). Generated 2026-06-19. No PII.

Recent commits this covers:
- `bd2b961..1eb03fe` surf forecast overhaul, trip features, review + codex fixes
- `1eb03fe..a18919c` surf detail: auto-open today, temp + sky per 3h, drop hourly toggle, center StatLine

Status legend: `[ ]` open, `[x]` already resolved this session.

## No P0 blockers
The date-aware engine, offline cache to seed fallback, dark mode, and cross-tab coherence (during-trip / San Juan / post-trip / offline) all passed. Build is green: tsc clean, 91 unit tests, vite build succeeds.

## Highest value (multiple reviewers / real impact)

1. [ ] **Day-cards do not look tappable on touch.** The expand chevron is `opacity:0` until hover, which never fires on a phone, so the hourly detail (the headline feature) may go undiscovered. Partially mitigated now (today auto-opens), but other days still lack the cue. Fix: reveal the chevron faintly under `@media (hover:none)`. (Mobile)
2. [ ] **"Me meto?" GOOD verdict ignores wind cleanliness.** Shows "Buen dia para entrar / viento flojo onshore" while the wind label reads "Onshore (movido)". Contradictory. Fix: factor cleanliness into the verdict, or soften the title when not offshore. (IA, surfCopy.ts)
3. [ ] **Agua / UV / Viento shown twice** (StatLine above the strip and the Gauges panel below the tide chart), within one scroll. Fix: consolidate to one (fold UV gauge + water word + wind compass into the gauge tiles, drop StatLine). (IA)
4. [ ] **Expanded detail panel not associated with its trigger.** No `aria-controls` / `id`, and it renders as a sibling after the whole strip, so keyboard focus order skips past it. Fix: add `id` + `aria-controls`. (a11y, ForecastStrip.tsx + DayDetail.tsx)
5. [ ] **Offline banner has no `role="status"`** so it is not announced to screen readers. One-line fix in OfflineBanner.tsx. (a11y)
6. [ ] **`--faint` text on `--paper` fails AA** (footer, ~4.19:1). Fix: use `--muted`. (a11y, styles.css)

## Visual polish (P1)
7. [ ] **StatLine labels misaligned**: the UV gauge pushes "Crema si o si" below the Agua / Viento labels. Give the three stats a shared baseline. (styles.css `.statline`/`.stat`)
8. [ ] **Amber overload in the DayDetail grid**: amber minibars + amber energy pills + amber arrows leave no neutral rest. Fix: neutral minibars; reserve the amber energy pill for the "hi" band only. (DayDetail.tsx + styles.css)
9. [ ] **`.avisos` border uses `--accent-text`** (reads as muddy brown). Use `--accent` / `--accent-soft`. (styles.css)

## Content clarity (P1)
10. [ ] **"Energia (rel.)" is unexplained.** Add a one-line caption (relative 0-100 index of height x period) or drop the row. (DayDetail.tsx)
11. [ ] **2-partition note is forecaster jargon** ("trenes de mar independientes"). Plain-language it. (DayDetail.tsx)
12. [ ] **Marea row has no unit.** Label it "Marea (m)". (DayDetail.tsx)
13. [ ] **Desktop rail countdown has no "what's next" label** (the mobile hero does it right). (RailStatus.tsx)

## P2 (polish / deliberate decisions)
- [ ] Forecast strip lacks the edge-fade affordance the detail grid has. (styles.css `.fcast`)
- [ ] New UV / water colors are slightly raw vs the muted palette and do not adapt to dark mode (hardcoded, not tokens). (StatLine.tsx)
- [ ] Mapa "buscar cerca" is a wall of amber-soft pills. Consider neutral chips. (styles.css `.nearchip`)
- [ ] Wave/swell DirArrow labels use raw degrees ("Olas del 339") while wind uses compass ("Viento del E"). Run both through `compassEs`. (DirArrow callers)
- [ ] Show-past button lacks `aria-expanded`. (RutaView.tsx)
- [ ] Rail-status label is hardcoded "Ahora" even post-trip. (RailStatus.tsx)
- [ ] Tide/wave viz covers 20-23 while the forecast strip shows 20-24; on the 24th the tide chart falls back to Sab 20. Document as surf-days-only or add a 24th entry. (tides.ts / forecastSeed.ts)
- [ ] A3513 (Bilbao leg) and A3526 (beach bus) sit close together and could read as a typo. A half-sentence distinguishing them would help. (RutaView.tsx)
- [ ] SOS / essentials card uses the same amber badge as ordinary panels; a stronger treatment would match its importance. (MapaView.tsx)
- [ ] No `hashchange` listener: deep-links work on fresh load, but hash-only changes in an already-loaded SPA do not switch tabs, and back/forward will not move between tabs (uses `replaceState`). Likely fine for a phone reference; confirm it is intentional. (App.tsx)

## Resolved this session
- [x] 3h/1h granularity toggle removed (3-hourly is enough); orphaned CSS deleted.
- [x] Transient build failure the a11y reviewer hit mid-edit (HourPoint required tempC/skyCode before the seed supplied them); now green and pushed.
- [x] Wave-height bars were invisible in light mode; now visible with a non-color "today" marker.
- [x] `parseNowParam` handled space-separated / date-only `?now=` wrong and rolled over impossible dates; fixed + tested.
- [x] Portus SST parsing could throw and kill the whole live merge; now fails closed to seed.
- [x] Live hourly was clamped to the seed length on cache reload; now preserved.
- [x] Linear mean of compass degrees flipped offshore/onshore across north; now circular mean.
- [x] All "iniciacion" / beginner framing removed (mixed-level group).
- [x] StatLine: Agua / UV / Viento centered.

## Not a bug (per owner)
- Turnos table vs the "1a clase 17:00-19:00" note: the table is an estimate, the 17:00 class is the confirmed one. Intentional; do not "fix" the mismatch.

## Recommended next batch (small, high-impact, low-risk)
Items 1, 2, 4, 5, 6, 12. Items 3 (de-dup StatLine/Gauges) and 8 (amber rebalance) are higher-judgment design calls worth an explicit decision first.
