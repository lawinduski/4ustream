'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Lang, translations } from '@/i18n/translations';
import type { UserProfile } from '@/lib/types';
import { isVip as checkVip } from '@/lib/access';

type Theme = 'dark' | 'light';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type AppContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: keyof typeof translations.en) => string;
  install: () => Promise<void>;
  canWatch: boolean;
  isVip: boolean;
  refreshProfile: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Lang>('badini');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('4u-lang') as Lang | null;
    const savedTheme = localStorage.getItem('4u-theme') as Theme | null;
    if (savedLang && ['badini', 'sorani', 'en', 'ar'].includes(savedLang)) setLangState(savedLang);
    if (savedTheme && ['dark', 'light'].includes(savedTheme)) setThemeState(savedTheme);

    const handler = (event: Event) => {
      if (!('prompt' in event) || !('userChoice' in event)) return;
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang === 'badini' || lang === 'sorani' ? 'ku' : lang;
    localStorage.setItem('4u-lang', lang);
    localStorage.setItem('4u-theme', theme);
  }, [lang, theme]);

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (cancelled) return;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      getDoc(doc(db, 'users', nextUser.uid))
        .then((snap) => {
          if (cancelled) return;
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        })
        .catch(() => {
          if (!cancelled) setProfile(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const t = useCallback(
    (key: keyof typeof translations.en) => translations[lang][key] ?? translations.en[key],
    [lang],
  );

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      alert(t('install'));
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt, t]);

  const vip = checkVip(profile);
  const canWatch = Boolean(user?.emailVerified && profile?.status === 'active');

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      lang,
      setLang,
      theme,
      setTheme,
      t,
      install,
      canWatch,
      isVip: vip,
      refreshProfile,
    }),
    [user, profile, loading, lang, setLang, theme, setTheme, t, install, canWatch, vip, refreshProfile],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider missing');
  return context;
}
