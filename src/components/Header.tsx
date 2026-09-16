'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Sun, Moon, UserRound, ShieldCheck, Download, Menu, X, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useApp } from './AppProvider';

export function Header(){
 const {t,theme,setTheme,user,profile,install,lang,setLang}=useApp(); const path=usePathname(); const [open,setOpen]=useState(false);
 const nav=[['/',t('home')],['/live',t('live')],['/films',t('films')],['/drama',t('drama')],['/account',t('account')]] as const;
 return <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3"><div className="glass mx-auto max-w-7xl rounded-2xl shadow-2xl"><div className="h-16 px-4 flex items-center gap-3">
   <Link href="/" className="flex items-center gap-3 shrink-0 focus-ring"><div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 grid place-items-center shadow-lg"><span className="text-white font-black text-sm">4U</span></div><div className="hidden sm:block"><div className="font-extrabold tracking-tight">4uStream</div><div className="text-[10px] text-slate-400 -mt-1">LIVE • ENTERTAINMENT</div></div></Link>
   <nav className="hidden lg:flex items-center gap-1 ms-3">{nav.map(([href,label])=><Link key={href} href={href} className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${path===href?'bg-white/10 text-white':'text-slate-400 hover:text-white hover:bg-white/5'}`}>{label}</Link>)}</nav>
   <div className="ms-auto flex items-center gap-1.5">
    <Link href="/search" aria-label={t('search')} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-300"><Search size={18}/></Link>
    <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-300" aria-label="Theme">{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
    <select value={lang} onChange={e=>setLang(e.target.value as any)} className="hidden md:block bg-transparent text-xs text-slate-300 border border-white/10 rounded-lg px-2 py-2"><option value="badini">Badini</option><option value="sorani">Sorani</option><option value="en">English</option><option value="ar">العربية</option></select>
    <button onClick={install} className="hidden md:flex p-2.5 rounded-xl hover:bg-white/5 text-slate-300" title={t('install')}><Download size={18}/></button>
    {user ? <Link href={profile?.status==='active' && profile?.uid ? '/account':'/account'} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-200"><UserRound size={18}/></Link> : <Link href="/login" className="p-2.5 rounded-xl hover:bg-white/5 text-slate-200"><LogIn size={18}/></Link>}
    {user && profile?.uid && <Link href="/admin" className="p-2.5 rounded-xl hover:bg-white/5 text-slate-200"><ShieldCheck size={18}/></Link>}
    <button className="lg:hidden p-2.5 rounded-xl hover:bg-white/5" onClick={()=>setOpen(!open)}>{open?<X size={19}/>:<Menu size={19}/>}</button>
   </div>
 </div>{open&&<div className="lg:hidden border-t border-white/10 p-3 grid gap-1">{nav.map(([href,label])=><Link onClick={()=>setOpen(false)} key={href} href={href} className="px-3 py-3 rounded-xl hover:bg-white/5 text-sm font-semibold">{label}</Link>)}<button onClick={install} className="px-3 py-3 rounded-xl text-start text-sm">{t('install')}</button></div>}</div></header>
}
