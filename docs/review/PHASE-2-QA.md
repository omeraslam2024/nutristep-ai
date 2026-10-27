# Phase 2 — Technical QA & Logic Testing

Tested 27 Oct 2026 on branch `review/full-pass`: every main button and flow in a 375 px phone viewport,
320×640 (small budget phone) and 1024×768 (tablet), the network calls each flow makes, and the Android
project build (JDK 21, Gradle 8.14.3, compileSdk/targetSdk 36, minSdk 24).

## Result

| | |
|---|---|
| Bugs found | 17 |
| Fixed in this phase | 15 |
| **Blocking, need your decision** | **1** (B1) — plus B2, which is the same root cause |
| Unit tests added | 23, all passing (`npx vitest run`) |
| Original Android project | builds (`assembleDebug` → BUILD SUCCESSFUL) |

## Blocking

### B1 · Every AI feature is dead inside the APK
The Android app loads the web build from `https://localhost` inside a WebView. The scanner and coach call
relative URLs (`/api/analyze-plate`, `/api/coach-chat`, …), which only exist when `server.ts` (Express + the
Gemini key) is serving the page. In the APK there is no server, so **photo analysis, text/voice meal
parsing, nutrition-label scan, barcode lookup and the AI coach all fail on the phone**. The scanner then
shows an error; the coach used to show a canned tip dressed as an AI answer.

What I did: all calls now go through `apiUrl()` (`src/utils/api.ts`), which prefixes `VITE_API_BASE` at build
time, and `server.ts` now answers CORS from the WebView origins. **What is still needed is somewhere for
the APK to call** — one of:

1. **Host `server.ts`** (Google Cloud Run — AI Studio's own "Deploy" does this — or Render/Railway/Fly), with
   `GEMINI_API_KEY` set there, and give me the URL. *Recommended: the key never ships inside the app.*
2. You already have an AI Studio / Cloud Run deployment of this app → just send me its URL.
3. Ship the APK with AI features hidden (food logging by sample/manual entry only) until a server exists.

Putting the Gemini key inside the APK is not an option I will build: anyone can extract it from the APK
and run up your bill.

### B2 · AI Coach never reached the server (also in the browser) — fixed, but depends on B1
The client posted to `/api/coach/chat` with `{message, metrics}`; the server listens on `/api/coach-chat`
and expects `{messages, userContext}`. Every reply was the hard-coded fallback. Fixed: correct route,
full conversation + context payload, verified with a stubbed server; the fallback now says the coach
could not be reached instead of posing as an answer.

## Step counter (the critical state check)

| # | Finding | Fix |
|---|---|---|
| S1 | Steps were counted only by the WebView's `devicemotion` events, i.e. **only while the app was open on screen**; closing the app or turning the screen off stopped counting. | New native plugin `StepCounterPlugin.java` reads Android's **hardware step counter** (`TYPE_STEP_COUNTER`). It runs in the phone's sensor hub, counts all day with the app closed, and only reports real walking — a still phone adds nothing. Asks for "Physical activity" permission (Android 10+); needs none below. |
| S2 | The accelerometer filter (still used as the fallback where no step chip exists, and in the browser) **counted random vibration as walking**: random peaks spaced by the 380 ms debounce look like a cadence. An exact copy of the old filter fed 2 minutes of strong random vibration counted **258 steps**. | Rewritten detector (`stepDetector.ts`): smoothed signal, threshold that rises with background vibration, steady-rhythm check, and nothing credited until 6 rhythmic footfalls. |
| S3 | "Test Walk Simulator" wrote **random fake steps into the real history**, from a button next to the real sensor. | Removed. Tests replace it. |
| S4 | The step card was mounted twice (Home and Steps tab); each copy ran its own sensor and wrote **absolute totals** (`stepsRef + 1`), so two listeners could overwrite each other. | One pedometer for the whole app (`usePedometer` in `App.tsx`) that reports **deltas** only. |
| S5 | Hourly steps were updated by mutating React state in place (`hourlySteps[i].steps += n`). | Immutable update. |
| S6 | Goal confetti fired only for manual "+steps" taps, never for walked steps. | Fires whenever the goal is crossed. |

**Tests proving "no steps while stationary"** (`src/utils/pedometer/stepDetector.test.ts`): phone lying still
(2 min jitter) → 0; strong random vibration → 0; car engine vibration → 0; three table knocks → 0; phone picked
up and put down → 0; 1.2 s of hard shaking → 0; 4-step shuffle → 0. Walking: 200-step walk counted 190–200;
slow walk counted ≥ 56/60; counting stops when walking stops. Hardware-counter accounting
(`counterAccounting.test.ts`): no import of pre-install steps, unchanged counter → 0, reboot handled.

> Real-device check still to do on your Pixel 7: leave the phone on a desk 10 min (expect +0), then walk
> 100 counted steps (expect 95–105). I could not do this — no phone is connected to this PC.

## Data and day logic

| # | Finding | Fix |
|---|---|---|
| D1 | **No day rollover.** "Today" was simply the last stored entry, so on the next day the app kept adding meals and steps to yesterday. | `ensureToday()` starts a new day on launch, every minute and on resume. |
| D2 | Skipped days were missing from history, so the streak **did not break** when you skipped a day. | Missing days are filled with empty logs. |
| D3 | Dates used `toISOString()` (UTC): in Pakistan (UTC+5) everything between 00:00 and 05:00 was filed under the previous day. | Local-date keys (`localDateKey`). |
| D4 | **A new install was pre-filled with a fake person**: "Alex Rivera", 7 days of invented meals/steps, 6,420 steps and 2 meals "today". Existing installs still carry it. | New installs start empty; the old demo meals and their days are stripped on launch (user-logged meals are kept). Onboarding to collect the real profile comes in Phase 3. |
| D5 | Water defaulted to 1,750 ml when nothing was logged. | Defaults to 0. |
| D6 | Two different "calories burned" numbers on one screen (275 vs 270) — from the seeded data's own formula. | Gone with D4; one formula (`calculateStepMetrics`). |

## UI / functional

| # | Finding | Fix |
|---|---|---|
| U1 | At 320 px the Settings button sat off-screen (right edge 351 px) — **profile unreachable on small phones**. | Header shrinks; streak chip hides below 370 px (the streak card is directly below). Verified at 320 px. |
| U2 | Coach replies showed raw `**markdown**`. | `RichText` renders bold and bullets. |
| U3 | Sample dishes were labelled "✓ AI Match" and sent an image URL the server cannot read. | Labelled "Sample"; curated data used directly. |
| U4 | Pinch-zoom disabled (`user-scalable=no`). | Removed. |
| U5 | `BODY_SENSORS` permission declared but never used (Play flags this). | Removed. `ACTIVITY_RECOGNITION` is now used by the step counter. |

## Open, non-blocking (carried to later phases)

- Three navigation bars and no Profile tab → Phase 3 navigation.
- "ON TRACK · Good Nutrition Balance" is shown when nothing has been eaten yet → Phase 3 hero.
- ~10 icon-only buttons without accessible names → Phase 3.
- Sample-dish photos load from Unsplash over the network (blank offline) → Phase 3 bundles images.
- The CI workflow publishes a **debug** APK to a fixed `v1.2.0` release on every push → Phase 5.
- `server.ts` uses model id `gemini-3.8-flash`; confirm it is enabled for your key when the server is deployed.
- Project-rule note: your global Android guide prescribes native Kotlin/Compose. This app is React +
  Capacitor; rewriting it is outside this review, so the review keeps the Capacitor stack.
