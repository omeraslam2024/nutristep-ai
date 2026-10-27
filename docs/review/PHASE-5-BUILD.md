# Phase 5 — Build Generation (APK)

Built 27 Oct 2026 from branch `review/full-pass`.

## The APK

| | |
|---|---|
| File | `release/NutriStep-1.3.0-release.apk` (git-ignored copy of `android/app/build/outputs/apk/release/app-release.apk`) |
| Size | 3.8 MB |
| SHA-256 | `1dc34802821af2206d9e660520461b77603367b3192f1309db535d466d640fb2` |
| Package / version | `com.nutristep.ai` · 1.3.0 (versionCode 130) |
| SDK levels | minSdk 24 (Android 7.0) · targetSdk 36 · compileSdk 36 |
| Signature | APK Signature Scheme v2, verified with `apksigner`; certificate `CN=NutriStep, O=NutriStep, C=PK`, SHA-256 `6c49c5db…c8f9b914`. Key: `D:\nutristep-keys\nutristep-release.jks` — **back it up** (see `docs/RELEASE.md`). |
| AI features | Hidden (built without `VITE_API_BASE`). |

## Pre-flight check

| Check | Result |
|---|---|
| Type-check (`tsc --noEmit`) | Pass |
| Unit tests (`vitest run`) | 23 / 23 pass |
| `assembleDebug` and `assembleRelease` | BUILD SUCCESSFUL |
| Permissions in the built APK | `INTERNET`, `ACCESS_NETWORK_STATE`, `ACTIVITY_RECOGNITION` (+ AndroidX's internal receiver permission). `BODY_SENSORS` and `CAMERA` removed as unused in this build. |
| Native libraries / 16 KB alignment | No `.so` files in the APK — not applicable. |
| Installed and run on an emulator (Pixel, Android 15) | Splash → onboarding → Home → Log food in dark mode; AI tabs absent; no app errors in the log. |
| Service worker inside the APK | Was failing to precache; now registered on the web only. |
| Phase 1–4 items | Resolved as listed in each phase report, except the open points below. |

## Not verified here

- **Hardware step counter on a real phone.** The emulator has no step-counter chip, so it ran the
  accelerometer fallback. On your Pixel 7: allow "Physical activity", leave the phone still for 10 min
  (expect +0), walk 100 steps (expect ~95–105), close the app, walk, reopen (steps should be added).
- **Sharing to WhatsApp/Instagram** (Android share sheet) and the data backup share — need a real phone.
- Release minification (R8) is off, as before; turning it on needs a device test of the Capacitor plugins.

## Installing on your phone

The old APK on your phone was signed with a different (debug) key, so Android will refuse to install this
one over it ("App not installed"). **Uninstall the old NutriStep first** — this deletes the data it stored.
Then copy the APK to the phone and open it (allow "Install unknown apps" for your file manager or browser).

## CI

`.github/workflows/build-apk.yml` still builds a *debug* APK on every push to `main` and publishes it
under a fixed `v1.2.0` release tag. To build signed releases in CI, add the keystore and its passwords
as GitHub secrets — that needs you; nothing was pushed.
