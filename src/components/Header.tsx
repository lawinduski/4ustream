'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Sun, Moon, UserRound, ShieldCheck, Download, Menu, X, LogIn, Home, Radio, Film, Clapperboard } from 'lucide-react';
import { useState } from 'react';
import { useApp } from './AppProvider';

export function Header(){
 const {t,theme,setTheme,user,profile,install,lang,setLang}=useApp();
 const path=usePathname(); const [open,setOpen]=useState(false);
 const nav=[['/',t('home'),Home],['/live',t('live'),Radio],['/films',t('films'),Film],['/drama',t('drama'),Clapperboard]] as const;
 return <>
  <header className="sticky top-0 z-50 px-3 sm:px-5 pt-3">
   <div className="topbar mx-auto max-w-7xl">
    <Link href="/" className="brand focus-ring" aria-label="4uStream">
      <span className="brand-mark">4U</span><span className="hidden sm:block"><b>4uStream</b><small>LIVE • ENTERTAINMENT</small></span>
    </Link>
    <nav className="hidden lg:flex items-center gap-1 ms-5">{nav.map(([href,label,Icon])=><Link key={href} href={href} className={`nav-link ${path===href?'active':''}`}><Icon size={16}/>{label}</Link>)}</nav>
    <div className="ms-auto flex items-center gap-1">
      <Link href="/search" className="icon-btn" aria-label={t('search')}><Search size={18}/></Link>
      <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="icon-btn" aria-label="Theme">{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
      <select value={lang} onChange={e=>setLang(e.target.value as any)} className="lang-select hidden md:block"><option value="badini">Badini</option><option value="sorani">Sorani</option><option value="en">English</option><option value="ar">العربية</option></select>
      <button onClick={install} className="icon-btn hidden md:flex" title={t('install')}><Download size={18}/></button>
      {user ? <Link href="/account" className="icon-btn"><UserRound size={18}/></Link> : <Link href="/login" className="icon-btn"><LogIn size={18}/></Link>}
      {user && profile?.uid && <Link href="/admin" className="icon-btn"><ShieldCheck size={18}/></Link>}
      <button className="icon-btn lg:hidden" onClick={()=>setOpen(!open)} aria-label="Menu">{open?<X size={19}/>:<Menu size={19}/>}</button>
    </div>
   </div>
   {open&&<div className="mobile-menu lg:hidden">{nav.map(([href,label,Icon])=><Link onClick={()=>setOpen(false)} key={href} href={href} className={path===href?'active':''}><Icon size={17}/>{label}</Link>)}<Link href="/account" onClick={()=>setOpen(false)}><UserRound size={17}/>Account</Link></div>}
  </header>
  <nav className="bottom-nav lg:hidden">{nav.map(([href,label,Icon])=><Link key={href} href={href} className={path===href?'active':''}><Icon size={19}/><span>{label}</span></Link>)}<Link href="/search"><Search size={19}/><span>{t('search')}</span></Link></nav>
 </>
}
