'use client';

import Link from 'next/link';
import {
  ArrowUpLeft, Play, ShieldCheck, Smartphone, Crown, Radio, Film, Clapperboard,
  ChevronLeft, ChevronRight, Zap, Search, Star, LockKeyhole, Layers3, Flame, Clock3,
  Sparkles, TrendingUp, Grid2X2, Heart, Tv2
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { ChannelCard } from '@/components/ChannelCard';
import { MediaCard } from '@/components/MediaCard';
import { getChannels, getMedia } from '@/lib/content';
import { getAds } from '@/lib/ads';
import { AdRotator } from '@/components/AdRotator';
import type { AdBanner, Channel, MediaItem } from '@/lib/types';
import { useApp } from '@/components/AppProvider';

type RecentItem = { id: string; type: 'media' | 'episode'; title: string; image?: string; watchedAt: number };

export default function Home() {
  const { t, isVip, user } = useApp();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getChannels(true, isVip), getMedia(true, isVip), getAds(true)])
      .then(([cs, ms, as]) => {
        if (!mounted) return;
        setChannels(cs);
        setMedia(ms);
        setAds(as);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [isVip]);

  useEffect(() => {
    const loadRecent = () => {
      try {
        const parsed = JSON.parse(localStorage.getItem('4u-recent-watching') || '[]');
        setRecent(Array.isArray(parsed) ? parsed.slice(0, 8) : []);
      } catch {
        setRecent([]);
      }
    };
    loadRecent();
    window.addEventListener('4u-recent-watching-changed', loadRecent);
    return () => window.removeEventListener('4u-recent-watching-changed', loadRecent);
  }, [user]);

  const films = useMemo(() => media.filter((x) => x.type === 'film'), [media]);
  const dramas = useMemo(() => media.filter((x) => x.type === 'drama'), [media]);
  const featured = films[0] || dramas[0];
  const vipItems = useMemo(() => media.filter((x) => x.accessLevel === 'vip'), [media]);
  const topRated = useMemo(() => [...media].sort((a: any, b: any) => (Number(b.rating) || 0) - (Number(a.rating) || 0)), [media]);
  const newest = useMemo(() => [...media].sort((a, b) => b.year - a.year), [media]);
  const recentMedia = useMemo(() => recent.map((r) => media.find((m) => m.id === r.id)).filter(Boolean) as MediaItem[], [recent, media]);

  return (
    <PageShell>
      <div className="home-stage fade-up">
        {ads.length > 0 && <AdRotator ads={ads} />}

        <section className="hero-premium hero-cinema">
          {featured?.poster && <img src={featured.poster} alt="" className="hero-backdrop" aria-hidden="true" />}
          <div className="hero-backdrop-shade" />
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-a" />
          <div className="hero-glow hero-glow-b" />
          <div className="relative z-10 grid lg:grid-cols-[1fr_250px] gap-8 items-center">
            <div className="max-w-4xl">
              <div className="eyebrow"><span className="live-dot" /> 4uSTREAM • BADINI FIRST</div>
              <div className="hero-kicker"><Sparkles size={13} /> سینەمای خێرا بۆ هەموو ئامێرەکان</div>
              <h1 className="hero-title">{featured?.title || t('welcome')}</h1>
              <p className="hero-copy">فلم، دراما و کەنالێن ڕاستەوخۆ ل یەک شوێن. ناڤەڕۆکا FREE و VIP ب شێوازەکێ پڕۆفیشنال، خێرا و ئاسان بۆ موبایل و Smart TV.</p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href={featured ? `/watch?media=${encodeURIComponent(featured.id)}` : '/films'} className="primary-cta"><Play size={17} fill="currentColor" /> {t('watch')} <ArrowUpLeft size={17} /></Link>
                <Link href="/films" className="secondary-cta"><Film size={16} /> {t('films')}</Link>
                <Link href="/live" className="secondary-cta"><Radio size={16} /> {t('live')}</Link>
              </div>
              <div className="hero-metrics">
                <span><Zap size={14} /> پەخشی خێرا</span>
                <span><ShieldCheck size={14} /> پارێزراو</span>
                <span><Smartphone size={14} /> موبایل</span>
                <span><Crown size={14} /> FREE / VIP</span>
              </div>
            </div>
            {featured && (
              <Link href={`/watch?media=${encodeURIComponent(featured.id)}`} className="hero-poster-card hidden lg:block">
                <img src={featured.poster} alt={featured.title} loading="eager" />
                <div><span>{featured.type === 'drama' ? 'DRAMA' : 'FILM'}</span><b>{featured.year}</b></div>
              </Link>
            )}
          </div>
        </section>

        <div className="quick-grid">
          <Quick href="/search" icon={<Search />} title={t('discover')} text="لێگەریان ل ناڤەڕۆکێن هەمی" />
          <Quick href="/films" icon={<Film />} title={t('films')} text="فلمێن نوێ و پڕبینەر" />
          <Quick href="/drama" icon={<Clapperboard />} title={t('drama')} text="وەرز و ئەڵقە" />
          <Quick href="/account" icon={<Crown />} title="VIP" text={isVip ? 'VIP چالاکە' : 'ناڤەڕۆکا VIP ببینە'} />
        </div>

        <section className="discovery-strip glass rounded-2xl p-3 sm:p-4">
          <div className="discovery-title"><Grid2X2 size={16} /> دۆزینەوە</div>
          <div className="discovery-links">
            <Link href="/live"><Tv2 size={15} /> TV</Link>
            <Link href="/live?category=SPORTS"><TrendingUp size={15} /> وەرزش</Link>
            <Link href="/films"><Film size={15} /> فلم</Link>
            <Link href="/drama"><Clapperboard size={15} /> دراما</Link>
            <Link href="/account"><Heart size={15} /> دڵخواز</Link>
            <Link href="/search"><Search size={15} /> لێگەریان</Link>
          </div>
        </section>

        {channels.length > 0 && <PremiumSection kicker={t('live')} title="کەنالێن ڕاستەوخۆ" href="/live" icon={<Radio size={18} />} rail>
          {channels.slice(0, 10).map((c) => <ChannelCard key={c.id} channel={c} />)}
        </PremiumSection>}

        {recentMedia.length > 0 && <PremiumSection kicker={t('continueWatching')} title="هەر ل شوێنا خۆت بەردەوام بە" href="/account" icon={<Clock3 size={18} />} rail>
          {recentMedia.map((x) => <MediaCard key={x.id} item={x} />)}
        </PremiumSection>}

        {newest.length > 0 && <PremiumSection kicker={t('latest')} title="نوێترین ناڤەڕۆک" href="/films" icon={<Sparkles size={18} />} rail>
          {newest.slice(0, 10).map((x) => <MediaCard key={x.id} item={x} />)}
        </PremiumSection>}

        {dramas.length > 0 && <PremiumSection kicker={t('trending')} title="درامای پڕبینەر" href="/drama" icon={<Flame size={18} />} rail>
          {dramas.slice(0, 10).map((x) => <MediaCard key={x.id} item={x} />)}
        </PremiumSection>}

        {topRated.length > 0 && <PremiumSection kicker={t('topRated')} title="باشترین هەڵبژاردەکان" href="/films" icon={<Star size={18} />} rail>
          {topRated.slice(0, 10).map((x) => <MediaCard key={x.id} item={x} />)}
        </PremiumSection>}

        {vipItems.length > 0 && <section className="vip-showcase glass rounded-[2rem] p-6 sm:p-9">
          <div className="flex flex-col lg:flex-row lg:items-center gap-7">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 grid place-items-center shrink-0 shadow-2xl"><Crown size={30} /></div>
            <div className="flex-1">
              <div className="section-kicker">{t('vipOnly')}</div>
              <h2 className="text-2xl sm:text-3xl font-black mt-2">ئەزموونا VIP بۆ ناڤەڕۆکا تایبەت</h2>
              <p className="text-slate-400 mt-2 leading-7">هەر فلم، دراما، ئەڵقە یان کەنالەکێ دەتوانرێت لە لایەن ئەدمینەوە FREE یان VIP بکرێت.</p>
            </div>
            <Link href="/account" className="primary-cta"><Crown size={16} /> {isVip ? 'VIP ـا من' : 'بینینا VIP'}</Link>
          </div>
          <div className="mt-7 rail-grid vip-rail">{vipItems.slice(0, 6).map((x) => <MediaCard key={x.id} item={x} />)}</div>
        </section>}

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Feature icon={<Zap />} title="پەخشی خێرا" text="پەخش بۆ موبایل و کۆمپیوتەر." />
          <Feature icon={<LockKeyhole />} title="FREE / VIP" text="دەستگەیشتن بەپێی پلانی بەکارهێنەر." />
          <Feature icon={<Layers3 />} title="وەرز و ئەڵقە" text="دراما ب شێوەی ڕێکخراو." />
          <Feature icon={<Clock3 />} title="ئەزموونا بەردەوام" text="لە شوێنی خۆت بەردەوام بە." />
        </section>
      </div>
    </PageShell>
  );
}

function Quick({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link href={href} className="quick-card"><div className="quick-icon">{icon}</div><div><b>{title}</b><small>{text}</small></div><ChevronLeft size={16} className="ms-auto opacity-40" /></Link>;
}

function PremiumSection({ kicker, title, href, icon, children, rail = false }: { kicker: string; title: string; href: string; icon: React.ReactNode; children: React.ReactNode; rail?: boolean }) {
  return <section className="premium-section">
    <div className="section-heading"><div><div className="section-kicker inline-flex items-center gap-2">{icon}{kicker}</div><h2>{title}</h2></div><Link href={href}>{'هەموو ببینە'} <ChevronLeft size={15} /></Link></div>
    {rail ? <div className="rail-grid">{children}</div> : children}
  </section>;
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="quick-card"><div className="quick-icon">{icon}</div><div><b>{title}</b><small>{text}</small></div></div>;
}
