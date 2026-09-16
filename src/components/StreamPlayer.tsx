'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Play, ShieldAlert } from 'lucide-react';
import type { PlayerType } from '@/lib/types';

export function StreamPlayer({ url, title, playerType = 'video' }: { url?: string; title: string; playerType?: PlayerType }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(url));

  useEffect(() => {
    if (!url || playerType !== 'video' || !videoRef.current) return;
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    const video = videoRef.current;
    setError(''); setLoading(true);
    const setup = async () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        return;
      }
      if (/\.m3u8(?:\?|$)/i.test(url)) {
        try {
          const Hls = (await import('hls.js')).default;
          if (cancelled) return;
          if (Hls.isSupported()) {
            hls = new Hls({ enableWorker: true });
            (hls as any).loadSource(url);
            (hls as any).attachMedia(video);
          } else setError('This browser cannot play this HLS stream.');
        } catch { setError('HLS player could not be loaded.'); }
      } else video.src = url;
    };
    setup();
    return () => { cancelled = true; if (hls) hls.destroy(); video.removeAttribute('src'); video.load(); };
  }, [url, playerType]);

  if (!url) return <div className="aspect-video bg-black grid place-items-center text-center p-6"><ShieldAlert className="text-amber-300"/><p className="mt-3 text-sm text-slate-400">No authorized stream is configured yet.</p></div>;
  if (playerType === 'iframe') return <iframe title={title} src={url} className="w-full aspect-video border-0 bg-black" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />;
  return <div className="relative aspect-video bg-black"><video ref={videoRef} controls playsInline preload="metadata" className="w-full h-full" onCanPlay={() => setLoading(false)} onError={() => { setLoading(false); setError('The stream could not be played. Check the URL and player type.'); }} /><div className="absolute inset-0 pointer-events-none grid place-items-center">{loading && !error && <Loader2 className="animate-spin text-white/80" size={34}/>} {error && <div className="pointer-events-auto text-center px-5"><ShieldAlert className="mx-auto text-amber-300" size={32}/><p className="mt-3 text-sm text-slate-300">{error}</p></div>}</div><div className="absolute bottom-16 start-1/2 -translate-x-1/2 pointer-events-none opacity-0"><Play/></div></div>;
}
