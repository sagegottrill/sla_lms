# SLA LMS Mobile (Android)

The official **She Leads Africa** mobile app — a native Android wrapper around the shared LMS code base. Same auth, same Supabase backend, same course/program/forum data as the web app, wrapped by **Capacitor** for a native feel: branded splash screen, launcher icons, haptic-feel bottom tab bar and fluid page transitions.

## What's inside

| Path | What it is |
|---|---|
| `src/` | The mobile React app (screens, kit components, mobile-adapted realtime popup hook) |
| `android/` | Generated Capacitor Android project (Gradle, manifests, icons, splash assets) |
| `assets/` | Source brand icon/splash generated from `sla_logo_transparent.png` |
| `dist/` | Mobile web bundle output (built by Vite) |

### Screens (end-to-end)

- **Auth** — email/password sign-in + sign-up, full name capture, error surfacing (uses the *shared* `AuthContext`)
- **Home** — greeting header, enrolled-courses rail, quick stats
- **My Courses** — enrolled list + full course catalog, enroll action, detail sheet
- **Course detail / learning** — modules & lessons, mark-lesson-complete
- **Community Forums** — threads + replies, **image upload** on new posts, realtime **popup alerts** (supabase realtime + 15s poll fallback) when other members post — mobile counterpart of the web fix
- **Alerts** — notifications list + per-channel preference toggles
- **Profile** — avatar/name editing, sign-out

## Key architecture notes

- `vite.config.ts` aliases `@` → **../src**: the mobile app imports the *same* `services/api.ts`, `contexts/AuthContext.tsx`, `hooks/useQueries.ts`, `types` etc. as web — one backend, two frontends.
- Shadow aliases override the two web files that hardcode desktop routes/env:
  - `@/lib/supabase` → `mobile/src/lib/supabase.ts` (session persisted via Capacitor `Preferences`, not localStorage)
  - `@/hooks/useForumRealtime` → `mobile/src/hooks/useForumRealtime.ts` (routes popups to the mobile Forums tab)
  - `@kit` → `mobile/src/lib/m` (mobile UI primitives: Tabs, Sheet, TopBar, PageLoader…)
- Any logic fix in `../src` automatically ships to the app on the next build.

## Building

```bash
cd sla_lms/mobile
npm install            # once
npm run build          # Vite -> dist/
npx cap sync android   # copy dist/ into the Android project
```

Then build the APK. This repo pins Gradle 8.14.3 + AGP 8.13.0, which need **JDK ≤ 21**
(Android Studio's bundled `jbr` is Java 25 and Gradle 8 rejects class-file v69):

```bash
export JAVA_HOME="$PWD/tools/jdk-21.0.12.1+1"   # Temurin 21, already vendored in tools/ (gitignored)
cd android
../tools/jdk-21.0.12.1+1/bin/java.exe -jar ...  # or simply:
gradle assembleDebug                            # any Gradle 8.14.3 on PATH, or the wrapper
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

> `tools/` is gitignored — if it's missing, download any Temurin JDK 21 and point `JAVA_HOME` at it.

### Release build

Add a signing config in `android/app/build.gradle` (keystore not committed), then run `assembleRelease`.

## Android app identity

- Package: `com.sheleadsafrica.mobile`, label **"She Leads Africa"**
- minSdk 24 (Android 7.0) / target+compileSdk 36
- Launcher icons + splash screens (portrait/landscape, day/night) generated from the SLA logo via `@capacitor/assets`

## Regenerating brand assets

After changing the logo (`assets/icon.png`, `assets/splash.png`):

```bash
cd mobile && npx @capacitor/assets generate --android
```
