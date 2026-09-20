# 4uStream — fast vanilla rewrite

Same app, same Firebase project (auth, Firestore, Storage, rules) — just no
Next.js/React anymore. Plain HTML + CSS + JS + JSON, no build step, no
framework bundle. This is what was making the old version feel heavy:
React hydration on every page, a large JS bundle to download before
anything is interactive, and Tailwind's runtime overhead. None of that
exists here — the browser just runs the files directly.

## 1. Add your Firebase config

Open `js/firebase-init.js` and paste in the **same values** you already
have in Vercel's environment variables for the old project (Firebase
Console → Project settings → your web app → SDK setup and configuration):

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

That's the only thing you need to change. Your existing `firestore.rules`
and `storage.rules` are copied into this folder unchanged — deploy them
with the Firebase CLI exactly like before if you haven't already:

```bash
firebase deploy --only firestore:rules,storage:rules
```

## 2. Run it locally

No `npm install`, no build. Any static file server works, e.g.:

```bash
npx serve .
# or
python3 -m http.server 5500
```

(Opening `index.html` directly with `file://` will NOT work — the pages
use `fetch()` for `data/i18n.json` and ES module imports, both of which
need `http://`.)

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
js/firebase-init.js      ⚠️ put your config here
js/app.js                Header/nav/theme/lang/auth shell, shared card UI
js/content.js            Firestore reads for channels/media/episodes
js/favorites.js, ads.js, access.js, storage.js, player.js, icons.js, i18n.js
js/pages/*.js            One small script per page
data/i18n.json           Translations (Badini/English/Arabic)
data/channels.seed.json  Your original 62 starter channels, as JSON —
                          handy if you ever want to bulk-import them into
                          Firestore again.
manifest.webmanifest, sw.js, icons/  PWA
firestore.rules, storage.rules       Copied from your repo, unchanged
```

## One thing worth knowing

Because this is now a real multi-page site (not a single-page app), a
full page load runs the Firebase SDK's `onAuthStateChanged` again on
every navigation. That's normal and fast — Firebase caches the session
in IndexedDB — but if you ever notice a slight flash before the
header shows "Login" vs your account, that's why.
