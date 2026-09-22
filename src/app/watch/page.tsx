'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, LockKeyhole, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { Protected } from '@/components/Protected';
import { getEpisodeById, getFilmPartById, getFilmParts, getMediaById } from '@/lib/content';
import type { DramaEpisode, MediaPart, MediaItem } from '@/lib/types';
import { StreamPlayer } from '@/components/StreamPlayer';
import { useApp } from '@/components/AppProvider';
import { canAccess } from '@/lib/access';

type RecentEntry = { id: string; type: 'media' | 'episode'; title: string; image?: string; watchedAt: number };

function WatchInner() {
  const params = useSearchParams();
  const mediaId = params.get('media');
  const episodeId = params.get('episode');
  const partId = params.get('part');
  const { profile, isVip } = useApp();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [episode, setEpisode] = useState<DramaEpisode | null>(null);
  const [part, setPart] = useState<MediaPart | null>(null);
  const [siblingParts, setSiblingParts] = useState<MediaPart[]>([]);

  useEffect(() => {
    if (mediaId) getMediaById(mediaId, isVip).then(setItem).catch(() => {});
    if (episodeId) getEpisodeById(episodeId, isVip).then(setEpisode).catch(() => {});
  }, [mediaId, episodeId, isVip]);

  useEffect(() => {
    if (!partId) {
      setPart(null);
      return;
    }
    getFilmPartById(partId, isVip).then(setPart).catch(() => setPart(null));
  }, [partId, isVip]);

  // Only needed to show Part 1 / Part 2 navigation when this film has more than one part.
  useEffect(() => {
    if (!mediaId || !partId) {
      setSiblingParts([]);
      return;
    }
    getFilmParts(mediaId, isVip).then(setSiblingParts).catch(() => setSiblingParts([]));
  }, [mediaId, partId, isVip]);

  useEffect(() => {
    const currentId = partId || episodeId || mediaId;
    if (!currentId) return;
    const type = episodeId ? 'episode' : 'media';
    // Recent-watching always points back at the media id so it re-opens the film/drama page,
    // even when the last thing played was a specific part.
    const recentId = partId ? mediaId! : currentId;
    const titleNow = episode?.title || item?.title;
    const imageNow = item?.poster;
    if (!titleNow) return;
    try {
      const key = '4u-recent-watching';
      const old = JSON.parse(localStorage.getItem(key) || '[]') as RecentEntry[];
      const next: RecentEntry[] = [
        { id: recentId, type, title: titleNow, image: imageNow, watchedAt: Date.now() },
        ...old.filter((entry) => !(entry.id === recentId && entry.type === type)),
      ].slice(0, 12);
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event('4u-recent-watching-changed'));
    } catch {}
  }, [partId, episodeId, mediaId, episode?.title, item?.title, item?.poster]);

  const ready = partId ? Boolean(part) : true;
  const level = part?.accessLevel ?? item?.accessLevel ?? episode?.accessLevel;
  const allowed = canAccess(level, profile);
  const title = part ? part.title || `${item?.title ?? ''} — Part ${part.partNumber}` : episode?.title ?? item?.title ?? '';
  const back = episode
    ? `/drama/${encodeURIComponent(episode.dramaId)}`
    : item?.type === 'film'
      ? `/films/${encodeURIComponent(item.id)}`
      : '/drama';

  const prevPart = part ? siblingParts.filter((p) => p.partNumber < part.partNumber).slice(-1)[0] : undefined;
  const nextPart = part ? siblingParts.filter((p) => p.partNumber > part.partNumber)[0] : undefined;

  return (
    <Protected>
      {(item || episode) && ready && allowed ? (
        <div className="max-w-5xl mx-auto space-y-6">
          <Link href={back} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={16} /> Back
          </Link>

          <section className="glass rounded-3xl overflow-hidden">
            <StreamPlayer
              url={part?.streamUrl || episode?.streamUrl || item?.streamUrl}
              title={title}
              playerType={part?.playerType || episode?.playerType || item?.playerType}
              resumeKey={part?.id || episode?.id || item?.id}
            />
            <div className="p-6 sm:p-8">
              <div className="text-xs text-violet-300 font-bold uppercase">
                {episode
                  ? `Season ${episode.seasonNumber} · Episode ${episode.episodeNumber}`
                  : part
                    ? `${item?.type} · Part ${part.partNumber}${siblingParts.length ? ` of ${siblingParts.length}` : ''}`
                    : `${item?.type} · ${item?.year} · ${item?.genre}`}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mt-2">{title}</h1>
              <p className="text-slate-400 mt-4 leading-7">{part?.description || episode?.description || item?.description}</p>

              {part && siblingParts.length > 1 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {prevPart && (
                    <Link
                      href={`/watch?media=${encodeURIComponent(mediaId!)}&part=${encodeURIComponent(prevPart.id)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold"
                    >
                      <ChevronLeft size={16} /> Part {prevPart.partNumber}
                    </Link>
                  )}
                  {nextPart && (
                    <Link
                      href={`/watch?media=${encodeURIComponent(mediaId!)}&part=${encodeURIComponent(nextPart.id)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-950 text-sm font-black"
                    >
                      Part {nextPart.partNumber} <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="min-h-[60vh] grid place-items-center text-center">
          <div>
            {(item || episode) && ready && !allowed ? (
              <LockKeyhole className="mx-auto text-violet-300" size={42} />
            ) : (
              <ShieldAlert className="mx-auto text-amber-300" size={38} />
            )}
            <h1 className="text-2xl font-bold mt-4">{(item || episode) && ready && !allowed ? 'VIP content' : 'Content not found'}</h1>
            <p className="text-slate-500 mt-2">
              {(item || episode) && ready && !allowed
                ? 'This title is reserved for active VIP members.'
                : 'This title may have been removed or is not available.'}
            </p>
          </div>
        </div>
      )}
    </Protected>
  );
}
export default function Watch() {
  return (
    <PageShell>
      <Suspense fallback={<div className="min-h-[60vh] grid place-items-center text-slate-400">Loading…</div>}>
        <WatchInner />
      </Suspense>
    </PageShell>
  );
}
