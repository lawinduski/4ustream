// Vercel serverless function (no framework needed — Vercel auto-detects /api/*.js).
// Reads the SAME env var names you already used in the old Next.js project,
// so if you're redeploying into the same Vercel project, nothing to re-add.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.status(200).json({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
};
