'use client';

import Link from 'next/link';
import { LockKeyhole, Play, Star, Radio } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import type { Channel } from '@/lib/types';
import {
  isRemoteFavorite,
  readLocalFavorites,
  toggleFavorite,
} from '@/lib/favorites';
import { useApp } from './AppProvider';

export const ChannelCard = memo(function ChannelCard({ channel }: { channel: Channel }) {
  const { user } = useApp();
  const [fav, setFav] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [channel.logo]);

  useEffect(() => {
    let active = true;

    const sync = () => {
      if (!user) {
        setFav(
          readLocalFavorites().some(
            (x) => x.id === channel.id && x.type === 'channel'
          )
        );
        return;
      }

      isRemoteFavorite(user.uid, { id: channel.id, type: 'channel' })
        .then(value => {
          if (active) setFav(value);
        })
        .catch(() => {});
    };

    sync();
    window.addEventListener('4u-favorites-changed', sync);

    return () => {
      active = false;
      window.removeEventListener('4u-favorites-changed', sync);
    };
  }, [user, channel.id]);

  const favClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = await toggleFavorite(user?.uid, {
      id: channel.id,
      type: 'channel',
      title: channel.name,
      image: channel.logo,
    });

    setFav(next);
  };

  const showFallback = !channel.logo || logoError;

  return (
    <article className="glass channel-card card-hover rounded-2xl overflow-hidden group relative">
      {/* Channel thumbnail */}
      <div className="channel-art aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 isolation-isolate">
        {/* Premium background glow */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_45%,rgba(139,92,246,.16),transparent_62%)]" />

        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        {/* Logo area */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center p-2 sm:p-3">
          <div className="channel-logo-surface relative flex items-center justify-center w-[86%] h-[82%] rounded-[1.35rem] overflow-hidden border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_12px_35px_rgba(0,0,0,.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.055),transparent_68%)] pointer-events-none" />

            {showFallback ? (
              <div className="relative z-10 flex flex-col items-center justify-center gap-2 px-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.07] border border-white/10 grid place-items-center">
                  <Radio size={23} className="text-violet-300" />
                </div>

                <span className="max-w-[90%] text-xs font-bold text-slate-300 truncate">
                  {channel.name}
                </span>
              </div>
            ) : (
              <img
                src={channel.logo}
                alt={channel.name}
                loading="lazy"
                decoding="async"
                onError={() => setLogoError(true)}
                className="channel-logo relative z-10 block w-[84%] h-[82%] object-contain object-center"
              />
            )}
          </div>
        </div>

        {/* LIVE / VIP badges */}
        <div className="absolute top-2.5 start-2.5 z-30 flex items-center gap-1.5">
          {channel.accessLevel === 'vip' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/90 px-2.5 py-1 text-[10px] font-black text-white shadow-lg backdrop-blur-xl">
              <LockKeyhole size={11} />
              VIP
            </span>
          )}

          {channel.enabled && (
            <span className="live-badge">
              <span />
              LIVE
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          type="button"
          onClick={favClick}
          aria-label="Favorite"
          className={`absolute top-2.5 end-2.5 z-40 h-9 w-9 rounded-xl bg-black/55 backdrop-blur-xl border border-white/10 grid place-items-center text-slate-300 transition-all duration-200 hover:bg-black/75 hover:text-yellow-300 ${
            fav ? 'text-yellow-300' : ''
          }`}
        >
          <Star
            size={16}
            fill={fav ? 'currentColor' : 'none'}
          />
        </button>

        {/* Play button */}
        <Link
          href={`/live?channel=${encodeURIComponent(channel.id)}`}
          aria-label={`Watch ${channel.name}`}
          className="absolute inset-0 z-20 flex items-end justify-center pb-3 pointer-events-none opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
        >
          <span className="pointer-events-auto h-10 w-10 rounded-full bg-white/95 text-slate-950 grid place-items-center shadow-[0_8px_25px_rgba(0,0,0,.42)] border border-white/30 transition-transform duration-200 hover:scale-110">
            <Play size={16} fill="currentColor" />
          </span>
        </Link>
      </div>

      {/* Channel information */}
      <div className="p-3.5 sm:p-4">
        <div className="text-[10px] uppercase tracking-[.18em] text-violet-300 font-bold">
          {channel.category}
        </div>

        <h3 className="font-bold mt-1 truncate">
          {channel.name}
        </h3>

        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
          {channel.description || 'Ready to watch'}
        </p>
      </div>
    </article>
  );
});
