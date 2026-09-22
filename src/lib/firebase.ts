import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

/**
 * Safari (especially behind iCloud Private Relay, a VPN or a content blocker) can stall
 * Firestore's default WebChannel streaming. Auto-detection switches to long polling when
 * streaming does not work, and keeps the faster transport everywhere else.
 *
 * initializeFirestore() throws if Firestore was already initialised (for example after a
 * hot reload), so fall back to the existing instance in that case.
 */
function createDb() {
  try {
    return initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export const db = createDb();
