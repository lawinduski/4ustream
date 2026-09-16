# 4uStream

A Next.js + Firebase streaming catalog foundation with:

- Firebase email/password authentication
- Admin bootstrap through Firestore `admins/{uid}`
- User activation/disable controls
- Firestore-managed live channels
- Firestore-managed films and drama
- Add/edit/delete content from the Admin Console
- Video/HLS and iframe player modes
- PWA install support
- Dark/light theme
- Badini, Sorani, English and Arabic UI foundation
- Security headers and locked Firestore rules

## Admin workflow

1. Create an account at `/signup`.
2. In Firebase Authentication, copy the user's UID.
3. Create `admins/{UID}` with `active: true` and the user's email.
4. Create/update `users/{UID}` with `status: active` for the first admin bootstrap.
5. Sign out/in again and open `/admin`.
6. Use **Import starter catalog** once if you want the 62 starter channel names and demo media in Firestore.
7. Add only streams and videos you own or are authorized to redistribute.

## Environment

Copy `.env.example` to `.env.local` and fill in the Firebase web app configuration. Do not put service-account private keys in the browser or `NEXT_PUBLIC_*` variables.

## Local

```bash
npm install
npm run dev
```

## Production

Set the same environment variables in Vercel, deploy the repository, and publish the Firestore rules from `firestore.rules` with the Firebase CLI. The project has not been build-tested in this environment because dependency installation was unavailable.
