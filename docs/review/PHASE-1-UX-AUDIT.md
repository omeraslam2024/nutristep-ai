# Phase 1 — User Experience & Virality Audit

Reviewed 27 Oct 2026 on branch `review/full-pass`, as a first-time user, in a phone viewport (375×812),
a small budget phone (320×640) and a tablet (1024×768), against the web build that the APK wraps.

## Verdict

The app has a strong core idea (photo → calories, steps add back to the food budget, dual-goal streak),
but a first-time user does not reach that idea in under 5 seconds. They land in someone else's account,
on a screen with three navigation bars and about forty controls, and the two AI features silently
return canned answers. Nothing in the app can be shared.

## 1 · First impressions (onboarding)

| # | Finding | Severity | Recommendation |
|---|---|---|---|
| 1.1 | **There is no onboarding.** A new install opens straight onto a populated dashboard. | High | Three-screen onboarding: (1) value promise in one line + logo, (2) name, sex, age, height, weight, goal, (3) step-counter permission with a plain-words reason. Ends on a "Your daily budget is 2,194 kcal" reveal. |
| 1.2 | **A new user sees a fake person's data.** "Welcome, Alex", 7 days of invented history, 6,420 steps and two meals already logged today (`generateInitialHistory`, `DEFAULT_USER_PROFILE`). The user cannot tell what is theirs. | High | Start empty. Show demo data only behind an explicit "Try with sample data" button, clearly labelled. |
| 1.3 | **The value is not explained in 5 s.** The first screen leads with a "0-Day Dual Goal Streak" card and a paragraph of rules, not with what the app does for you. | High | Hero first: "Calories left today" ring + one big "Snap your plate" action. Streak becomes a compact chip. |
| 1.4 | The scanner opens on a "Sample Meals / Instant Test Gallery" tab, not the camera. | Medium | Open on the camera; samples move to a secondary "Try a sample" link. |
| 1.5 | Pinch-zoom is disabled (`user-scalable=no, maximum-scale=1`). Fails WCAG 1.4.4. | Medium | Remove both. |
| 1.6 | Copy is shouty and dense: emoji in every label, all-caps chips, words like "Biomechanical filter enabled". | Low | Short sentence-case labels, icons from one set (Lucide) instead of mixed emoji. |

## 2 · The "Wow" factor and sharing

**Friction that stops sharing:** there is no share action anywhere (`navigator.share` is never called), no
image to share, the streak starts at 0 and the first win is hard to reach (both goals on the same day).

| # | Hook | Why it spreads |
|---|---|---|
| 2.1 | **Share card** — one tap renders a branded 1080×1350 image (logo, today's steps ring, calories, streak flame) and opens the Android share sheet. | A designed image is what people post to stories/WhatsApp; it carries the brand. |
| 2.2 | **Milestone moments** — confetti + haptic + "Share this" sheet at 50 % and 100 % of step goal, first logged meal, 3/7/30-day streak. | Shares happen at peaks of emotion. |
| 2.3 | **Streak forgiveness** — one "freeze" per week. | Losing a long streak is the top churn trigger in habit apps. |
| 2.4 | **Single-goal wins** — show separate step and food "rings closed" states, not only the strict dual-goal streak. | Gives a win on day 1. |
| 2.5 | **Weekly recap card** (Sunday): best day, total km, average kcal. | A recurring, shareable reason to return. |
| 2.6 | Micro-interactions: ring fill animation on load, number count-up, haptic tick per glass of water, button press scale. | Makes the app feel alive. |

## 3 · Navigation consistency

| # | Finding | Severity |
|---|---|---|
| 3.1 | **Three overlapping navigation systems** on every screen: header buttons (Coach, Snap, Settings), a top tab bar (Food / Steps / Reports) and a bottom bar (Food / Steps / Snap / Coach / Reports). The top tab bar duplicates the bottom bar. | High |
| 3.2 | **No Profile entry in the persistent nav.** Profile/Settings is only a small gear in the header — and at 320 px width the gear is pushed **off-screen** (right edge at 351 px on a 320 px screen), so it cannot be reached on small phones. | High (bug) |
| 3.3 | Coach, Scanner, Streak and Settings are full-screen overlays that hide the bottom bar; they rely on their own Back buttons (which work). Acceptable for modal tasks. | Info |
| 3.4 | "Steps" view has its own "← Home" button, "Reports" has a "← Back to Home" bar — redundant with the bottom bar. | Low |
| 3.5 | ~10 icon-only buttons have no accessible name (TalkBack reads "button"). | Medium |

**Recommendation:** one bottom bar on every screen — **Home · Steps · [Snap] · Reports · Profile** — with the
Coach reachable from Home and from each meal. Remove the top tab bar and the in-page "Back to Home" buttons.

## Carried into later phases

- Onboarding, empty start, share card, milestones → built in Phase 3.
- Settings unreachable at 320 px, unlabeled buttons, zoom disabled → fixed in Phase 2/3.
