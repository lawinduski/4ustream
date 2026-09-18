// Firebase — loaded as ES modules straight from Google's CDN.
// The actual config values live ONLY in Vercel's Environment Variables (see
// /api/config.js) — nothing secret is committed to this repo/zip. This file
// fetches that config once at startup (top-level await — supported by all
// modern browsers) before initializing Firebase.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js';

async function loadConfig() {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Could not load Firebase config from /api/config — check your Vercel env vars.');
  return res.json();
}

const firebaseConfig = await loadConfig();

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
