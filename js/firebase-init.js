// Firebase is initialized from the Vercel server endpoint so the project can
// keep its Firebase Web configuration in Vercel Environment Variables.
// The Web SDK config is not a secret; Firestore/Storage rules remain the real security boundary.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js';

let firebasePromise;

async function loadConfig() {
  const response = await fetch('/api/firebase-config', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Firebase configuration is unavailable. Check Vercel Environment Variables.');
  }

  const config = await response.json();
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  if (required.some((key) => typeof config[key] !== 'string' || !config[key])) {
    throw new Error('Firebase configuration is incomplete.');
  }
  return config;
}

export function getFirebase() {
  if (!firebasePromise) {
    firebasePromise = loadConfig().then((firebaseConfig) => {
      const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
      return {
        firebaseApp,
        auth: getAuth(firebaseApp),
        db: getFirestore(firebaseApp),
        storage: getStorage(firebaseApp),
      };
    });
  }
  return firebasePromise;
}
