'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Lang, translations } from '@/i18n/translations';
import type { UserProfile } from '@/lib/types';
import { isVip as checkVip } from '@/lib/access';

type Theme = 'dark'|'light';
type AppContextType = { user: User|null; profile: UserProfile|null; loading: boolean; lang: Lang; setLang:(l:Lang)=>void; theme:Theme; setTheme:(t:Theme)=>void; t:(key:keyof typeof translations.en)=>string; install:()=>Promise<void>; canWatch:boolean; isVip:boolean; refreshProfile:()=>Promise<void>; };
const AppContext = createContext<AppContextType|null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user,setUser]=useState<User|null>(null); const [profile,setProfile]=useState<UserProfile|null>(null); const [loading,setLoading]=useState(true);
  const [lang,setLangState]=useState<Lang>('badini'); const [theme,setThemeState]=useState<Theme>('dark'); const [deferred,setDeferred]=useState<any>(null);
  useEffect(()=>{ const saved=localStorage.getItem('4u-lang') as Lang|null; if(saved) setLangState(saved); const th=localStorage.getItem('4u-theme') as Theme|null; if(th) setThemeState(th);
    const handler=(e:Event)=>{ e.preventDefault(); setDeferred(e); }; window.addEventListener('beforeinstallprompt',handler); return()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);
  useEffect(()=>{ document.documentElement.classList.toggle('light',theme==='light'); document.documentElement.dir=(lang==='en'?'ltr':'rtl'); document.documentElement.lang=lang==='badini'?'ku':lang==='sorani'?'ckb':lang; localStorage.setItem('4u-lang',lang); localStorage.setItem('4u-theme',theme); },[lang,theme]);
  const refreshProfile=async()=>{ if(!auth.currentUser){setProfile(null);return;} const snap=await getDoc(doc(db,'users',auth.currentUser.uid)); setProfile(snap.exists()?snap.data() as UserProfile:null); };
  useEffect(()=>onAuthStateChanged(auth,async(u)=>{ setUser(u); if(u){ const snap=await getDoc(doc(db,'users',u.uid)); setProfile(snap.exists()?snap.data() as UserProfile:null); } else setProfile(null); setLoading(false); }),[]);
  const setLang=(l:Lang)=>setLangState(l); const setTheme=(t:Theme)=>setThemeState(t); const t=(key:keyof typeof translations.en)=>translations[lang][key] ?? translations.en[key];
  const install=async()=>{ if(deferred){ deferred.prompt(); await deferred.userChoice; setDeferred(null); } else alert(t('install')); };
  const vip=checkVip(profile);
  const value=useMemo(()=>({user,profile,loading,lang,setLang,theme,setTheme,t,install,canWatch:!!user&&profile?.status==='active',isVip:vip,refreshProfile}),[user,profile,loading,lang,theme,vip]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(){ const c=useContext(AppContext); if(!c) throw new Error('AppProvider missing'); return c; }
