import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

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

// App Check is optional during local development. When a reCAPTCHA Enterprise
// site key is configured in Vercel, Firebase can reject requests from clients
// that are not attested by the configured provider.
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY) {
  try {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Do not break the application if App Check is not configured yet.
  }
}


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
