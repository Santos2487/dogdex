# CanisQuest: migration from Next.js to Expo

Status legend: `[x]` done, `[~]` partly done, `[ ]` not started.

Target: **Expo SDK 58** (React Native 0.88, React 19.3, Expo Router 58, Node >= 22.13). I checked `npm view expo dist-tags` (`latest` = 58.0.23) and https://docs.expo.dev/versions/latest/ on 2026-11-06.

## 1. Inventory of the current app

### Stack
- Next.js 15.5 (app router, turbopack), React 19.2, Tailwind 3 with shadcn/Radix UI, framer-motion, lucide-react, zustand, react-hook-form with zod.
- Firebase JS SDK 11 (Auth, Firestore, Storage). The config comes from `NEXT_PUBLIC_FIREBASE_*` env vars in `src/lib/firebase.ts`. No `.env` is committed, and no `firebase.json` or `firestore.rules` is in the repo, so the rules live only in the Firebase console.
- Genkit 1.20 with `@genkit-ai/google-genai` and model `googleai/gemini-2.5-flash`. The plugin reads `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) from the server env.
- Firebase App Hosting (`apphosting.yaml`, maxInstances 1), Vercel Analytics, PWA manifest.
- The theme is forced dark (`<html className="dark">`): background `#0C0A09`, primary yellow `hsl(45 100% 58%)` (about `#FFC72C`), accent orange `#FF934F`, and the Poppins font at weights 400, 600 and 700. The light palette (`#FAF8E7` background) is defined but unused.

### Screens (`src/app`)
| Route | What it does |
|---|---|
| `/` | Onboarding carousel (3 steps) on first visit. A localStorage flag records completion, then the page redirects to `/collection`. |
| `/collection` | Live Firestore list of the user's entries. Search by breed or nickname, filter by all or favourites and by rarity, 2-4 column grid of `DogCard`s, empty state. |
| `/capture` | "Take photo" (file input with `capture=environment`) or "Upload file". The photo is read to a data URI and kept in a zustand store. |
| `/analyzing` | Calls the `identifyDogBreed` **server action** (Genkit and Gemini), then routes to `/review`. On error it shows a toast and goes back to `/capture`. |
| `/review` | `ReviewForm`: photo, AI confidence, rarity, editable breed, nickname, notes and favourite. On save it uploads the image to Storage, then runs a Firestore transaction (entry, XP, level, counters, achievements, public profile). Shows a "New breed / +XP" reveal. |
| `/entry/[id]` | Entry detail: date, confidence, rarity, favourite. Toggle favourite. Delete removes the Storage object and the entry doc (counters are **not** decremented). |
| `/stats` | Profile header, level and XP progress, totals, favourite and mixed percentages, top 3 breeds, rarity breakdown, link to badges. |
| `/badges` | Achievements from `users/{uid}/achievements`: unlocked first, progress bars. |
| `/ranking` | `publicProfiles` collection, with tabs that sort by XP, captures or breeds. |
| `/settings` | Language (en/es, persisted in zustand), account status, Google sign-in (links the anonymous account), sign out, one-time unique trainer name (`trainerNames/{lower}` reservation transaction plus `publicProfiles/{uid}`). |

`src/app/actions.ts` (`saveCapture`, `deleteCapture`, `toggleFavorite`) is **dead code**: nothing imports it, and the client does the writes directly. Of the four Genkit flows, only `identify-dog-breed-from-image.ts` is used.

### Data model (Firestore)
- `users/{uid}`: `uid, createdAt, authProvider ('anonymous'|'google'), level, xp, totalCaptures, uniqueBreedsCount, trainerName?, trainerNameLower?, trainerNameSetAt?, email?, displayName?, photoURL?, updatedAt?`
- `users/{uid}/entries/{uuid}`: `photoUrl, breedName, name?, notes?, favorite, rarity ('Common'|'Uncommon'|'Rare'), isMixed, confidence (0-1), capturedAt, userId, aiProvider: 'gemini'`
- `users/{uid}/achievements/{id}`: `id, title{en,es}, description{en,es}, target, metric, unlocked, progress, unlockedAt`. These docs are seeded from `initialAchievements` (15 entries) when a user is created.
- `trainerNames/{lower}`: `uid, trainerName, trainerNameLower, createdAt`
- `publicProfiles/{uid}`: `uid, trainerName, level, xp, totalCaptures, uniqueBreedsCount, updatedAt`
- Storage: `users/{uid}/entries/{entryId}.jpg`
- XP rules: +1 per capture, +2 for a new breed, +1 for Rare. Level curve: level 1 needs 10 XP, then `10 * level` per level (`getLevelFromXp`).

### External services
- Firebase Auth: anonymous sign-in on first launch, and Google (popup on web, linked to the anonymous account).
- Firestore and Cloud Storage, as above.
- Gemini 2.5 Flash through Genkit, on the server only, using `GEMINI_API_KEY`.
- Vercel Analytics and Firebase App Hosting.

## 2. Target architecture and decisions

### Structure: a new app in `apps/mobile`, with Next left in place
- **Decision:** a standalone Expo app in `apps/mobile`, with its own `package.json` and lockfile. There are no npm workspaces.
- **Why:** the Next app keeps building and deploying from the repo root, untouched, until the Expo app reaches parity. Keeping two separate dependency trees avoids React and React Native hoisting clashes: Next is on React 19.2 and Expo 58 pins React 19.3. The root `tsconfig.json` excludes `apps/` so the Next typecheck ignores the RN code.
- **At parity:** delete the Next code, then either move `apps/mobile` to the root or keep the monorepo layout. Pure logic (levels, achievements, rarity, translations) was **copied** into `apps/mobile/src/lib` rather than shared, because the Next copy will be deleted.

### Firebase: the JS SDK, not `@react-native-firebase`
- **Decision:** `firebase` JS SDK v13 on native and web.
- **Why:** it runs in Expo Go and on web with no native build. It is the same API the current code uses, so the queries and transactions port almost line for line. It needs no `GoogleService-Info.plist` or `google-services.json` for the tracer.
- **Native auth persistence:** `initializeAuth` with `getReactNativePersistence(AsyncStorage)` (`@react-native-async-storage/async-storage`, which is in Expo Go). Web uses the default IndexedDB persistence.
- **Uploads:** `uploadBytes(ref, await (await fetch(localUri)).blob())`. `uploadString(data_url)` is unreliable on React Native.
- **Revisit** `@react-native-firebase` only if we need things the JS SDK lacks on native, such as Crashlytics, native Google sign-in or App Check with DeviceCheck/Play Integrity. Each of those would need a dev build.
- **Emulators:** `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1` connects to local Auth, Firestore and Storage emulators (`apps/mobile/firebase.json`, project `demo-canisquest`), so you can test end to end without touching production data.

### Gemini: an Expo API route
- **Decision:** `apps/mobile/src/app/api/identify+api.ts` (`POST /api/identify`) calls the Gemini REST API (`generateContent` with a JSON response schema) with `fetch`. The prompt is ported from the Genkit flow.
- **Why:** the key (`GEMINI_API_KEY`, server env only, never `EXPO_PUBLIC_`) stays on the server. Plain `fetch` with no Genkit runtime works on EAS Hosting (Cloudflare Workers) and on any Node host via `expo export` with `@expo/server`.
- **Auth:** the route requires `Authorization: Bearer <Firebase ID token>`. It verifies the token with `jose` against Google's securetoken JWKS (issuer and audience = the Firebase project ID). Today's server action is effectively public, so this is stricter than the current app.
- **Local dev without a key:** `GEMINI_MOCK=1` (server only) returns a fixed "Labrador Retriever" result, so you can exercise the flow. It is off by default.
- **Native client:** calls `${EXPO_PUBLIC_API_URL}/api/identify`. In development the URL falls back to the Metro host (`Constants.expoConfig.hostUri`), and on web it is same-origin.
- **Rejected alternatives:**
  - Gemini in the client: this ships the key.
  - Firebase AI Logic / Vertex AI in Firebase from the client: viable with App Check, but it needs console setup that only the owner can do.
  - Keeping Next as an API: two servers.

### Styling: a typed theme with StyleSheet and inline styles (NativeWind deferred)
- **Decision:** `src/theme.ts` holds the tokens taken from `globals.css` (dark palette, radius, spacing, Poppins via `@expo-google-fonts/poppins`). Components use inline styles, following the Expo UI guidelines.
- **Why not NativeWind now:**
  - NativeWind v5 for Tailwind 4 is still `5.0.0-rc.1` and needs a pinned `react-native-css` nightly.
  - NativeWind v4 targets Tailwind 3 and older Reanimated, and is unverified on RN 0.88.
  - Most of the existing class strings are shadcn/Radix composition that does not port anyway.
- **Revisit** NativeWind once v5 is stable. The tokens map directly onto `@theme` variables.
- **Radix/shadcn replacements:**
  - Card, Badge and Button: small RN components in `src/components/ui`.
  - Switch: RN `Switch`.
  - Tabs: a segmented row.
  - Toast: `Alert` on native, inline error text on web.
  - Carousel: horizontal paging `ScrollView`.
  - Progress: a View bar.
  - Skeleton: `ActivityIndicator`.
- **Icons:** `lucide-react-native` plus `react-native-svg`, so the icons match the current app on iOS, Android and web.

### Navigation
- Expo Router.
- **Root stack:** `(tabs)`, `analyzing`, `review`, `entry/[id]`, `badges`, `onboarding`.
- **Tabs:** `NativeTabs` on iOS and Android; on web, a custom bottom bar built with `expo-router/ui` (`app-tabs.web.tsx`), as in the SDK 58 template.
- **Tab list:** Collection (`/`), Stats, Capture, Ranking, Settings.

### Capture
- `expo-image-picker`: camera or library, works in Expo Go.
- `expo-image-manipulator` resizes the photo to 1280 px wide JPEG at quality 0.7 before upload and analysis (the current app sends full-size images).
- zustand capture store (same shape as today).

## 3. Tracer slice (first end-to-end bullet)

> Expo app boots (web plus iOS bundle), signs in anonymously with Firebase, picks a photo, sends it with an ID token to `/api/identify` (Gemini on the server), uploads it to Storage, saves the entry with the progression transaction to Firestore, and shows it in the live Collection list.

Status: `[ ]`

## 4. Increments (in order)

1. `[ ]` **Tracer:** boot, theme and Poppins, anonymous auth plus profile and achievement seeding, capture (picker and resize), `/api/identify` with ID-token check, minimal review (breed editable), save (Storage plus Firestore transaction with XP, level and achievements), live collection list.
2. `[ ]` **Review and edit capture, full form:** nickname, notes, favourite switch, confidence and rarity display, "New breed / +XP" reveal.
3. `[ ]` **Entry detail:** photo, date, confidence, rarity, toggle favourite, delete (Storage plus doc, with confirmation).
4. `[ ]` **Collection filters:** search, all or favourites, rarity chips, empty and no-results states, 2-column grid.
5. `[ ]` **i18n:** en/es with the `t` tables moved to `src/lib/i18n.ts`, a persisted language store (AsyncStorage) and breed translations.
6. `[ ]` **Settings:** language, account status, trainer name reservation, sign out. **Google sign-in is web only** for now (`signInWithPopup` / `linkWithPopup`). On native the button explains that it is not available yet (see open decisions).
7. `[ ]` **Stats:** profile header, level progress, stat cards, top breeds, rarity breakdown.
8. `[ ]` **Achievements** (`/badges`).
9. `[ ]` **Ranking** (`publicProfiles`, sort by XP, captures or breeds).
10. `[ ]` **Onboarding:** 3-step pager, AsyncStorage flag, redirect.
11. `[ ]` **Native Google sign-in:** `expo-auth-session` / `@react-native-google-signin` with `signInWithCredential` plus link. Needs iOS/Android OAuth client IDs, and the latter needs a dev build.
12. `[ ]` **App identity:** icons, splash, bundle IDs (`ios.bundleIdentifier`, `android.package`), EAS project, `eas.json`.
13. `[ ]` **Deploy:** EAS Hosting for the web build and API routes (`eas deploy`) or another host, `EXPO_PUBLIC_API_URL` for native builds, then switch the domain away from Firebase App Hosting.
14. `[ ]` **Hardening:** Firestore and Storage rules in the repo, deleting a capture decrements counters and achievements (an existing bug in the Next app), move the progression transaction behind a server endpoint (Admin SDK) so clients cannot write arbitrary XP, App Check.
15. `[ ]` **Polish:** reveal and capture animations (Reanimated), haptics, link previews and context menus on iOS, location capture (in the blueprint, never built), PWA manifest for the Expo web build, analytics.
16. `[ ]` **Cut-over:** remove the Next app, move `apps/mobile` up (optional), update the README and CI.

## 5. What Dario must supply

`apps/mobile/.env` (copy from `.env.example`). The values are the same ones the Next app reads as `NEXT_PUBLIC_FIREBASE_*`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
# server only, never EXPO_PUBLIC_
GEMINI_API_KEY=
```

Other things only the owner can provide:
- **Firebase console:** anonymous auth enabled (it already is, since the current app depends on it), and the web app's authorised domains (add `localhost` if it is missing).
- **Native Google sign-in:** iOS and Android OAuth client IDs, which means registering iOS and Android apps in the Firebase project.
- **EAS:** account and project ID if we deploy with EAS.

## 6. Verification log

See the bottom section, which is updated after each increment.
