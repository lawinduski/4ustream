# 4uStream — fast vanilla rewrite

Same app, same Firebase project (auth, Firestore, Storage, rules) — just no
Next.js/React anymore. Plain HTML + CSS + JS + JSON, no build step, no
framework bundle. This is what was making the old version feel heavy:
React hydration on every page, a large JS bundle to download before
anything is interactive, and Tailwind's runtime overhead. None of that
exists here — the browser just runs the files directly.

## 1. Set your Firebase config in Vercel (not in the code)

Your Firebase keys never live in this repo. Instead there's a tiny
serverless function (`api/config.js`) that reads them from Vercel's
**Environment Variables** at request time and hands them to the browser.

In your Vercel project → Settings → Environment Variables, make sure these
exist (same names your old Next.js project used — if you're deploying into
the *same* Vercel project, they're probably already there and you don't
need to do anything):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

That's it — nothing to paste into any file. `js/firebase-init.js` fetches
`/api/config` on load and initializes Firebase with whatever comes back.

One honest note: Firebase's client config (`apiKey` etc.) isn't actually a
secret by Google's own design — the real protection is your
`firestore.rules` / `storage.rules`, which run server-side. Routing it
through `/api/config` is about keeping it only in Vercel rather than
about hiding something sensitive.

Your existing `firestore.rules` and `storage.rules` are copied into this
folder unchanged — deploy them with the Firebase CLI exactly like before
if you haven't already:

```bash
firebase deploy --only firestore:rules,storage:rules
```

## 2. Run it locally

No `npm install`, no build for the static files — but `/api/config.js`
is a Vercel serverless function, so local testing needs the Vercel CLI
(a plain static server like `npx serve` won't run `/api/*`):

```bash
npm i -g vercel   # once
vercel env pull   # pulls your env vars locally into .env
vercel dev
```

## 3. Deploy

Drag-and-drop this whole folder onto Vercel, or:

```bash
vercel deploy
```

No framework preset needed — pick "Other" and it'll serve the static
files as-is. No environment variables needed either, since the Firebase
config now lives directly in `js/firebase-init.js`.

## What's the same as before

- All Firestore collections, field names and query shapes (`channels`,
  `media`, `episodes`, `ads`, `users`, `admins`) are unchanged.
- Firebase Auth (email/password), the pending → active admin activation
  flow, VIP plans/expiry, and the `admins/{uid}` bootstrap step all work
  exactly like before.
- The admin console (`/admin.html`) still lets you add/edit/delete
  channels, films, drama, episodes and ads, and upload images to Firebase
  Storage.
- Same visual design (dark glass, violet/cyan), same 3 languages
  (Badini/English/Arabic), same PWA install support.

## What's different (why it's faster)

- No React, no Next.js, no client-side router, no hydration — every page
  is a real, separate, tiny HTML file.
- No Tailwind at runtime — `css/style.css` is one plain, hand-written
  stylesheet.
- `hls.js` only loads on pages that actually play a stream, and only
  when the stream is HLS.
- Channel/media/ad reads are cached in `sessionStorage` for 15 seconds,
  so navigating between pages doesn't keep re-hitting Firestore.
- `sw.js` caches the app shell so repeat visits load instantly, even on
  a slow connection.

## Files

```
index.html            Home
live.html              Live TV (channel list + player)
films.html              Films catalog
drama.html              Drama catalog
drama-detail.html      One drama's seasons/episodes (?id=)
watch.html              Film / episode player (?media= or ?episode=)
login.html / signup.html
account.html            Profile, favorites, sign out
search.html              Channel search
admin.html               Admin console
css/style.css            All styles
js/firebase-init.js      Fetches config from /api/config at runtime
js/app.js                Header/nav/theme/lang/auth shell, shared card UI
js/content.js            Firestore reads for channels/media/episodes
js/favorites.js, ads.js, access.js, storage.js, player.js, icons.js, i18n.js
js/pages/*.js            One small script per page
data/i18n.json           Translations (Badini/English/Arabic)
data/channels.seed.json  Your original 62 starter channels, as JSON —
                          handy if you ever want to bulk-import them into
                          Firestore again.
manifest.webmanifest, sw.js, icons/  PWA
api/config.js                        Vercel serverless function — serves Firebase config from env vars
firestore.rules, storage.rules       Copied from your repo, unchanged
```

## One thing worth knowing

Because this is now a real multi-page site (not a single-page app), a
full page load runs the Firebase SDK's `onAuthStateChanged` again on
every navigation. That's normal and fast — Firebase caches the session
in IndexedDB — but if you ever notice a slight flash before the
header shows "Login" vs your account, that's why.
