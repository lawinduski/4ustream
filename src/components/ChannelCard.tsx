'use client';

import Link from 'next/link';
import { LockKeyhole, Play, Star, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Channel } from '@/lib/types';
import { readLocalFavorites, toggleFavorite, getFavorites } from '@/lib/favorites';
import { useApp } from './AppProvider';

export function ChannelCard({ channel }: { channel: Channel }) {
  const { user } = useApp();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const sync = () => {
      setFav(
        readLocalFavorites().some(
          (x) => x.id === channel.id && x.type === 'channel'
        )
      );
    };

    sync();

    window.addEventListener('4u-favorites-changed', sync);

    return () => {
      window.removeEventListener('4u-favorites-changed', sync);
    };
  }, [channel.id]);

  useEffect(() => {
    if (!user) return;

    getFavorites(user.uid)
      .then((a) =>
        setFav(
          a.some(
            (x) => x.id === channel.id && x.type === 'channel'
          )
        )
      )
      .catch(() => {});
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

  return (
    <article className="glass channel-card card-hover rounded-2xl overflow-hidden group relative">
      {/* Channel artwork */}
      <div className="channel-art aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 isolation-isolate">
        
        {/* Background glow */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_45%,rgba(139,92,246,.18),transparent_58%)]" />

        {/* Soft light */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        {/* Logo frame */}
        <div className="absolute inset-3 sm:inset-4 z-[1] rounded-2xl border border-white/10 bg-white/[0.025] shadow-inner overflow-hidden">
          
          {/* Inner glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.07),transparent_65%)]" />

          {/* Logo */}
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                loading="lazy"
                decoding="async"
                className="relative z-10 block max-w-[82%] max-h-[72%] w-auto h-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,.55)] transition-transform duration-500 group-hover:scale-[1.05]"
              />
            ) : (
              <div className="relative z-10 h-16 w-16 rounded-2xl bg-white/5 border border-white/10 grid place-items-center shadow-xl">
                <Radio size={25} className="text-violet-300" />
              </div>
            )}
          </div>
        </div>

        {/* Top badges */}
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
          onClick={favClick}
          className={`absolute top-2.5 end-2.5 z-30 h-9 w-9 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 grid place-items-center text-slate-300 transition-all duration-200 hover:bg-black/70 hover:text-yellow-300 ${
            fav ? 'text-yellow-300' : ''
          }`}aria-label="Favorite"
        >
          <Star
            size={16}
            fill={fav ? 'currentColor' : 'none'}
          />
        </button>

        {/* Play overlay */}
        <Link
          href={`/live?channel=${encodeURIComponent(channel.id)}`}
          aria-label={`Watch ${channel.name}`}
          className="absolute inset-0 z-20 flex items-end justify-center pb-3 sm:pb-4 bg-gradient-to-t from-black/65 via-black/5 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
        >
          <span className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white text-slate-950 grid place-items-center shadow-[0_10px_35px_rgba(0,0,0,.45)] border border-white/20 transition-transform duration-300 hover:scale-110">
            <Play size={18} fill="currentColor" />
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
}
