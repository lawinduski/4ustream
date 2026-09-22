'use client';

import Link from 'next/link';
import { LockKeyhole, MailCheck } from 'lucide-react';
import { useApp } from './AppProvider';

export function Protected({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, t } = useApp();

  if (loading) {
    return <div className="min-h-[50vh] grid place-items-center text-slate-400">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center">
        <div>
          <LockKeyhole className="mx-auto mb-4 text-violet-300" size={34} />
          <h2 className="text-2xl font-bold">{t('login')}</h2>
          <Link href="/login" className="inline-flex mt-5 px-5 py-3 rounded-xl bg-white text-slate-950 font-bold">
            {t('login')}
          </Link>
        </div>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center">
        <div className="max-w-md">
          <MailCheck className="mx-auto mb-4 text-violet-300" size={40} />
          <h2 className="text-2xl font-bold">Verify your email</h2>
          <p className="mt-2 text-sm text-slate-400">Please verify your email address before using protected content.</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.status !== 'active') {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center">
        <div className="max-w-md">
          <LockKeyhole className="mx-auto mb-4 text-violet-300" size={40} />
          <h2 className="text-2xl font-bold">{t('noAccess')}</h2>
          <p className="mt-2 text-sm text-slate-400">Your account is not active yet. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
