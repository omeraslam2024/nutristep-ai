# Phase 3 — UI/UX Overhaul

Done 27 Oct 2026 on branch `review/full-pass`. Checked in the browser at 320×640, 375×812 and 1024×768, in
light and dark mode.

## Design system (`src/index.css`)

- **One token layer for both themes.** Surfaces, text and accents are re-pointed per theme on
  `<html data-theme>`, so every screen — including the older modals — switches from one place.
- **Brand colours sampled from the logo**: lime `#5BB324` (primary actions), forest `#0A4A32`, leaf
  `#1B7A42`. Neutrals carry a slight green tint so the UI and logo read as one family.
- **Contrast (WCAG AA):** secondary text is ≥ 4.5:1 on cards in both themes; accent text uses the 700-level
  shade in light mode; primary buttons use dark text on lime (≈ 7:1) in both themes.
- **Typography:** Plus Jakarta Sans (variable), **bundled in the app** (`@fontsource-variable`) so it also
  works offline. Lighter weights replace the old all-`font-black` style; tabular figures for numbers.
- **Theme switching:** follows the phone's dark-mode setting by default; Profile › Appearance offers
  System / Light / Dark. The theme is applied before first paint (no flash), and the Android status
  bar icons flip to match (`SystemBars`).
- **Motion:** route cross-fade, staggered card entrance, animated rings and count-up numbers, sliding tab
  and nav indicators, spring toggles, animated water glasses, confetti at goals. All of it switches
  off under the system "reduce motion" setting.

## Screens

| Screen | What changed |
|---|---|
| **Onboarding** (new) | 4 short steps: promise ("Snap your plate. Walk it off."), about you (name, sex, age, height, weight, goal), step-counter permission with a plain reason, then a "your daily budget" reveal. Replaces the fake "Alex Rivera" start. |
| **Navigation** | One bottom bar on every screen: **Home · Steps · [Snap] · Reports · Profile**, with an animated active pill. The top tab bar, header button cluster and per-page "Back to Home" bars are gone. |
| **Home** | Hero ring for "kcal left" (budget = goal + calories walked off), eaten / burned / goal, macro bars, a status line that is honest when nothing is logged, one primary action. Steps ring card, streak card with a 7-day row, coach card (only when AI is available), meals, water. |
| **Steps** | 220 px progress ring, kcal / km / minutes, an hour-by-hour chart, the automatic-counting card with a plain explanation, manual add (collapsed). |
| **Reports** | Same charts on the new surface; duplicate "Module C" header removed. |
| **Profile** (new) | Avatar, key numbers, goals, step-counting switch, share, appearance. |
| **Log food** | Tabs **Camera · Photo · Describe · Barcode · Manual · Quick picks**. New Manual entry. Barcode now calls Open Food Facts directly, so it works without the server. No more invented values when a product lacks data. Quick-pick photos are bundled (one original photo was a stack of books; replaced with an illustration). |
| **Meals / Water** | Rewritten as clean lists with icon tints, animated add/remove, haptic tick on water. |

## Sharing ("viral") hooks

- **Share card:** one tap renders a branded 1080×1350 image (logo, steps ring, km, kcal, streak) and
  opens the Android share sheet (WhatsApp, Instagram…). From Home and Profile.
- **Milestone prompt:** crossing the step goal shows a "goal reached — Share" toast with confetti.
- **Data backup** now uses the share sheet too (the old download link did nothing inside the APK).

## AI hidden in the APK (your decision)

`src/utils/features.ts` → `AI_ENABLED` is false in the APK unless it is built with `VITE_API_BASE`. Then:
Camera / Photo / Describe tabs, the Coach card, "Ask coach" on meals and in the streak sheet are hidden;
Barcode, Manual and Quick picks remain, and copy says "Log food" instead of "Snap your plate". To turn
AI on later: deploy `server.ts`, then build with `VITE_API_BASE=https://…`.

## Known gaps

- The design was built directly from these principles; no Claude Design mock-up round was run.
- Streak, Settings, Coach and Scanner sheets were re-themed by the token layer and a style sweep, not
  redrawn from scratch; they are consistent but denser than the new screens.
