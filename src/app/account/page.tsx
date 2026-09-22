'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, UserRound, Download, Star, Radio, Film, PlayCircle, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { PageShell } from '@/components/PageShell';
import { useApp } from '@/components/AppProvider';

import { formatVipUntil } from '@/lib/access';
import { useFavorites } from '@/components/FavoritesProvider';
type RecentItem = { id: string; type: 'media' | 'episode'; title: string; image?: string; watchedAt: number };

export default function Account(){
 const {user,profile,t,install,isVip}=useApp(); const {items:favorites}=useFavorites(); const router=useRouter(); const [recent,setRecent]=useState<RecentItem[]>([]);
 useEffect(()=>{const load=()=>{try{const x=JSON.parse(localStorage.getItem('4u-recent-watching')||'[]');setRecent(Array.isArray(x)?x.slice(0,6):[])}catch{setRecent([])}};load();window.addEventListener('4u-recent-watching-changed',load);return()=>window.removeEventListener('4u-recent-watching-changed',load)},[]);
 if(!user)return <PageShell><div className="max-w-xl mx-auto glass rounded-3xl p-8 text-center"><UserRound className="mx-auto text-violet-300" size={38}/><h1 className="text-2xl font-bold mt-4">{t('login')}</h1><button onClick={()=>router.push('/login')} className="mt-5 px-5 py-3 rounded-xl bg-white text-slate-950 font-bold">{t('login')}</button></div></PageShell>;
 return <PageShell><div className="max-w-4xl mx-auto space-y-6">
   <div className={`glass rounded-3xl p-7 sm:p-10 ${isVip?'account-vip':''}`}>
     <div className="flex items-start justify-between gap-4 flex-wrap">
       <div className="flex items-center gap-4">
         <div className={`h-16 w-16 rounded-2xl grid place-items-center ${isVip?'bg-gradient-to-br from-amber-300 to-violet-500':'bg-gradient-to-br from-violet-500 to-cyan-400'}`}>{isVip?<Crown/>:<UserRound/>}</div>
         <div><h1 className="text-3xl font-black flex items-center gap-2 flex-wrap">{profile?.name||user.displayName||'User'}{isVip&&<span className="vip-chip"><Crown size={11}/>VIP</span>}</h1><p className="text-slate-400 mt-1">{user.email}</p></div>
       </div>
     </div>
     {isVip?<div className="mt-7 p-5 rounded-2xl bg-gradient-to-br from-violet-500/15 to-amber-400/10 border border-violet-400/25">
       <div className="flex items-center gap-2 text-violet-200 font-black text-sm"><Sparkles size={16}/>VIP is active{profile?.vipUntil?` · Expires ${formatVipUntil(profile.vipUntil)}`:''}</div>
       <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
         <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-violet-300 shrink-0"/>Full access to every VIP channel, film, drama and episode</li>
         <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-violet-300 shrink-0"/>Nothing marked VIP is locked for you anywhere on 4uStream</li>
       </ul>
     </div>:<div className="mt-7 p-5 rounded-2xl bg-white/5 border border-white/10">
       <div className="font-bold text-sm">FREE plan</div>
       <p className="text-xs text-slate-500 mt-1.5">You have access to all free content. VIP unlocks premium channels, films and dramas — ask an admin to activate it for your account.</p>
     </div>}
     <div className="flex flex-wrap gap-3 mt-7"><button onClick={install} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"><Download size={17}/>{t('install')}</button><button onClick={async()=>{await signOut(auth);router.push('/');}} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-200"><LogOut size={17}/>{t('logout')}</button></div>
   </div>
   {recent.length>0&&<section className="glass rounded-3xl p-5 sm:p-7"><div className="flex items-center gap-2 mb-5"><PlayCircle className="text-cyan-300" size={20}/><h2 className="text-xl font-black">{t('continueWatching')}</h2></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{recent.map((r)=><Link key={`${r.type}-${r.id}`} href={r.type==='episode'?`/watch?episode=${encodeURIComponent(r.id)}`:`/watch?media=${encodeURIComponent(r.id)}`} className="glass rounded-2xl overflow-hidden card-hover"><div className="aspect-[2/3] bg-slate-900">{r.image&&<img src={r.image} alt={r.title} loading="lazy" decoding="async" className="w-full h-full object-cover"/>}</div><div className="p-3"><div className="text-[10px] text-violet-300 font-bold uppercase">{r.type}</div><div className="font-bold text-sm truncate mt-1">{r.title}</div></div></Link>)}</div></section>}
   <section className="glass rounded-3xl p-5 sm:p-7"><div className="flex items-center gap-2 mb-5"><Star className="text-yellow-300" size={20} fill="currentColor"/><h2 className="text-xl font-black">{t('favorites')}</h2><span className="text-xs text-slate-500">{favorites.length}</span></div>
    {!favorites.length?<div className="py-12 text-center text-slate-500">{t('noResults')}</div>:<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{favorites.map(f=><Link key={`${f.type}-${f.id}`} href={f.type==='channel'?`/live?channel=${encodeURIComponent(f.id)}`:`/watch?media=${encodeURIComponent(f.id)}`} className="glass rounded-2xl overflow-hidden card-hover"><div className="aspect-[16/10] bg-slate-900 grid place-items-center">{f.image?<img src={f.image} alt={f.title} loading="lazy" decoding="async" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="w-full h-full object-cover"/>:f.type==='channel'?<Radio/>:<Film/>}</div><div className="p-3"><div className="text-[10px] uppercase text-violet-300 font-bold">{f.type}</div><div className="font-bold truncate mt-1">{f.title}</div></div></Link>)}</div>}
   </section>
 </div></PageShell>;
}
