'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock3, LockKeyhole, Play, PlayCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { Protected } from '@/components/Protected';
import { getFilmParts, getMediaById } from '@/lib/content';
import { useApp } from '@/components/AppProvider';
import type { FilmPart, MediaItem } from '@/lib/types';

export default function FilmDetails() {
  const { isVip } = useApp();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const [film, setFilm] = useState<MediaItem | null>(null);
  const [parts, setParts] = useState<FilmPart[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getMediaById(id).then(setFilm).catch(() => {});
  }, [id]);

  useEffect(() => {
    getFilmParts(id, isVip)
      .then(setParts)
      .catch(() => setParts([]))
      .finally(() => setLoaded(true));
  }, [id, isVip]);

  return (
    <PageShell>
      <Protected>
        {film?.type === 'film' ? (
          <div className="max-w-5xl mx-auto space-y-7">
            <Link href="/films" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <ArrowLeft size={16} /> Films
            </Link>

            <section className="glass rounded-[2rem] overflow-hidden">
              <div className="grid lg:grid-cols-[280px_1fr] gap-0">
                <div className="aspect-[2/3] lg:aspect-auto bg-slate-900">
                  <img src={film.poster} alt={film.title} sizes="(max-width: 1024px) 100vw, 280px" className="w-full h-full object-cover" />
                </div>
                <div className="p-6 sm:p-9 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-violet-300 text-xs font-black uppercase tracking-widest">
                    <span>{film.year}</span>
                    <span>•</span>
                    <span>{film.genre}</span>
                    {film.accessLevel === 'vip' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-1">
                        <LockKeyhole size={12} /> VIP
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black mt-3">{film.title}</h1>
                  <p className="text-slate-400 leading-7 mt-4 max-w-2xl">{film.description}</p>

                  {/* Films with no parts play directly, exactly as before. */}
                  {loaded && parts.length === 0 && (
                    <Link
                      href={`/watch?media=${encodeURIComponent(film.id)}`}
                      className="mt-7 inline-flex items-center gap-2 w-fit px-5 py-3 rounded-xl bg-white text-slate-950 font-black"
                    >
                      <Play size={17} fill="currentColor" /> Play film
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {parts.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black">Parts</h2>
                  <span className="text-xs text-slate-500">{parts.length} parts</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {parts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/watch?media=${encodeURIComponent(film.id)}&part=${encodeURIComponent(p.id)}`}
                      className="glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[.07] transition"
                    >
                      <span className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-300 grid place-items-center font-black">
                        {String(p.partNumber).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate">{p.title || `Part ${p.partNumber}`}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <Clock3 size={12} />
                          {p.durationMinutes ? `${p.durationMinutes} min` : 'Part'}
                          {p.accessLevel === 'vip' && (
                            <>
                              <span>•</span>
                              <span className="text-violet-300">VIP</span>
                            </>
                          )}
                        </div>
                      </div>
                      <PlayCircle size={20} className="text-slate-400" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {loaded && parts.length === 0 && !film.streamUrl && (
              <div className="glass rounded-2xl p-10 text-center text-slate-500">No stream is configured for this film yet.</div>
            )}
          </div>
        ) : (
          <div className="min-h-[60vh] grid place-items-center text-slate-500">Film not found.</div>
        )}
      </Protected>
    </PageShell>
  );
}
