'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, LockKeyhole, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { PageShell } from '@/components/PageShell';
import { Protected } from '@/components/Protected';
import { getEpisodeById, getMediaById } from '@/lib/content';
import type { DramaEpisode, MediaItem } from '@/lib/types';
import { StreamPlayer } from '@/components/StreamPlayer';
import { useApp } from '@/components/AppProvider';
import { canAccess } from '@/lib/access';

function WatchInner() {
  const params = useSearchParams();

  const mediaId = params.get('media');
  const episodeId = params.get('episode');

  const { profile } = useApp();

  const [item, setItem] = useState<MediaItem | null>(null);
  const [episode, setEpisode] = useState<DramaEpisode | null>(null);

  useEffect(() => {
    if (mediaId) {
      getMediaById(mediaId)
        .then(setItem)
        .catch(() => {});
    }

    if (episodeId) {
      getEpisodeById(episodeId)
        .then(setEpisode)
        .catch(() => {});
    }
  }, [mediaId, episodeId]);

  const level = item?.accessLevel ?? episode?.accessLevel;
  const allowed = canAccess(level, profile);

  const title = episode?.title ?? item?.title ?? '';

  const back = episode
    ? '/drama/${encodeURIComponent(episode.dramaId)}'
    : item?.type === 'film'
      ? '/films'
      : '/drama';

  const episodeInfo = episode
    ? 'Season ${episode.seasonNumber} · Episode ${episode.episodeNumber}'
    : item
      ? '${item.type} · ${item.year} · ${item.genre}'
      : '';

  return (
    <Protected>
      {(item || episode) && allowed ? (
        <div className="max-w-5xl mx-auto space-y-6">
          <Link
            href={back}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <section className="glass rounded-3xl overflow-hidden">
            <StreamPlayer
              url={episode?.streamUrl || item?.streamUrl  || ''}
              title={title}
              playerType={episode?.playerType || item?.playerType}
            />

            <div className="p-6 sm:p-8">
              <div className="text-xs text-violet-300 font-bold uppercase">
                {episodeInfo}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black mt-2">
                {title}
              </h1>

              <p className="text-slate-400 mt-4 leading-7">
                {episode?.description || item?.description}
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="min-h-[60vh] grid place-items-center text-center">
          <div>
            {(item || episode) && !allowed ? (
              <LockKeyhole
                className="mx-auto text-violet-300"
                size={42}
              />
            ) : (
              <ShieldAlert
                className="mx-auto text-amber-300"
                size={38}
              />
            )}

            <h1 className="text-2xl font-bold mt-4">
              {(item || episode) && !allowed
                ? 'VIP content'
                : 'Content not found'}
            </h1>

            <p className="text-slate-500 mt-2">
              {(item || episode) && !allowed
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
      <Suspense
        fallback={
          <div className="min-h-[60vh] grid place-items-center text-slate-400">
            Loading…
          </div>
        }
      >
        <WatchInner />
      </Suspense>
    </PageShell>
  );
}