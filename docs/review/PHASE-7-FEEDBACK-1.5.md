# 1.5.0 — owner feedback round (28 Oct 2026)

Requested from a real-phone test (large font and display size), keeping the app simple.

| Request | Done |
|---|---|
| Onboarding "not in proportion" (Age/Height/Weight boxes clipped, double focus ring) | Full-width rows that stay readable with large Android font/display sizes; one focus border; the Continue/Get started button stays pinned on screen (root used `overflow-x: hidden`, which silently disabled sticky positioning — now `clip`). Home greeting, energy labels and rings also adapt to large text. Tested at font scale 1.3 + larger display size. |
| Height in cm or ft/in, weight in kg or lb | Units switch in onboarding (kg · cm / lb · ft, in); stored metric, shown in the chosen units. The profile editor already had this. |
| ~100 searchable quick picks by meal and cuisine | 109 dishes (`src/data/foods.ts`): Pakistani, Indian, Chinese, Thai, Asian, Continental, American, Everyday. Each tagged with the meals it is eaten at; the list opens on the meal being logged, with cuisine chips and search (any word order). Values are typical per serving; a test checks each dish's calories against its macros. Quick picks is now the first tab. |
| Step reports: daily, weekly, monthly, yearly | Reports › Steps with Day / Week / Month / Year: bars, total, daily average, best day/hour/month, goal days (`src/utils/stepReports.ts`, tested). |
| Free AI coach | A **free, offline coach** (`src/utils/coach.ts`): tips from today's numbers (steps left and walk time, protein, water, over-budget) and next-meal ideas from the dish list that fit the remaining calories and favour cuisines you log — one tap logs them. It is rule-based and says so; no AI service is free *and* usable from an app without a server holding the key. The Gemini AI chat still appears when the app is built with `VITE_API_BASE`. |
| 30 / 60 / 90-day challenges | Home and Profile › Challenges: 30-day walk (steps), 60-day balance (+ calories), 90-day fit for life (+ water). Day grid, progress ring, stop/restart (`src/utils/challenges.ts`, tested). |

Tests: 48 passing. APK: `release/NutriStep-1.5.0-release.apk` (versionCode 150, same signing key).
