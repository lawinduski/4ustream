'use client';

import { useEffect, useState } from 'react';
import  Link  from 'next/link';
import { applyActionCode } from 'firebase/auth';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { auth } from '@/lib/firebase';

export default function AuthActionPage() {
  const [status, setStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search,
        );

        const mode = params.get('mode');
        const oobCode = params.get('oobCode');

        if (mode !== 'verifyEmail' || !oobCode) {
          throw new Error('Invalid verification link.');
        }

        await applyActionCode(auth, oobCode);
        await auth.currentUser?.reload();
        setStatus('success');
      } catch (error) {
        console.error(
          '4uStream email verification error:',
          error,
        );

        setStatus('error');
      }
    };

    verifyEmail();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl">

        {status === 'loading' && (
          <>
            <Loader2
              className="mx-auto mb-5 animate-spin"
              size={48}
            />

            <h1 className="text-2xl font-black">
              Verifying your email...
            </h1>

            <p className="mt-3 text-sm text-white/60">
              Please wait a moment.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2
              className="mx-auto mb-5 text-emerald-400"
              size={64}
            />

            <h1 className="text-3xl font-black">
              Email Verified
            </h1>

            <p className="mt-3 text-white/60">
              Your 4uStream account has been verified successfully.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-2xl bg-white px-6 py-3 font-black text-slate-950 transition hover:scale-105"
            >
              Continue to 4uStream
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle
              className="mx-auto mb-5 text-red-400"
              size={64}
            />

            <h1 className="text-3xl font-black">
              Verification Failed
            </h1>

            <p className="mt-3 text-white/60">
              This verification link is invalid or has expired.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-2xl bg-white px-6 py-3 font-black text-slate-950"
            >
              Back to 4uStream
            </Link>
          </>
        )}

      </div>
    </main>
  );
}
