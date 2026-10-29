# Building a release APK

## Requirements

- Node 20+ and `npm install --legacy-peer-deps`
- **JDK 21** (Capacitor 8 requires it). On Windows set `JAVA_HOME` to a JDK 21 folder.
- Android SDK with platform 36.

## Signing key

Release builds are signed with `D:\nutristep\nutristep\nutristep-release.jks` (alias `nutristep`).
Gradle reads its location and passwords from **`android/keystore.properties`**, which is git-ignored;
a copy of that file sits next to the keystore.

> **Back up `D:\nutristep\nutristep\` now** (both files) to somewhere safe outside this PC — a password manager
> or encrypted cloud storage. Every future update must be signed with the same key: if it is lost,
> phones that installed this APK cannot update and must uninstall first. If you publish on Google Play
> with Play App Signing, this key becomes your *upload* key and Google can reset it.

Template for `android/keystore.properties`:

```properties
storeFile=D:/nutristep/nutristep/nutristep-release.jks
storePassword=…
keyAlias=nutristep
keyPassword=…
```

## Build

```bash
npm test
npx vite build
npx cap sync android
cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. Bump `versionCode` and `versionName` in
`android/app/build.gradle` (and `version` in `package.json`) for every release.

## Turning the AI features on

The APK hides photo analysis, meal-by-text, label scan and the coach unless it is built with the address of
a running `server.ts` (which keeps the Gemini key on the server):

1. Deploy `server.ts` (e.g. Google Cloud Run) with `GEMINI_API_KEY` set in its environment.
2. Add `<uses-permission android:name="android.permission.CAMERA" />` back to
   `android/app/src/main/AndroidManifest.xml` (the camera tab needs it; it is removed while AI is hidden).
3. Build with the address: `VITE_API_BASE=https://your-server.example npx vite build`, then sync and
   assemble as above.

Never put the Gemini key itself into the app.

## Regenerating icons

Replace `public/nutristep-logo.png`, then run `node scripts/generate-android-icons.mjs`.
