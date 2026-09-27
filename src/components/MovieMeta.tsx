'use client';
import { Clock3, Globe2, Languages, Star } from 'lucide-react';
import { formatRuntime, getGenres } from '@/lib/media-meta';
import type { MediaItem } from '@/lib/types';

export function MovieMeta({ item }: { item: MediaItem }) {
  const runtime = formatRuntime(item.runtimeMinutes);
  const genres = getGenres(item);
  return <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
    <span className="rounded-full glass px-3 py-1.5 font-bold">{item.year}</span>
    {item.rating != null && <span className="rounded-full glass px-3 py-1.5 inline-flex items-center gap-1 font-bold"><Star size={13} className="text-yellow-300" fill="currentColor" /> {item.rating.toFixed(1)}{item.ratingCount ? ` (${item.ratingCount})` : ''}</span>}
    {runtime && <span className="rounded-full glass px-3 py-1.5 inline-flex items-center gap-1"><Clock3 size={13}/>{runtime}</span>}
    {item.country && <span className="rounded-full glass px-3 py-1.5 inline-flex items-center gap-1"><Globe2 size={13}/>{item.country}</span>}
    {item.originalLanguage && <span className="rounded-full glass px-3 py-1.5 inline-flex items-center gap-1"><Languages size={13}/>{item.originalLanguage}</span>}
    {genres.map(g => <span key={g} className="rounded-full bg-violet-500/10 text-violet-300 px-3 py-1.5 font-semibold">{g}</span>)}
    {item.quality?.map(q => <span key={q} className="rounded-full border border-white/10 px-3 py-1.5 font-black">{q}</span>)}
  </div>;
}
