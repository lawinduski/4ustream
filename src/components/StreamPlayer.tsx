'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Maximize, PictureInPicture, Play, RotateCcw, RotateCw, ShieldAlert } from 'lucide-react';
import type { MediaServer, PlayerType, SubtitleTrack } from '@/lib/types';

type Props = {
  url?: string;
  title: string;
  playerType?: PlayerType;
  resumeKey?: string;
  live?: boolean;
  poster?: string;
  subtitles?: SubtitleTrack[];
  skipIntroSeconds?: number;
  logoUrl?: string;
  onEnded?: () => void;
  servers?: MediaServer[];
};

export function StreamPlayer({
  url,
  title,
  playerType = 'video',
  resumeKey,
  live = false,
  poster,
  subtitles = [],
  skipIntroSeconds,
  logoUrl = '/IMG_6501.jpeg',
  onEnded,
  servers = [],
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const lastSaved = useRef(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(url));
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [qualities, setQualities] = useState<number[]>([]);
  const [quality, setQuality] = useState(-1);
  const [showQuality, setShowQuality] = useState(false);
  const enabledServers = useMemo(() => servers.filter((s) => s.enabled !== false && s.url), [servers]);
  const [serverIndex, setServerIndex] = useState(0);
  useEffect(() => { setServerIndex(0); }, [url, servers]);
  const activeSource = enabledServers[serverIndex]?.url || url;
  const activeType = enabledServers[serverIndex]?.playerType || playerType;

  const subtitleTracks = useMemo(
    () => subtitles.filter((track) => track.src && track.label && track.language),
    [subtitles]
  );

  useEffect(() => {
    if (!activeSource || activeType === 'iframe') return;
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || '4uStream',
        artist: live ? 'Live TV' : '4uStream',
        album: '4uStream',
        artwork: [{ src: logoUrl, sizes: '512x512' }],
      });
    } catch {}

    return () => {
      try { navigator.mediaSession.metadata = null; } catch {}
    };
  }, [activeSource, activeType, title, live, logoUrl]);

  useEffect(() => {
    if (!activeSource || (activeType !== 'video' && activeType !== 'hls') || !videoRef.current) return;

    let cancelled = false;
    const video = videoRef.current;
    setError('');
    setLoading(true);
    setQualities([]);
    setQuality(-1);

    const restore = () => {
      if (!resumeKey || live) return;
      try {
        const saved = Number(localStorage.getItem(`4u-progress:${resumeKey}`) || 0);
        if (Number.isFinite(saved) && saved > 5 && saved < Math.max(video.duration - 10, 0)) {
          video.currentTime = saved;
        }
      } catch {}
    };

    const saveProgress = () => {
      if (!resumeKey || live || !Number.isFinite(video.currentTime) || video.currentTime < 5) return;
      const now = Date.now();
      if (now - lastSaved.current < 4000) return;
      lastSaved.current = now;
      try { localStorage.setItem(`4u-progress:${resumeKey}`, String(Math.floor(video.currentTime))); } catch {}
    };

    const updateState = () => {
      setCurrentTime(video.currentTime || 0);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      if ('mediaSession' in navigator) {
        try { navigator.mediaSession.playbackState = video.paused ? 'paused' : 'playing'; } catch {}
      }
    };

    const setup = async () => {
      if (cancelled) return;
      if (!activeSource) return;
      
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeSource;
        return;
      }
      if (/\.m3u8(?:\?|$)/i.test(activeSource) || activeType === 'hls') {
        try {
          const Hls = (await import('hls.js')).default;
          if (cancelled) return;
          if (!Hls.isSupported()) {
            setError('This browser cannot play this HLS stream.');
            return;
          }
          const hls = new Hls({ enableWorker: true, lowLatencyMode: live, backBufferLength: 30, maxBufferLength: 20, maxMaxBufferLength: 30 });
          hlsRef.current = hls;
          hls.on(Hls.Events.MANIFEST_PARSED, (_event: unknown, data: { levels?: Array<{ height?: number }> }) => {
            const levels = (data.levels || []).map((level) => level.height || 0).filter((height) => height > 0);
            setQualities([...new Set(levels)].sort((a, b) => a - b));
            setLoading(false);
          });
          hls.on(Hls.Events.ERROR, (_event: unknown, data: { fatal?: boolean }) => {
            if (data.fatal) setError('The stream could not be played. Check the URL and player type.');
          });
          hls.loadSource(activeSource);
          hls.attachMedia(video);
        } catch {
          setError('HLS player could not be loaded.');
        }
      } else {
        video.src = activeSource;
      }
    };

    const play = () => video.play().catch(() => {});
    const pause = () => video.pause();
    const seek = (delta: number) => {
      if (!Number.isFinite(video.duration)) return;
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
    };

    video.addEventListener('loadedmetadata', restore);
    video.addEventListener('timeupdate', saveProgress);
    video.addEventListener('timeupdate', updateState);
    video.addEventListener('durationchange', updateState);
    video.addEventListener('play', updateState);
    video.addEventListener('pause', updateState);
    video.addEventListener('ended', () => { updateState(); onEnded?.(); });

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', play);
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('seekbackward', () => seek(-10));
        navigator.mediaSession.setActionHandler('seekforward', () => seek(10));
      } catch {}
    }

    setup();
    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', restore);
      video.removeEventListener('timeupdate', saveProgress);
      video.removeEventListener('timeupdate', updateState);
      video.removeEventListener('durationchange', updateState);
      video.removeEventListener('play', updateState);
      video.removeEventListener('pause', updateState);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('seekbackward', null);
          navigator.mediaSession.setActionHandler('seekforward', null);
          navigator.mediaSession.playbackState = 'none';
        } catch {}
      }
      video.removeAttribute('src');
      video.load();
    };
  }, [activeSource, activeType, resumeKey, live, onEnded]);

  const skipIntro = () => {
    const video = videoRef.current;
    if (!video || !skipIntroSeconds) return;
    video.currentTime = Math.min(skipIntroSeconds, Number.isFinite(video.duration) ? video.duration : skipIntroSeconds);
  };

  const changeQuality = (height: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    const index = hls.levels.findIndex((level: { height?: number }) => level.height === height);
    if (index >= 0) { hls.currentLevel = index; setQuality(qualities.indexOf(height)); }
    setShowQuality(false);
  };

  const fullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  const pip = () => videoRef.current?.requestPictureInPicture?.().catch(() => {});

  if (!activeSource) {
    return <div className="aspect-video bg-black grid place-items-center text-center p-6"><ShieldAlert className="text-amber-300" /><p className="mt-3 text-sm text-slate-400">No authorized stream is configured yet.</p></div>;
  }

  if (activeType === 'iframe') {
    return <div className="player-frame aspect-video bg-black"><iframe title={title} src={activeSource} className="w-full h-full border-0" loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen /></div>;
  }

  return (
    <div className="relative aspect-video bg-black overflow-hidden group">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        className="w-full h-full"
        onCanPlay={() => setLoading(false)}
        onError={() => { setLoading(false); setError('The stream could not be played. Check the URL and player type.'); }}
      >
        {subtitleTracks.map((track) => (
          <track key={track.id || `${track.language}-${track.src}`} kind="subtitles" src={track.src} srcLang={track.language} label={track.label} default={track.default} />
        ))}
      </video>

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
        <div className="rounded-xl bg-black/60 backdrop-blur-md px-2.5 py-1.5 flex items-center gap-2 max-w-[65%]">
          <img src={logoUrl} alt="4uStream" className="h-6 w-6 object-contain rounded-md" />
          <span className="text-xs font-bold text-white truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {enabledServers.length > 1 && <select value={serverIndex} onChange={(e) => setServerIndex(Number(e.target.value))} className="rounded-xl bg-black/70 border border-white/10 px-2 py-1.5 text-[10px] font-bold text-white outline-none">{enabledServers.map((server, i) => <option key={server.id} value={i}>{server.name}{server.quality ? ` · ${server.quality}` : ''}</option>)}</select>}
          {live && <span className="rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-black text-white">LIVE</span>}
        </div>
      </div>

      <div className="absolute left-3 bottom-12 flex gap-1.5 opacity-0 group-hover:opacity-100 transition pointer-events-none group-focus-within:opacity-100">
        <button type="button" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }} className="pointer-events-auto rounded-full bg-black/70 p-2 text-white" aria-label="Back 10 seconds"><RotateCcw size={15} /></button>
        <button type="button" onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }} className="pointer-events-auto rounded-full bg-black/70 p-2 text-white" aria-label="Forward 10 seconds"><RotateCw size={15} /></button>
        <button type="button" onClick={pip} className="pointer-events-auto rounded-full bg-black/70 p-2 text-white" aria-label="Picture in picture"><PictureInPicture size={15} /></button>
        <button type="button" onClick={fullscreen} className="pointer-events-auto rounded-full bg-black/70 p-2 text-white" aria-label="Fullscreen"><Maximize size={15} /></button>
        {qualities.length > 0 && <div className="relative pointer-events-auto"><button type="button" onClick={() => setShowQuality((v) => !v)} className="rounded-full bg-black/70 px-2.5 py-2 text-[11px] font-black text-white">{quality >= 0 ? `${qualities[quality] || 'Auto'}p` : 'Auto'}</button>{showQuality && <div className="absolute bottom-full left-0 mb-2 min-w-24 rounded-xl bg-black/90 p-1 shadow-xl"> <button type="button" onClick={() => { hlsRef.current.currentLevel = -1; setQuality(-1); setShowQuality(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-white hover:bg-white/10">Auto</button>{qualities.map((q) => <button key={q} type="button" onClick={() => changeQuality(q)} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-white hover:bg-white/10">{q}p</button>)}</div>}</div>}
      </div>

      {skipIntroSeconds && currentTime < skipIntroSeconds && !live && (
        <button type="button" onClick={skipIntro} className="absolute right-3 bottom-14 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-black text-slate-950 shadow-xl"><Play size={13} fill="currentColor" /> Skip intro</button>
      )}

      <div className="absolute inset-0 pointer-events-none grid place-items-center">
        {loading && !error && <Loader2 className="animate-spin text-white/80" size={34} />}
        {error && <div className="text-center px-5"><ShieldAlert className="mx-auto text-amber-300" size={32} /><p className="mt-3 text-sm text-slate-300">{error}</p></div>}
      </div>
    </div>
  );
}
