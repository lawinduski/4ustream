'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Sun,
  Moon,
  UserRound,
  ShieldCheck,
  Crown,
  Download,
  Menu,
  X,
  LogIn,
  Home,
  Radio,
  Film,
  Clapperboard,
  Languages,
  Heart,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from './AppProvider';

export function Header() {
  const {
    t,
    theme,
    setTheme,
    user,
    profile,
    install,
    lang,
    setLang,
    isVip,
  } = useApp();

  const path = usePathname();
  const [open, setOpen] = useState(false);

  const nav = [
    ['/', t('home'), Home],
    ['/live', t('live'), Radio],
    ['/films', t('films'), Film],
    ['/drama', t('drama'), Clapperboard],
    ['/account', t('account'), Heart],
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-50 px-2 sm:px-6 pt-2 sm:pt-3 pb-2">
        <div className="glass-header mx-auto max-w-7xl rounded-[1.35rem]">
          <div className="h-14 sm:h-[4.25rem] px-3 sm:px-5 flex items-center gap-2 sm:gap-4">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 focus-ring"
            >
              <div className="h-11 w-11 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-2xl bg-black/20 border border-white/10 grid place-items-center">
                <img
                  src="/IMG_6501.jpeg"
                  alt="4uStream"
                  className="h-full w-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>

              <div className="hidden sm:block">
                <div className="font-black tracking-tight text-[15px]">
                  4uStream
                </div>
                <div className="text-[9px] text-slate-500 tracking-[.2em] uppercase">
                  Badini • Stream
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 ms-2">
              {nav.map(([href, label, Icon]) => (
                <Link
                  key={href}
                  href={href}
                  className={`nav-pill ${path === href ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            <div className="ms-auto flex items-center gap-1">
              <Link
                href="/search"
                aria-label={t('search')}
                className="icon-btn"
              >
                <Search size={18} />
              </Link>

              <button
                onClick={() =>
                  setTheme(theme === 'dark' ? 'light' : 'dark')
                }
                className="icon-btn"
                aria-label="Theme"
              >
                {theme === 'dark' ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>

              <div className="hidden md:block">
                <div className="language-chip">
                  <Languages size={14} />
                  <select
                    aria-label={t('language')}
                    value={lang}
                    onChange={(e) =>
                      setLang(e.target.value as 'badini' | 'sorani' | 'en' | 'ar')
                    }
                  >
                    <option value="badini">Badini</option>
                    <option value="sorani">Sorani</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>

              <button
                onClick={install}
                className="hidden lg:flex icon-btn"
                title={t('install')}
              >
                <Download size={18} />
              </button>

              {user ? (
                <Link
                  href="/account"
                  className="account-header-btn inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm"
                >
                  {isVip ? <Crown size={17} className="text-amber-300" /> : <UserRound size={17} />}
                  <span>{t('account')}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="account-header-btn inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm"
                >
                  <LogIn size={17} />
                  <span>{t('login')}</span>
                </Link>
              )}

              {user && profile?.uid && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex icon-btn"
                  title={t('admin')}
                >
                  <ShieldCheck size={18} />
                </Link>
              )}

              <button
                className="lg:hidden icon-btn"
                onClick={() => setOpen(!open)}
                aria-label="Menu"
              >
                {open ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          </div>

          {open && (
            <div className="lg:hidden border-t border-white/10 p-3 space-y-2 mobile-menu">
              {nav.map(([href, label, Icon]) => (
                <Link
                  onClick={() => setOpen(false)}
                  key={href}
                  href={href}
                  className={`mobile-nav-row ${
                    path === href ? 'active' : ''
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}

              <div className="grid grid-cols-4 gap-2 pt-2">
                <button
                  onClick={() => {
                    setLang('badini');
                    setOpen(false);
                  }}
                  className="language-btn"
                >
                  Badini
                </button>

                <button
                  onClick={() => {
                    setLang('sorani');
                    setOpen(false);
                  }}
                  className="language-btn"
                >
                  Sorani
                </button>

                <button
                  onClick={() => {
                    setLang('en');
                    setOpen(false);
                  }}
                  className="language-btn"
                >
                  English
                </button>

                <button
                  onClick={() => {
                    setLang('ar');
                    setOpen(false);
                  }}
                  className="language-btn"
                >
                  العربية
                </button>
              </div>

              <button
                onClick={install}
                className="mobile-nav-row"
              >
                <Download size={17} />
                {t('install')}
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="mobile-bottom-nav lg:hidden fixed bottom-0 inset-x-0 z-50 px-2 pb-[calc(.45rem+env(safe-area-inset-bottom))] pt-2">
        <div className="glass-header max-w-lg mx-auto rounded-2xl grid grid-cols-5 items-center p-1.5 shadow-2xl">
          {nav.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item ${
                path === href ? 'active' : ''
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-bold truncate max-w-[55px]">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
