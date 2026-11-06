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

## 2. Requirements

- **One codebase for Android, iOS and web.** Web is not optional, because existing users of the current site must keep using it.
- **The Expo web build replaces the Next.js site** at the same domain, on the same Firebase project, with the same users, auth sessions and captures. There is no data migration.
- **The PWA stays installable:** same manifest, icons and theme colour.
- **The Next app stays live** until the Expo web build reaches parity.

## 3. Target architecture and decisions

### Structure: a new app in `apps/mobile`, with Next left in place
- **Decision:** a standalone Expo app in `apps/mobile`, with its own `package.json` and `package-lock.json`. There are no npm workspaces.
- **Why:** the Next app keeps building and deploying from the repo root, untouched, until parity. Two separate dependency trees avoid React and React Native hoisting clashes: Next is on React 19.2 and Expo 58 pins React 19.3.
- **Root change:** the only change outside `apps/mobile` is that the root `tsconfig.json` excludes `apps/`, so the Next typecheck ignores the RN code.
- **At cut-over:** delete the Next code. Then either move `apps/mobile` to the root or keep the monorepo layout.
- **Copied, not shared:** pure logic (levels, achievements, rarity, breed translations) was **copied** into `apps/mobile/src/lib`, because the Next copy will be deleted.

### Firebase: the JS SDK on all three platforms
- **Decision:** `firebase` JS SDK v13 on iOS, Android and web, not `@react-native-firebase`.
- **Why:**
  - It is the only option that runs unchanged on web, which is now a hard requirement.
  - It works in Expo Go with no native build.
  - The current code uses the same API, so queries and transactions port almost line for line.
  - It needs no `GoogleService-Info.plist` or `google-services.json`.
- **Platform splits, kept to a minimum:**
  - `lib/firebase-auth.ts` (native) uses `initializeAuth` with `getReactNativePersistence(AsyncStorage)`. `lib/firebase-auth.web.ts` uses `getAuth`, which defaults to IndexedDB, exactly as the Next app does.
  - `lib/photo-blob.ts` (native) builds the upload Blob with XHR from the local file. `lib/photo-blob.web.ts` builds it from the bytes.
  - Two things fail on React Native:
    - `fetch(file://).blob()` silently produced a 14-byte "File not found" body on Android.
    - RN's Blob can't be built from an ArrayBuffer.
  - `saveCapture` also rejects any upload whose stored size doesn't match.
- **Revisit** `@react-native-firebase` only for native-only needs, such as Crashlytics, native Google sign-in or App Check with DeviceCheck/Play Integrity. Each needs a dev build and a web split.
- **Emulators:** `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1` connects to local Auth, Firestore and Storage emulators (`apps/mobile/firebase.json`, project `demo-canisquest`). You can test end to end without touching production data.
- **Rules:** `firestore.rules` and `storage.rules` are the emulator's rules and a proposal. Production rules live only in the console; compare the two before ever deploying these.

### Continuity for existing web users (same project, same data)
Nothing is migrated: the Expo web build reads and writes the same Firestore paths and fields (inventory above) and the same Storage paths. Continuity comes from these points:

- **Auth session.** Firebase JS stores the signed-in user in IndexedDB, keyed by API key and app name (`[DEFAULT]`). If the Expo web build is served from the **same origin**, with the same `EXPO_PUBLIC_FIREBASE_*` values as today's `NEXT_PUBLIC_FIREBASE_*`, existing anonymous and Google users stay signed in. This matters most for anonymous users: a new origin would orphan their collections.
- **Language.** The same `dogdex-language` key and the same zustand persist JSON (`{"state":{"language":"es"},"version":0}`), checked in the browser.
- **Onboarding flag.** The same `dogexplorer_onboarding_completed = "true"` key, so returning users skip onboarding.
- **Firebase authorised domains:** unchanged when the domain stays the same.

### Gemini: an Expo API route
- **Decision:** `src/app/api/identify+api.ts` (`POST /api/identify`) calls the Gemini REST `generateContent` endpoint with a JSON response schema.
  - The prompt is copied verbatim from the Genkit flow, and the model is `gemini-2.5-flash` (`GEMINI_MODEL` overrides it).
  - The key goes in the `x-goog-api-key` header and is server-only (`GEMINI_API_KEY`, never `EXPO_PUBLIC_`).
- **Auth:** the route requires `Authorization: Bearer <Firebase ID token>`.
  - Tokens are verified with `jose` against Google's securetoken JWKS (issuer and audience = project ID).
  - In emulator mode it accepts the emulator's unsigned tokens, which is also what firebase-admin does.
  - Today's server action is effectively public, so this is stricter.
- **Behaviour change:** upstream or config errors now return 502/500, and the client shows "Analysis failed". The Genkit flow silently returned "Mixed Breed 45%", even when the key was missing. Unparseable model output still falls back to "Mixed Breed".
- **Why plain `fetch` and not Genkit:** it runs on any server target (Node, or Cloudflare Workers on EAS Hosting).
- **Local dev without a key:** `GEMINI_MOCK=1` (server only) returns a fixed Labrador result.
- **Client URL:**
  - Web is same-origin.
  - Native uses `EXPO_PUBLIC_API_URL`, falling back to the Metro host in development.

### Web hosting and deploy path
`app.json` sets `web.output: "server"`, because the API routes need a server. `npx expo export -p web` produces `dist/client` (static) and `dist/server` (SSR plus `/api/*`). I verified this locally with `npx expo serve`: SSR, static assets, and `/api/identify` with 401 and 200 responses.

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. EAS Hosting** (recommended for speed) | `eas deploy`, with the custom domain pointed at it and `GEMINI_API_KEY` as an EAS env secret | First-class Expo target, preview URLs per deploy, edge runtime | Hosting moves out of Firebase (a separate bill and dashboard). Cloudflare Workers runtime, which `/api/identify` is written for (fetch, WebCrypto, `jose`). |
| **B. Firebase Hosting plus Cloud Run** (keeps everything in the Firebase project) | Serve `dist/client` from Firebase Hosting, and rewrite `/api/**` and SSR routes to a Cloud Run service running `expo-server`'s Node/Express adapter on `dist/server`. Secret in Secret Manager. | One project, one bill, same console. Domain and auth domain stay in Firebase. | More setup: a Dockerfile or buildpack plus `firebase.json` rewrites. Cold starts. |
| **C. Firebase App Hosting** (what Next uses today) | App Hosting builds Node frameworks from `apphosting.yaml` with a custom build and start command (`expo export` then a Node server for `dist/server`) | Same product and rollout flow as today | App Hosting's first-class support is for Next.js and Angular. A custom Expo server has to be checked against the current App Hosting docs before choosing it. |

- **Recommendation:** start with **A** for a preview URL while building parity. Decide between A and B for production with the owner; it is mostly about whether hosting must stay inside Firebase.
- **Native builds:** point `EXPO_PUBLIC_API_URL` at whichever host serves `/api`.
- **PWA:** `public/manifest.json` and the icons are copied from the Next app and served at the same paths. Head tags (`manifest`, `theme-color`, `apple-touch-icon`) are added with `expo-router/head` (`components/web-head.web.tsx`).
  - **Caveat:** on this SDK build, any custom `src/app/+html.tsx` stopped the bundle `<script>` tags from being injected (I reproduced it with a minimal file), so the tags are added on the client after hydration rather than in the SSR HTML.
  - Chrome picks up a manifest added at runtime, but **check installability with Lighthouse on the deployed build**. Revisit `+html.tsx` on the next SDK patch.

### Styling: a typed theme with inline styles (NativeWind deferred)
- **Decision:** `src/theme.ts` holds the tokens taken from `globals.css` (the dark palette the Next app forces), plus Poppins via `@expo-google-fonts/poppins`. The Expo UI guidelines recommend inline styles.
- **Platforms:** this is cross-platform by construction (react-native-web), with nothing extra to configure.
- **Why not NativeWind now:**
  - NativeWind v5 (Tailwind 4) is still `5.0.0-rc.1` and needs a pinned `react-native-css` nightly.
  - v4 targets Tailwind 3 and older Reanimated, and is unverified on RN 0.88.
  - Most existing class strings are shadcn/Radix compositions that don't port anyway.
- **Revisit** NativeWind once v5 is stable. The tokens map directly onto `@theme` variables.
- **Radix/shadcn replacements** (all in `src/components/ui`):
  - Button, Card, Chip and RarityBadge.
  - Progress: a View bar.
  - Switch: RN `Switch`.
  - Tabs: chip rows.
  - Toast and `confirm()`: inline notices and a two-step delete button. `window.confirm` and `Alert` behave differently per platform.
  - Carousel: a paging `ScrollView`.
- **Icons:** `lucide-react-native` (same icons as the web app) on all platforms. The native tab bar uses SF Symbols and Material icons.

### Navigation
- **Root stack:** `(tabs)`, `analyzing`, `review`, `entry/[id]`, `badges`, `onboarding`, and `dev/smoke` (development only).
- **Tabs:** `NativeTabs` on iOS and Android (`components/app-tabs.tsx`). On web, `expo-router/ui` reproduces the Next app's bottom bar with the raised centre camera button (`components/app-tabs.web.tsx`).
- **URLs:** the web paths keep the Next app's routes (`/capture`, `/stats`, `/ranking`, `/settings`, `/badges`, `/entry/:id`, `/review`, `/analyzing`). The exception is `/collection`, which is now `/`; `src/app/collection.tsx` redirects there, so old bookmarks keep working.

### Capture (all platforms)
- `expo-image-picker` for both camera and library.
  - On web it is a file input (`capture` for the camera), the same as the Next app.
  - On native it uses the system camera and photo picker.
- `expo-image-manipulator` resizes to at most 1280 px wide, JPEG quality 0.7, before analysis and upload. The Next app sent full-size data URIs.

## 4. Tracer slice

> The Expo app boots and signs in anonymously with Firebase. You pick a photo. It is resized and sent with an ID token to `/api/identify` (Gemini on the server). The photo is uploaded to Storage, the entry is saved with the progression transaction (XP, level, achievements) in Firestore, and it appears in the live Collection list.

Status: `[x]` verified on **web** (headless Chrome against the emulators) and on **Android** (emulator with Expo Go). For iOS, only the production bundle was exported; it was **not run** on a simulator. See section 7.

## 5. Increments

1. `[x]` **Tracer** (see above).
2. `[x]` **Review and edit capture:** editable breed with AI alternatives, nickname, notes, favourite, confidence and rarity, "New breed / +XP" reveal.
3. `[x]` **Entry detail:** date, confidence, rarity, toggle favourite, two-step delete (Storage plus doc).
4. `[x]` **Collection filters:** search, all or favourites, rarity chips, empty and no-results states.
5. `[x]` **i18n en/es:** all strings in `lib/i18n.ts`, with a key-parity test. The language persists in the same key as the web app.
6. `[~]` **Settings:**
   - Done: language, account status, collector-name reservation, sign out, Google sign-in on **web**.
   - On native, a notice explains Google sign-in isn't available yet (increment 11).
   - Not exercised end to end: collector-name reservation and Google sign-in. Both need a non-guest account.
7. `[x]` **Stats.**
8. `[x]` **Achievements** (`/badges`).
9. `[x]` **Ranking.**
10. `[x]` **Onboarding:** pager, same flag as the web app, works on web and Android.
11. `[ ]` **Native Google sign-in:** `@react-native-google-signin/google-signin` (dev build) or `expo-auth-session`, then `signInWithCredential` / `linkWithCredential` so anonymous collections carry over. Needs iOS and Android OAuth client IDs.
12. `[ ]` **Web parity checks before cut-over:** (the `/collection` redirect is already done)
    - PWA installability (Lighthouse).
    - Google popup on the real domain.
    - Vercel Analytics, or a replacement.
    - SSR head tags (`+html.tsx` issue).
    - A visual pass against the Next app.
13. `[ ]` **App identity:** `ios.bundleIdentifier` / `android.package`, EAS project, `eas.json`, store icons and splash.
14. `[ ]` **Deploy:** choose hosting option A, B or C (section 3), set up a staging deploy and `EXPO_PUBLIC_API_URL` for native builds.
15. `[ ]` **Hardening:**
    - Commit and deploy the real Firestore and Storage rules.
    - Delete should decrement counters and achievement progress (an existing bug in the Next app, kept as-is).
    - Move the progression transaction to a server endpoint (Admin SDK) so clients can't write arbitrary XP.
    - Rate-limit `/api/identify`, and add App Check.
16. `[ ]` **Polish:** capture and reveal animations, haptics, iOS link previews and context menus, optional location capture (in the blueprint, never built), skeleton loaders.
17. `[ ]` **Cut-over:** switch the domain to the Expo web build, keep the Next deploy for rollback for a while, then delete the Next code and Genkit.

## 6. What Dario (or the repo owner) must supply

`apps/mobile/.env`, copied from `.env.example`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=            # same values as NEXT_PUBLIC_FIREBASE_*
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=                          # server only
```

Also needed:
- **Firebase console:** add `localhost` (and any preview domain) to Auth's authorised domains for web dev against the real project.
- **Firebase console:** check that the production rules allow what the app does (see `apps/mobile/firestore.rules`).
- **For native Google sign-in:** register iOS and Android apps in the Firebase project and create OAuth client IDs.
- **Hosting decision** (section 3) and access to wherever it lands: an EAS account, or Firebase/GCP for Cloud Run.

## 7. Verification log (2026-11-06)

All runs were against the local Firebase emulators (`demo-canisquest`) with `GEMINI_MOCK=1`. **No run used the real Firebase project or a real Gemini key**, because none were available. The Gemini request and response handling is covered by unit tests with a stubbed `fetch`, but has not been run against the live API.

- **Typecheck:** `npx tsc --noEmit` is clean.
- **Unit tests:** `npx jest` passes 24 tests in 8 suites:
  - progression and XP
  - Gemini request and normalisation
  - ID-token verification
  - base64
  - i18n key parity
  - filters
  - stats
  - trainer-name validation
- **API route** (`curl`):
  - no token gives 401
  - a malformed token gives 401 (this was 500 before a fix)
  - a missing image gives 400
  - a valid emulator token plus an image gives 200
- **Web:** `npx expo start --web` driven with headless Chrome (playwright-core with the installed Chrome).
  - Tracer: empty collection, upload photo, review shows "Labrador Retriever 92%", save shows "New Breed! +3 XP", the entry appears in the collection, favourite toggle, two-step delete.
  - Increments: onboarding and its flag, two captures, favourite/rarity/search filters, stats (2 captures, 4 XP), badges, ranking (seeded profile, re-sorted), Spanish language persisted as `dogdex-language`.
  - No page errors.
  - The Firestore emulator showed the expected user counters, entry fields and unlocked achievement.
- **Web production build:** `npx expo export -p web` then `npx expo serve`. SSR, static files and `/api/identify` (401 and 200) all work.
- **Android:** a dedicated `canisquest_api36` AVD with Expo Go 58.0.5, opening `exp://127.0.0.1:8095/--/dev/smoke` through `adb reverse`.
  - The smoke route ran the real native pipeline: manipulator, then `/api/identify` via the Metro host, then Auth, a Storage upload (12,277 bytes) and the Firestore transaction, ending in `SMOKE PASS`.
  - The collection then showed the photo. Native tabs, onboarding and stats rendered.
  - This run is what exposed and verified the Android upload fix.
- **iOS:**
  - `npx expo export -p ios` built the Hermes bundle (8.2 MB).
  - Expo Go 58.0.7 was installed on a dedicated simulator, but opening the URL hits iOS's "Open in Expo Go?" system prompt, which I had no way to tap headlessly. **The app was not run on iOS.**
  - Next step: open it once by hand (`npx expo start` then `i`), or add `idb`/Maestro for automated taps.

## 8. Running it

```bash
cd apps/mobile
npm install
cp .env.example .env        # fill in Firebase + GEMINI_API_KEY, or use emulator mode below
npx expo start              # then w (web), a (Android), i (iOS) or scan the QR code with Expo Go
npm run typecheck && npm test
```

**Emulator mode** (no real project needed). Put this in `.env`:

```
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
GEMINI_MOCK=1
```

Then:
- Start the emulators: `npx firebase-tools@15 emulators:start --only auth,firestore,storage --project demo-canisquest` (needs JDK 21 or later).
- On an Android emulator, run `adb reverse tcp:8081 tcp:8081` and do the same for ports 9099, 8080 and 9199.
- **Native smoke test** (development only): open `<dev-server>/--/dev/smoke` in Expo Go. For example: `adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081/--/dev/smoke" host.exp.exponent`.
- **Production web build:** `npx expo export -p web`, then `npx expo serve`.
