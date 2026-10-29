# Phase 4 — Branding & Asset Integration

Source: the official logo in the repo, `public/nutristep-logo.png` (512×512). All Android images are
generated from it by `node scripts/generate-android-icons.mjs`, so a new logo only needs that command.

## Launcher icon

| Before | After |
|---|---|
| Adaptive foreground was the whole logo edge-to-edge at 192 px (xxxhdpi needs 432 px), so round and squircle launcher masks cut off the leaves and bars. | Mark (apple + walker + bars, without the wordmark) centred inside the 66 dp safe zone at every density (108–432 px), on a white background layer. |
| No themed icon. | Monochrome layer, so Android 13+ "Themed icons" shows a tinted NutriStep mark instead of falling back. |
| Legacy icons for Android 7.x were full-bleed squares. | Rounded-square and round versions. |
| Launcher label "NutriStep AI" (truncates on many launchers). | "NutriStep". |
| — | `docs/play-store-icon-512.png` for the Play listing. |

## Splash screen

The app opened on **Capacitor's default blue "X" logo** on white. It now uses the Android 12 SplashScreen
API (and the core-splashscreen fallback below 12): the NutriStep mark on the app's own background colour —
`#F4F6F0` in light mode, `#0B100D` in dark (`values-night`) — so launch flows into the first screen without a
white flash. The default Capacitor launcher/splash drawables were removed.

## Brand colour through the UI

- Same three brand colours in `src/index.css` and `android/.../values/colors.xml`: lime `#5BB324`,
  leaf `#1B7A42`, forest `#0A4A32`.
- Header: logo tile + "Nutri**Step**" wordmark with the green "Step".
- Active states: bottom-nav pill, tab indicators, switches, focus rings and progress rings use the brand
  green; primary buttons and the Snap button use lime.
- Loading spinner in the food logger uses the brand gradient.
- Web manifest / browser `theme-color` updated from the old navy `#020617`.
- Share card is drawn in brand forest/lime with the logo.
