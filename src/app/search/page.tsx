'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, Film, Radio } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { Protected } from '@/components/Protected';
import { ChannelCard } from '@/components/ChannelCard';
import { MediaCard } from '@/components/MediaCard';
import { getChannels, getMedia } from '@/lib/content';
import type { Channel, MediaItem } from '@/lib/types';
import { useApp } from '@/components/AppProvider';

export default function SearchPage() {
  const { t, isVip } = useApp();
  const [q, setQ] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    Promise.all([getChannels(true, isVip), getMedia(true, isVip)])
      .then(([cs, ms]) => { setChannels(cs); setMedia(ms); })
      .catch(() => {});
  }, [isVip]);

  const term = q.trim().toLowerCase();
  const channelResults = useMemo(() => channels.filter((c) => c.name.toLowerCase().includes(term)), [term, channels]);
  const mediaResults = useMemo(() => media.filter((m) => `${m.title} ${m.genre} ${m.description}`.toLowerCase().includes(term)), [term, media]);

  return (
    <PageShell>
      <Protected>
        <div className="max-w-6xl mx-auto space-y-7">
          <div>
            <div className="section-kicker inline-flex items-center gap-2"><SearchIcon size={15} /> DISCOVER</div>
            <h1 className="text-4xl font-black mt-2">{t('search')}</h1>
            <p className="text-slate-400 mt-2">فلم، دراما و کەنالێن دڵخوازت ل یەک شوێن بدۆزەوە.</p>
          </div>
          <div className="relative">
            <SearchIcon className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className="w-full glass rounded-2xl py-4 ps-12 pe-4 outline-none text-lg focus:ring-2 focus:ring-violet-500/30" />
          </div>

          {!term && <div className="glass rounded-3xl p-8 grid sm:grid-cols-3 gap-4">
            <DiscoverCard icon={<Film />} title="فلم" text="فلمێن نوێ و پڕبینەر" href="/films" />
            <DiscoverCard icon={<Radio />} title="کەنال" text="TV ـا ڕاستەوخۆ" href="/live" />
            <DiscoverCard icon={<SearchIcon />} title="ترێند" text="ناڤەڕۆکا پڕبینەر" href="/films" />
          </div>}

          {term && <>
            <ResultSection title="کەنالێن ڕاستەوخۆ" count={channelResults.length}>
              {channelResults.map((c) => <ChannelCard key={c.id} channel={c} />)}
            </ResultSection>
            <ResultSection title="فلم و دراما" count={mediaResults.length}>
              {mediaResults.map((m) => <MediaCard key={m.id} item={m} />)}
            </ResultSection>
            {!channelResults.length && !mediaResults.length && <div className="text-center py-16 text-slate-500">{t('noResults')}</div>}
          </>}
        </div>
      </Protected>
    </PageShell>
  );
}

function ResultSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return <section className="space-y-4"><div className="flex items-center gap-3"><h2 className="text-xl font-black">{title}</h2><span className="text-xs text-slate-500">{count}</span></div>{count > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{children}</div>}</section>;
}

function DiscoverCard({ icon, title, text, href }: { icon: React.ReactNode; title: string; text: string; href: string }) {
  return <a href={href} className="quick-card"><div className="quick-icon">{icon}</div><div><b>{title}</b><small>{text}</small></div></a>;
}
