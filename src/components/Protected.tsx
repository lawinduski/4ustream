'use client';
import { useApp } from './AppProvider';
import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';
export function Protected({children}:{children:React.ReactNode}){const {user,profile,loading,t}=useApp(); if(loading)return <div className="min-h-[50vh] grid place-items-center text-slate-400">Loading…</div>; if(!user)return <div className="min-h-[60vh] grid place-items-center text-center"><div><LockKeyhole className="mx-auto mb-4 text-violet-300" size={34}/><h2 className="text-2xl font-bold">{t('login')}</h2><Link href="/login" className="inline-flex mt-5 px-5 py-3 rounded-xl bg-white text-slate-950 font-bold">{t('login')}</Link></div></div>; if(profile?.status!=='active')return <div className="min-h-[60vh] grid place-items-center text-center"><div><LockKeyhole className="mx-auto mb-4 text-amber-300" size={34}/><h2 className="text-2xl font-bold">{t('pending')}</h2><p className="text-slate-400 mt-2">{t('noAccess')}</p></div></div>; return <>{children}</>}
