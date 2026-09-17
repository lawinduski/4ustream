'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { Protected } from '@/components/Protected';
import { getMedia } from '@/lib/content';
import type { MediaItem } from '@/lib/types';
import { useApp } from '@/components/AppProvider';
import { LockKeyhole, PlayCircle } from 'lucide-react';

export default function Drama() {
  const { t, isVip } = useApp();
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    getMedia(true, isVip)
      .then((x) =>
        setItems(
          x.filter(
            (i) => i.type === 'drama' && i.enabled !== false
          )
        )
      )
      .catch(() => setItems([]));
  }, [isVip]);

  return (
    <PageShell>
      <Protected>
        <div className="space-y-8">
          <div>
            <div className="inline-flex px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs font-black">
              {isVip ? 'VIP ACCESS' : 'FREE ACCESS'}
            </div>

            <h1 className="text-4xl font-black">
              {t('drama')}
            </h1>

            <p className="text-slate-400 mt-2">
              Watch your active authorized drama catalog.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/drama/${encodeURIComponent(item.id)}`}
                className="glass rounded-2xl overflow-hidden group card-hover"
              >
                <div className="relative aspect-[2/3] bg-slate-900">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-500">
                      No Poster
                    </div>
                  )}

                  {item.accessLevel === 'vip' && (
                    <span className="absolute top-2 start-2 z-10 inline-flex items-center gap-1 rounded-full bg-violet-500/90 px-2 py-1 text-[10px] font-black text-white shadow-lg">
                      <LockKeyhole size={11} />
                      VIP
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center">
                    <span className="h-12 w-12 rounded-full bg-white text-slate-900 grid place-items-center shadow-xl">
                      <PlayCircle size={22} fill="currentColor" />
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <div className="text-[10px] uppercase tracking-[.18em] text-violet-300 font-bold">
                    {item.genre || 'Drama'}
                  </div>

                  <h3 className="font-bold mt-1 truncate">
                    {item.title}
                  </h3>

                  <div className="text-xs text-slate-500 mt-1">
                    {item.year}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {!items.length && (
            <div className="text-center py-20 text-slate-500">
              No dramas are active yet.
            </div>
          )}
        </div>
      </Protected>
    </PageShell>
  );
}
