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
    const sync = () => setFav(readLocalFavorites().some((x) => x.id === channel.id && x.type === 'channel'));
    sync();
    window.addEventListener('4u-favorites-changed', sync);
    return () => window.removeEventListener('4u-favorites-changed', sync);
  }, [channel.id]);

  useEffect(() => {
    if (!user) return;
    getFavorites(user.uid)
      .then((a) => setFav(a.some((x) => x.id === channel.id && x.type === 'channel')))
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
      <div className="channel-art aspect-[16/10] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative">
        <div className="absolute inset-0 channel-art-glow" />
        <div className="absolute inset-0 grid place-items-center p-3 sm:p-4">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              loading="lazy"
              decoding="async"
              className="channel-logo max-w-full max-h-full w-auto h-auto object-contain"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">
              <Radio size={25} className="text-violet-300" />
            </div>
          )}
        </div>

        <div className="absolute top-2 start-2 z-10 flex gap-1.5">
          {channel.accessLevel === 'vip' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/90 px-2 py-1 text-[10px] font-black text-white shadow-lg">
              <LockKeyhole size={11} /> VIP
            </span>
          )}
          {channel.enabled && (
            <span className="live-badge"><span /> LIVE</span>
          )}
        </div>

        <button
          onClick={favClick}
          className={`absolute top-2 end-2 p-2 rounded-xl bg-black/45 backdrop-blur text-slate-300 hover:text-yellow-300 z-10 ${fav ? 'text-yellow-300' : ''}`}
          aria-label="Favorite"
        >
          <Star size={16} fill={fav ? 'currentColor' : 'none'} />
        </button>

        <Link href={`/live?channel=${encodeURIComponent(channel.id)}`} className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition bg-black/35">
          <span className="h-12 w-12 rounded-full bg-white text-slate-900 grid place-items-center shadow-xl">
            <Play size={19} fill="currentColor" />
          </span>
        </Link>
      </div>

      <div className="p-3 sm:p-4">
        <div className="text-[10px] uppercase tracking-[.18em] text-violet-300 font-bold">{channel.category}</div>
        <h3 className="font-bold mt-1 truncate">{channel.name}</h3>
        <p className="text-xs text-slate-400 mt-1">{channel.description || 'Ready to watch'}</p>
      </div>
    </article>
  );
}
