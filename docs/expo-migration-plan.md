# CanisQuest: native iOS and Android apps with Expo

Status legend: `[x]` done, `[~]` partly done, `[ ]` not started.

Target: **Expo SDK 58** (React Native 0.88, React 19.3, Expo Router 58, Node >= 22.13). I checked `npm view expo dist-tags` (`latest` = 58.0.23) and https://docs.expo.dev/versions/latest/ on 2026-11-06.

## 1. Inventory of the current (Next.js) app

### Stack
- Next.js 15.5 (app router, turbopack), React 19.2, Tailwind 3 with shadcn/Radix UI, framer-motion, lucide-react, zustand, react-hook-form with zod.
- Firebase JS SDK 11 (Auth, Firestore, Storage). The config comes from `NEXT_PUBLIC_FIREBASE_*` env vars in `src/lib/firebase.ts`. No `.env` is committed, and no `firebase.json` or `firestore.rules` is in the repo, so the rules live only in the Firebase console.
- Genkit 1.20 with `@genkit-ai/google-genai` and model `googleai/gemini-2.5-flash`. The plugin reads `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) from the server env.
- Hosted on **Vercel** (`dogdex-seven.vercel.app`), with Vercel Analytics and a PWA manifest. The repo still has an `apphosting.yaml` (Firebase App Hosting, maxInstances 1), but App Hosting is not used: its API was never enabled on the project, and Firebase Auth's authorized domains are `dogdex-seven.vercel.app` plus the Firebase defaults (checked 2026-11-11).
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
- Vercel (hosting and Analytics).

## 2. Requirements (revised 2026-11-06)

- **The Next.js site stays the web app.** It keeps its UI, server actions and Vercel deploy. There is no Expo web build and no web cut-over.
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
  Deployed on Vercel (dogdex-seven.vercel.app)
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
- **Development build required:** Google sign-in is a native module, so the app no longer runs in Expo Go. Use `npx expo run:ios` / `run:android` (or `npm run ios` / `android`) locally, or an EAS development build.

### Native Google sign-in
The goal: a user who signs in with Google in the app gets the **same Firebase UID** as on the web, so the same profile and collection.

- **Library:** `@react-native-google-signin/google-signin` 17 (the free version). It is one of the two libraries in Expo's Google authentication guide, ships as an Expo module with a config plugin (`iosUrlScheme`), and installs cleanly on SDK 58 (`expo-doctor` 20/20). It returns a Google **ID token**, which the Firebase JS SDK accepts through `GoogleAuthProvider.credential(idToken)`, so we keep the JS SDK and don't need `@react-native-firebase` or the Firebase config files.
  - Trade-off: on Android the free version wraps Google's legacy Sign-In SDK (deprecated but working). The other library in Expo's guide, `react-native-nitro-google-signin`, uses Android Credential Manager for free, but it is newer (June 2026, about 130k weekly downloads against about 1.7M) and adds `react-native-nitro-modules`. If Google removes the legacy SDK, switch to it: only `src/lib/google-signin.ts` and the plugin entry in `app.json` would change.
- **Flow** (`src/lib/google-signin.ts`, `src/lib/google-auth.ts`, `signInWithGoogle` in `src/lib/auth.tsx`), the same as the web's `AuthContext.signInWithGoogle`:
  1. Show the native Google sheet and get the ID token. Cancelling does nothing.
  2. Guest (anonymous): `linkWithCredential`. The UID and its collection are kept.
  3. `auth/credential-already-in-use` (the Google account already has a Firebase user, e.g. from the web): `signInWithCredential` with the credential from the error, so the user lands in that existing account. **The guest's captures are not migrated** (open issue #7), as on the web.
  4. `createUserProfile` writes `authProvider: 'google'`, email, name and photo, as on the web.
  5. Sign out also clears the native Google session, so the account picker shows next time.
- **Firebase project `dogdex-d6dcf`** (registered 2026-11-11):

  | | Bundle ID / package | Firebase app ID |
  |---|---|---|
  | iOS | `com.canisquest.app` | `1:554469466347:ios:ae7f9dc027da34255d9eae` |
  | Android | `com.canisquest.app` | `1:554469466347:android:15856b71c8016d2f5d9eae` |

- **OAuth clients** (created by Firebase; Google Cloud console > APIs & Services > Credentials):
  - **Web client** `554469466347-mbibbn8qf7rhv29e48d98iq66ojvk6nb.apps.googleusercontent.com`. Passed as `webClientId`: it is the audience of the ID token, which Firebase Auth accepts.
  - **iOS client** `554469466347-1u7bas7fo0pv8rb5qrv7q0iddq7eoghg.apps.googleusercontent.com`. Passed as `iosClientId`. Its reversed form, `com.googleusercontent.apps.554469466347-1u7bas7fo0pv8rb5qrv7q0iddq7eoghg`, is the `iosUrlScheme` in `app.json`.
  - **Android client** `554469466347-0hls4fs8o7i5llnpr33f3ftkogg0v4c5.apps.googleusercontent.com`, tied to the package and the **debug keystore SHA-1** of Dario's machine (`~/.android/debug.keystore`). The app never references it: Google matches it by package name and signing certificate. Another developer's debug build needs their own SHA-1 added in Firebase (Project settings > Your apps > Android > Add fingerprint; `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`).
- **Config:** the client IDs are public identifiers, so they are in the code (`src/lib/google-signin.ts`, overridable with `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`) and `app.json`. **No `GoogleService-Info.plist` or `google-services.json` is needed.** If you want them anyway (e.g. to adopt `@react-native-firebase` later), download them from Firebase console > Project settings > Your apps; they are gitignored in `apps/mobile`.
- **Release builds:** Android release/EAS builds are signed with a different key, so Google sign-in fails with `DEVELOPER_ERROR` until that key's SHA-1 is added to the Android app in Firebase: the EAS keystore SHA-1 (`eas credentials`), and for Play Store builds also the **Play App Signing** SHA-1 (Play Console > Setup > App signing). iOS needs nothing extra.

### Hosting
- **Vercel** hosts the Next app (`https://dogdex-seven.vercel.app`), exactly as today. It now also serves `/api/identify`. Firebase App Hosting is **not** used, despite the `apphosting.yaml` in the repo (see section 1).
- **Vercel env vars:** `/api/identify` needs `GEMINI_API_KEY` and the `NEXT_PUBLIC_FIREBASE_*` values (the route reads the project ID from `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, or from `FIREBASE_PROJECT_ID` if set). The web's server action already needs the same ones. Check that they are set for the Production environment in the Vercel project, then redeploy.
- **Native builds:** set `EXPO_PUBLIC_API_URL=https://dogdex-seven.vercel.app`.
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
6. `[x]` **Settings:** language, account status, Google sign-in, collector name, sign out.
   - Collector-name reservation needs a non-guest account, so it is only exercised after a real Google sign-in.
7. `[x]` **Stats.**
8. `[x]` **Achievements.**
9. `[x]` **Ranking.**
10. `[x]` **Onboarding.**
11. `[~]` **Native Google sign-in** (section 3): built, and the native Google sheet opens on iOS. Waiting for Dario's real sign-in test against production (section 8). Release builds need the EAS / Play signing SHA-1 added in Firebase.
12. `[ ]` **Shared capture endpoint:** `POST /api/captures` in Next with the Admin SDK (section 3). Use it from both clients, and fix the existing delete bug (counters aren't decremented) there.
13. `[~]` **App identity and stores:** `ios.bundleIdentifier` / `android.package` are `com.canisquest.app` (done). Still to do: icons, splash, EAS project, `eas.json`, TestFlight and an internal Play track, and the release SHA-1s for Google sign-in.
14. `[ ]` **Hardening:**
    - Commit the real Firestore and Storage rules.
    - Rate-limit `/api/identify`.
    - App Check (needs a dev build with `@react-native-firebase/app-check`, or the JS SDK's custom provider).
15. `[ ]` **Polish:** capture and reveal animations, haptics, iOS context menus, skeletons, optional location capture.

The web cut-over items from the previous version of this plan (Expo web build, PWA, `/collection` redirect, EAS Hosting / Cloud Run) are **dropped**.

## 6. What Dario (or the repo owner) must supply

- `apps/mobile/.env` (see `.env.example`):
  - `EXPO_PUBLIC_FIREBASE_*`: the same values as the web app's `NEXT_PUBLIC_FIREBASE_*`.
  - `EXPO_PUBLIC_API_URL`: `https://dogdex-seven.vercel.app` for builds, or `http://127.0.0.1:9002` locally.
- Next app env: the existing `NEXT_PUBLIC_FIREBASE_*` and `GEMINI_API_KEY`. Nothing new.
- **Firebase console:** check that the production rules allow what both apps do (compare with `apps/mobile/firestore.rules`).
- **Native Google sign-in:** done for development (section 3). For release builds, add the EAS and Play App Signing SHA-1s to the Android app in Firebase.
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

### 2026-11-11: native Google sign-in

Again against the local emulators with `GEMINI_MOCK=1`, except where noted. **No real Google account was used.**

- `npx tsc --noEmit` is clean. `npx jest` passes 13 tests in 6 suites (new: `google-auth.test.ts`, the link / already-in-use / fallback / rethrow / no-guest paths).
- `npx expo-doctor@1.21.6` passes 20/20. (`expo-doctor@latest`, 1.21.7 published that morning, crashes with `Cannot find module '@expo/env'`: an upstream packaging bug, not this project.)
- Next app: `npm test` passes 14 tests in 3 files.
- **iOS development build** (`npx expo run:ios`, simulator `canisquest-ios`), driven by Maestro:
  - capture flow: Upload File, photo picker, review (Labrador Retriever 92% from the Next route), Save, reveal, and the entry in the Collection;
  - Settings shows "Continue with Google" (and "Continuar con Google" in Spanish);
  - tapping it shows the iOS "wants to use accounts.google.com to sign in" prompt, then Google's "Sign in to continue to DogDex" page, so the iOS client ID and URL scheme are accepted;
  - closing the sheet returns to Settings, still a guest, with no error.
- **Android development build** (`npx expo run:android`, emulator `canisquest_api36`, driven with `adb`): "Continue with Google" opens Google Play services' sign-in. The emulator has no Google account, so it shows Android's add-account screen; backing out returns to Settings with no error. Whether the debug SHA-1 matches can only be confirmed by completing a sign-in (a mismatch shows `DEVELOPER_ERROR`).
- **Not tested:** completing a Google sign-in, linking, `credential-already-in-use`, and collector-name reservation. Dario does this against production (section 8).

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
npx expo run:ios                              # or run:android; a development build, see below
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
- **Native smoke test** (development builds only): open `<metro-url>/--/dev/smoke` in the app.

**Development build** (needed since Google sign-in; Expo Go no longer works):

```bash
cd apps/mobile
npx expo run:ios                 # builds ios/ (gitignored), installs on a simulator and starts Metro
npx expo run:android             # same for Android (JDK 17)
# Later, JS-only changes: npx expo start, then open the installed CanisQuest app
```

**Real Google sign-in test against production** (Dario):

1. `apps/mobile/.env.production-firebase` (gitignored, never commit) holds the production `EXPO_PUBLIC_FIREBASE_*` for `dogdex-d6dcf`, `EXPO_PUBLIC_API_URL=https://dogdex-seven.vercel.app` and `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=0`. To recreate it, copy the web app's `NEXT_PUBLIC_FIREBASE_*` from Vercel or Firebase console > Project settings > Your apps > Web app.
2. `cd apps/mobile && cp .env.production-firebase .env.local` (`.env.local` overrides `.env`; delete it to go back to the emulators).
3. `npx expo run:ios` (or `npx expo start --clear` if the dev build is already installed). Android: `npx expo run:android` on a device or emulator signed with the debug keystore whose SHA-1 is in Firebase, with a Google account on it.
4. **Same account as the web:** first sign in with Google at https://dogdex-seven.vercel.app and note the collection. In the app, as a guest, open Settings > Continue with Google and pick the same account. The app signs into that existing account (`credential-already-in-use`): Settings shows your name, and Collection, Stats and Ranking show the web collection. The UIDs must match: Firebase console > Authentication > Users should still list a single Google user for that email.
5. **Linking a new account:** with a Google account that has never used CanisQuest, capture a dog as a guest, then Continue with Google. The capture stays (same UID, now with the Google provider in Firebase console > Authentication). Then sign in on the web with that account: the capture is there.
6. Set a collector name in Settings, and check that it shows in Ranking on both apps.
7. Sign out: the app starts a new guest session. Delete `.env.local` when done.

If Google shows `DEVELOPER_ERROR` on Android, the build's signing SHA-1 is not registered (section 3). On iOS, an `invalid_audience` or similar error from Firebase means the `webClientId` doesn't belong to the project.
