'use client';

import Link from 'next/link';
import {
  ArrowUpLeft,
  Play,
  ShieldCheck,
  Smartphone,
  Crown,
  Radio,
  Film,
  Clapperboard,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { ChannelCard } from '@/components/ChannelCard';
import { MediaCard } from '@/components/MediaCard';
import { getChannels, getMedia } from '@/lib/content';
import { getAds } from '@/lib/ads';
import { AdRotator } from '@/components/AdRotator';
import type { AdBanner, Channel, MediaItem } from '@/lib/types';
import { useApp } from '@/components/AppProvider';

export default function Home() {
  const { t, isVip, user } = useApp();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);

  useEffect(() => {
    Promise.all([
      getChannels(true, isVip),
      getMedia(true, isVip),
      getAds(true),
    ])
      .then(([cs, ms, as]) => {
        setChannels(cs);
        setMedia(ms);
        setAds(as);
      })
      .catch(() => {});
  }, [isVip]);

  const films = media.filter((x) => x.type === 'film');
  const dramas = media.filter((x) => x.type === 'drama');

  return (
    <PageShell>
      <div className="home-stage fade-up">
        {ads.length > 0 && <AdRotator ads={ads} />}

        <section className="hero-premium">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-a" />
          <div className="hero-glow hero-glow-b" />

          <div className="relative z-10 max-w-3xl">
            <div className="eyebrow">
              <span className="live-dot" /> 4uStream • BADINI FIRST
            </div>

            <h1 className="hero-title">{t('welcome')}</h1>
            <p className="hero-copy">{t('subtitle')}</p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/live" className="primary-cta">
                <Play size={17} fill="currentColor" />
                {t('live')}
                <ArrowUpLeft size={17} />
              </Link>

              <Link
                href={user ? '/account' : '/signup'}
                className="secondary-cta"
              >
                {user ? (isVip ? 'VIP MEMBER' : 'FREE ACCOUNT') : t('signup')}
                <Crown size={16} />
              </Link>
            </div>

            <div className="hero-metrics">
              <span>
                <Zap size={14} /> Fast UI
              </span>
              <span>
                <ShieldCheck size={14} /> Secure access
              </span>
              <span>
                <Smartphone size={14} /> PWA
              </span>
            </div>
          </div>
        </section>

        <div className="quick-grid">
          <Quick href="/live" icon={<Radio />} title={t('live')} text="Live channels" />
          <Quick href="/films" icon={<Film />} title={t('films')} text="Free & VIP films" />
          <Quick
            href="/drama"
            icon={<Clapperboard />}
            title={t('drama')}
            text="Seasons & episodes"
          />
          <Quick
            href="/account"
            icon={<Crown />}
            title="VIP"
            text={isVip ? 'Your VIP is active' : 'Explore VIP'}
          />
        </div>

        {channels.length > 0 && (
          <PremiumSection title={t('live')} href="/live">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {channels.slice(0, 8).map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </PremiumSection>
        )}

        {films.length > 0 && (
          <PremiumSection title={t('films')} href="/films">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {films.slice(0, 10).map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </PremiumSection>
        )}

        {dramas.length > 0 && (
          <PremiumSection title={t('drama')} href="/drama">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {dramas.slice(0, 10).map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </PremiumSection>
        )}
      </div>
    </PageShell>
  );
}

function Quick({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link href={href} className="quick-card">
      <div className="quick-icon">{icon}</div>
      <div>
        <b>{title}</b>
        <small>{text}</small>
      </div>
      <ChevronLeft size={16} className="ms-auto opacity-40" />
    </Link>
  );
}

function PremiumSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="premium-section">
      <div className="section-heading">
        <div>
          <div className="section-kicker">4uSTREAM</div>
          <h2>{title}</h2>
        </div>
        <Link href={href}>
          View all <ChevronLeft size={15} />
        </Link>
      </div>
      {children}
    </section>
  );
}
