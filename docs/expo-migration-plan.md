# CanisQuest: native iOS and Android apps with Expo

Status legend: `[x]` done, `[~]` partly done, `[ ]` not started.

Target: **Expo SDK 58** (React Native 0.88, React 19.3, Expo Router 58, Node >= 22.13). I checked `npm view expo dist-tags` (`latest` = 58.0.23) and https://docs.expo.dev/versions/latest/ on 2026-11-06.

## 1. Inventory of the current (Next.js) app

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

## 2. Requirements (revised 2026-11-06)

- **The Next.js site stays the web app.** It keeps its UI, server actions and Firebase App Hosting deploy. There is no Expo web build and no web cut-over.
- **The Expo app targets iOS and Android only.**
- **One Firebase project** (Auth, Firestore, Storage) for both apps. Both read and write the same documents, so a capture made on a phone shows up on the web for the same account, and vice versa.
- **The phones call a Next.js route handler** for Gemini (`POST /api/identify`). The Gemini key never ships in the app.

## 3. Architecture

```
            Firebase project (Auth, Firestore, Storage)
              ▲                                   ▲
   JS SDK     │                                   │   JS SDK (native: AsyncStorage persistence)
              │                                   │
  Next.js app (repo root)                 Expo app (apps/mobile), iOS + Android
  - web UI + server actions (unchanged)   - Expo Router, NativeTabs
  - POST /api/identify  ◀──── HTTPS, Bearer Firebase ID token ────
      └─ Genkit prompt → Gemini 2.5 Flash (GEMINI_API_KEY, server only)
  Deployed on Firebase App Hosting
```

### Next.js: `POST /api/identify`
- **File:** `src/app/api/identify/route.ts`. The mobile app calls this; the web UI doesn't use it.
- **Request:** header `Authorization: Bearer <Firebase ID token>`, JSON body `{ imageBase64, mimeType }`.
- **Response:** `{ breedName, isMixed, confidence, rarity, candidateBreeds }`.
- **Errors:**
  - 401: missing or invalid token.
  - 400: bad body or unsupported MIME type.
  - 413: image larger than about 7.5 MB.
  - 500: `GEMINI_API_KEY` or the project ID missing.
  - 502: Gemini failed.
- **Gemini call:** uses the **existing Genkit prompt**, moved unchanged into `src/ai/identify-dog-breed-prompt.ts` so the server action and the route share one definition.
  - The web flow (`src/ai/flows/identify-dog-breed-from-image.ts`) keeps its catch-all "Mixed Breed" fallback, so **web behaviour is unchanged**.
  - The route calls `identifyDogBreedStrict`, which lets Genkit errors through. A missing or invalid key, quota or network failure becomes a 502, never "Mixed Breed".
  - Only an empty model answer still falls back, as on the web.
- **Token check:** `src/lib/server/verify-firebase-token.ts` uses `jose` against Google's securetoken JWKS. The issuer and audience are the project ID: `FIREBASE_PROJECT_ID`, else `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
- **Local testing:**
  - `FIREBASE_AUTH_EMULATOR_HOST` makes the route accept the Auth emulator's unsigned tokens. The project then defaults to `demo-canisquest`.
  - `GEMINI_MOCK=1` returns a fixed Labrador result.
  - **Both are ignored when `NODE_ENV=production`**, so a deployed server can't be tricked by them.
- **Tests:** `npm test` (vitest, new) runs the route contract, token verification, and prompt normalisation and strict-error behaviour.

### Expo app (`apps/mobile`)
- **Stack:** Expo SDK 58, Expo Router with `NativeTabs`, and the Firebase JS SDK. Auth persists in AsyncStorage.
- **Photos:** `expo-image-picker` and `expo-image-manipulator` (at most 1280 px wide, JPEG quality 0.7). Uploads build the Blob with XHR from the local file, because `fetch(file://)` stored a 14-byte body on Android.
- **Styling:** inline styles from a typed theme (`src/theme.ts`, the web app's dark palette), Poppins, lucide icons. NativeWind is deferred until v5 is stable.
- **API URL:** the app calls `${EXPO_PUBLIC_API_URL}/api/identify`. In development, if that is unset, it uses the Metro host on port 9002, the Next dev server.
- **Dead sessions:** if the persisted session is no longer valid (user deleted or disabled, or the emulator was reset), the app starts a fresh guest session instead of getting stuck "offline".
- **No web code:** no web output, no `.web.*` files, no `react-native-web`/`react-dom`.

### Hosting
- **Firebase App Hosting** for the Next app, exactly as today. It now also serves `/api/identify`.
- **Config:** App Hosting needs `GEMINI_API_KEY`, which the server action already uses, and the `NEXT_PUBLIC_FIREBASE_*` values, which the route reads for the project ID. Nothing new is required. Optionally set `FIREBASE_PROJECT_ID`.
- **Native builds:** set `EXPO_PUBLIC_API_URL` to the App Hosting domain.
- **Store builds:** EAS Build/Submit for the App Store and Play Store. No server hosting is needed for the Expo app.

### Duplicated logic: now permanent, so plan to centralise it
Both clients write the same Firestore documents: entries, XP and level, achievements and public profiles. The progression rules exist twice:
- web: `ReviewForm.tsx`
- mobile: `apps/mobile/src/lib/progression.ts`, unit tested

Achievement definitions (`data.ts`) and breed translations are also copied.

Recommended next step: move the save into a Next route (`POST /api/captures`, Admin SDK) that both clients call. That removes the duplication, and stops clients writing arbitrary XP. Until then, any rule change must be made in both places.

## 4. Tracer slice

> The iOS or Android app signs in anonymously and you pick a photo. The app resizes it and sends it with an ID token to the **Next** `/api/identify` route (Genkit, mocked locally). The photo is uploaded to Storage, the entry is saved with XP, level and achievements in Firestore, and it appears in the Collection.

Status: `[x]`
- **iOS:** simulator, Expo Go, driven by Maestro through the real photo picker.
- **Android:** emulator, Expo Go, the dev smoke route.
- Both ran against the Next dev server and the Firebase emulators. See section 7.

## 5. Increments

1. `[x]` **Tracer** (above).
2. `[x]` **Review and edit capture:** breed with AI alternatives, nickname, notes, favourite, "New breed / +XP" reveal.
3. `[x]` **Entry detail:** favourite toggle, two-step delete (Storage plus doc).
4. `[x]` **Collection:** search, favourites and rarity filters, empty states.
5. `[x]` **i18n en/es**, with a key-parity test.
6. `[~]` **Settings:** language, account status, collector name, sign out.
   - Google sign-in is not available on native yet, and the app says so.
   - Collector-name reservation needs a non-guest account, so it isn't exercised end to end.
7. `[x]` **Stats.**
8. `[x]` **Achievements.**
9. `[x]` **Ranking.**
10. `[x]` **Onboarding.**
11. `[ ]` **Native Google sign-in:** `@react-native-google-signin/google-signin` (dev build) or `expo-auth-session`. Then `linkWithCredential` so a guest collection is kept, and `signInWithCredential` to reach an existing web account. Needs iOS and Android OAuth client IDs.
12. `[ ]` **Shared capture endpoint:** `POST /api/captures` in Next with the Admin SDK (section 3). Use it from both clients, and fix the existing delete bug (counters aren't decremented) there.
13. `[ ]` **App identity and stores:** `ios.bundleIdentifier` / `android.package`, icons, splash, EAS project, `eas.json`, TestFlight and an internal Play track.
14. `[ ]` **Hardening:**
    - Commit the real Firestore and Storage rules.
    - Rate-limit `/api/identify`.
    - App Check (needs a dev build with `@react-native-firebase/app-check`, or the JS SDK's custom provider).
15. `[ ]` **Polish:** capture and reveal animations, haptics, iOS context menus, skeletons, optional location capture.

The web cut-over items from the previous version of this plan (Expo web build, PWA, `/collection` redirect, EAS Hosting / Cloud Run) are **dropped**.

## 6. What Dario (or the repo owner) must supply

- `apps/mobile/.env` (see `.env.example`):
  - `EXPO_PUBLIC_FIREBASE_*`: the same values as the web app's `NEXT_PUBLIC_FIREBASE_*`.
  - `EXPO_PUBLIC_API_URL`: the App Hosting domain for builds, or `http://127.0.0.1:9002` locally.
- Next app env: the existing `NEXT_PUBLIC_FIREBASE_*` and `GEMINI_API_KEY`. Nothing new.
- **Firebase console:** check that the production rules allow what both apps do (compare with `apps/mobile/firestore.rules`).
- **Native Google sign-in:** register iOS and Android apps in Firebase and create OAuth client IDs.
- **Stores:** Apple Developer and Google Play accounts and an EAS project.

## 7. Verification log (2026-11-06)

All runs used the local Firebase emulators (`demo-canisquest`) and `GEMINI_MOCK=1`. **No run used the real Firebase project or a real Gemini key.** The live Genkit path is covered by unit tests with a stubbed prompt. A probe confirmed that Genkit throws on a missing or invalid key, which is what lets the route return 502.

**Next app** (repo root):

- `npm ci`, then `npx tsc --noEmit`. **Already failing on `main`** with 10 errors in `entry/[id]/page.tsx`, `stats/page.tsx`, `DogCard.tsx`, `ui/calendar.tsx` and the Genkit flow. Now 9: the flow error went away with the refactor, and no new errors were added.
- `npm run build` passes, as it did on `main` (`ignoreBuildErrors` is set).
  - New: a webpack "Critical dependency" warning from Genkit's OpenTelemetry, because the route handler bundles Genkit. `main` builds without it.
  - It is only a warning. If it bothers anyone, add Genkit to `serverExternalPackages`.
- `npm test` (vitest) passes 14 tests in 3 files.
- **Dev server** (`npm run dev`, port 9002) with `curl`:
  - no token gives 401
  - a malformed token gives 401
  - no image gives 400
  - an emulator token plus an image gives 200 (mock)
  - `/` gives 200
- **Production server** (`next start`):
  - the route loads, including Genkit init
  - no token gives 401
  - **an emulator token is rejected (401) even with `FIREBASE_AUTH_EMULATOR_HOST` and `GEMINI_MOCK` set**
  - `/`, `/collection` and `/capture` give 200

**Expo app** (`apps/mobile`):
- `npx tsc --noEmit` is clean.
- `npx jest` passes 8 tests in 5 suites.
- `npx expo-doctor` passes 20/20 checks.
- **iOS:** simulator `canisquest-ios` (iOS 27.0) with Expo Go 58.0.7, driven by Maestro.
  - Capture tab, Upload File, the system photo picker, then a tap on the photo.
  - The review showed Labrador Retriever at 92%, served by the **Next** route.
  - Nickname entered, Save, "New Breed! +3 XP", then the entry in the Collection.
  - Firestore had the entry, the user had `xp 3` and `totalCaptures 1`, and the photo in Storage was 20,441 bytes.
  - Repeated after removing Expo web, including the new Settings notice.
- **Android:** emulator `canisquest_api36` with Expo Go 58.0.5, using `adb reverse` for 8097, 9002, 9099, 8080 and 9199.
  - The `/dev/smoke` route printed `SMOKE PASS`: resize, then Next `/api/identify` (200), then Storage and the Firestore transaction.
  - The Collection showed the photo.
  - The first attempt exposed the dead-session hang, which is now fixed.

## 8. Running it

```bash
# Next app (web + API), repo root
npm ci
npm run dev                                   # http://localhost:9002
npm test && npm run build

# Expo app
cd apps/mobile
npm install
cp .env.example .env                          # Firebase values + EXPO_PUBLIC_API_URL
npx expo start                                # i = iOS simulator, a = Android, or scan with Expo Go
npm run typecheck && npm test
```

**Local emulator mode** (no real project or key):

```bash
npx firebase-tools@15 emulators:start --only auth,firestore,storage --project demo-canisquest   # in apps/mobile, JDK 21+
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GEMINI_MOCK=1 npm run dev                           # repo root
# apps/mobile/.env:
#   EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1
#   EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
#   EXPO_PUBLIC_API_URL=http://127.0.0.1:9002
```

- **Android emulator:** run `adb reverse tcp:<port> tcp:<port>` for 8081, 9002, 9099, 8080 and 9199.
- **Native smoke test** (development builds only): open `<metro-url>/--/dev/smoke` in Expo Go.
