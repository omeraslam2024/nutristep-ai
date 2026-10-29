# Redesign — direction "Lassi" + "Leaf Step" logo (1.4.0)

Chosen by the owner on 28 Oct 2026 from three Claude Design directions (Lassi, Josh, Sukoon) and six
logo concepts. Design project: https://claude.ai/design/p/176f09e0-a617-4c01-8bd7-86ae1e73ffeb

## Design system

| | Light | Dark |
|---|---|---|
| Page | cream `#FFF8F1` | plum `#1B1521` |
| Cards | white, soft warm shadow, 28 px radius | `#2A2131` |
| Text | ink `#2B2236` | `#FFF8F1` |
| Primary button | plum pill, white text | peach pill, plum text |
| Accents | coral `#FF7E5F` (calories, camera), leaf `#2FAE78` (steps), peach, mint, lilac, butter, sky tiles | deep tints of the same |

Fonts are bundled (work offline): **Fredoka** for headings and numbers, **Figtree** for text.
Tokens live in `src/index.css` (`bg-coral`, `bg-mint`, `text-leaf-ink`, `btn-primary`, …).

## Logo

"Leaf Step": a footprint whose sole is a leaf — every step turns into food. Redrawn as a vector
(`public/icon.svg`, white variant `icon-white.svg`); `node scripts/generate-android-icons.mjs` builds the
adaptive launcher icon (cream background, safe zone), Android 13 themed icon, legacy icons, splash, PWA
icons, favicon and the `nutristep-logo.svg/png` lockup from it.

## Screens rebuilt to the mock-ups

Onboarding (thali-plate illustration), Home (coral calorie ring, eaten/burned/goal chips, macro bars,
mint Steps and butter Streak tiles, meal list with "Add" pills, water), Steps (green ring, km/kcal/min
tiles, steps-per-hour chart, auto-counting switch), Log food bottom sheet (Barcode/Manual/Quick picks,
peach calories field, "Add to lunch · 520 kcal"), Profile, Reports, bottom navigation with pastel active
pills and a raised coral camera button, and the share card.

## Fixed while testing on the emulator

- **Android back button closed the app** from any tab or sheet. Added `@capacitor/app`: back now closes
  the open sheet, then returns to Home, and only leaves the app from Home.
- **Reports calorie chart was always empty** (bars sized as % of a box with no height) and its "7-day"
  averages used the whole history. Fixed both.
- White flash before the first frame: the WebView is now transparent, so the cream/plum window
  background shows while the page loads.
- Review step copy simplified ("Items and portions", no emoji labels).

## Not done here

- Reports page tabs (Daily steps, Macros, Weight) keep their earlier layout, re-coloured by the tokens.
- Claude Design's Urdu language toggle (EN · اردو) on the welcome screen was not built — the app has no
  Urdu strings yet.
