'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import {
  reload,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { PageShell } from '@/components/PageShell';
import { LogIn, Loader2, MailCheck } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await reload(credential.user);

      if (!credential.user.emailVerified) {
        setError('Please verify your email before continuing.');
        setBusy(false);
        return;
      }

      const profileRef = doc(db, 'users', credential.user.uid);
      await updateDoc(profileRef, { status: 'active' });
      router.push('/');
    } catch {
      setError('Email or password is incorrect.');
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password first.');
      return;
    }

    setResending(true);
    setError('');
    setNotice('');

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await reload(credential.user);

      if (credential.user.emailVerified) {
        await updateDoc(doc(db, 'users', credential.user.uid), { status: 'active' });
        setNotice('Your email is already verified. You can sign in now.');
      } else {
        const response = await fetch('/api/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credential.user.email }),
        });
        if (!response.ok) throw new Error('Verification email failed.');
        setNotice('A new verification email has been sent.');
      }
    } catch {
      setError('Could not resend the verification email. Check your email and password.');
    } finally {
      setResending(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError('Password reset email sent.');
    } catch {
      setError('Could not send the password reset email.');
    }
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto glass rounded-3xl p-7 sm:p-9">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 grid place-items-center">
          <LogIn />
        </div>

        <h1 className="text-3xl font-black mt-6">Welcome back</h1>
        <p className="text-slate-400 mt-1">Sign in to continue to 4uStream.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full glass rounded-xl px-4 py-3 outline-none"
          />

          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full glass rounded-xl px-4 py-3 outline-none"
          />

          {error && <div className="text-sm text-red-300">{error}</div>}
          {notice && <div className="text-sm text-emerald-300">{notice}</div>}

          <button
            disabled={busy}
            className="w-full py-3 rounded-xl bg-white text-slate-950 font-extrabold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader2 className="animate-spin" size={17} />}
            Sign in
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
          <button onClick={resendVerification} disabled={resending} className="text-cyan-300 inline-flex items-center gap-1 disabled:opacity-60">
            {resending ? <Loader2 className="animate-spin" size={13} /> : <MailCheck size={13} />}
            Resend verification
          </button>
          <button onClick={resetPassword} className="text-violet-300">
            Forgot password?
          </button>
        </div>

        <p className="text-sm text-slate-500 mt-6">
          New here?{' '}
          <Link className="text-violet-300" href="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
