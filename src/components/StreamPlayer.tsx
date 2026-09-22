'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { PlayerType } from '@/lib/types';

type Props = {
  url?: string;
  title: string;
  playerType?: PlayerType;
  resumeKey?: string;
  live?: boolean;
};

type HlsController = {
  destroy: () => void;
  loadSource: (url: string) => void;
  attachMedia: (media: HTMLVideoElement) => void;
};

export function StreamPlayer({
  url,
  title,
  playerType = 'video',
  resumeKey,
  live = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(url));

  useEffect(() => {
    if (!url || playerType === 'iframe' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: '4uStream',
        artist: title || 'Live TV',
        album: '4uStream',
        artwork: [{ src: '/IMG_6501.jpeg', sizes: '512x512', type: 'image/jpeg' }],
      });
    } catch {}

    return () => {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    };
  }, [url, title, playerType]);

  useEffect(() => {
    if (!url || playerType === 'iframe' || !videoRef.current) return;

    let cancelled = false;
    let hls: HlsController | null = null;
    const video = videoRef.current;

    setError('');
    setLoading(true);

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
      if (now - lastSaved.current < 5000) return;
      lastSaved.current = now;
      try {
        localStorage.setItem(`4u-progress:${resumeKey}`, String(Math.floor(video.currentTime)));
      } catch {}
    };

    const updateMediaSession = () => {
      try {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = video.paused ? 'paused' : 'playing';
        }
      } catch {}
    };

    const playMedia = async () => {
      try {
        await video.play();
        updateMediaSession();
      } catch {}
    };

    const pauseMedia = () => {
      video.pause();
      updateMediaSession();
    };

    const skipForward = () => {
      if (live || !Number.isFinite(video.duration)) return;
      video.currentTime = Math.min(video.currentTime + 10, video.duration);
    };

    const skipBackward = () => {
      if (live) return;
      video.currentTime = Math.max(video.currentTime - 10, 0);
    };

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', playMedia);
        navigator.mediaSession.setActionHandler('pause', pauseMedia);
        if (!live) {
          navigator.mediaSession.setActionHandler('seekbackward', skipBackward);
          navigator.mediaSession.setActionHandler('seekforward', skipForward);
        }
      } catch {}
    }

    const setup = async () => {
      if (cancelled) return;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        return;
      }

      if (/\.m3u8(?:\?|$)/i.test(url) || playerType === 'hls') {
        try {
          const HlsModule = await import('hls.js');
          if (cancelled || !HlsModule.default.isSupported()) {
            if (!cancelled) setError('This browser cannot play this HLS stream.');
            return;
          }

          hls = new HlsModule.default({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: live ? 15 : 30,
            maxBufferLength: live ? 12 : 20,
            maxMaxBufferLength: live ? 18 : 30,
          });
          hls.loadSource(url);
          hls.attachMedia(video);
        } catch {
          if (!cancelled) setError('HLS player could not be loaded.');
        }
        return;
      }

      video.src = url;
    };

    video.addEventListener('loadedmetadata', restore);
    video.addEventListener('timeupdate', saveProgress);
    video.addEventListener('play', updateMediaSession);
    video.addEventListener('pause', updateMediaSession);
    video.addEventListener('playing', updateMediaSession);
    video.addEventListener('ended', updateMediaSession);
    void setup();

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', restore);
      video.removeEventListener('timeupdate', saveProgress);
      video.removeEventListener('play', updateMediaSession);
      video.removeEventListener('pause', updateMediaSession);
      video.removeEventListener('playing', updateMediaSession);
      video.removeEventListener('ended', updateMediaSession);

      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          if (!live) {
            navigator.mediaSession.setActionHandler('seekbackward', null);
            navigator.mediaSession.setActionHandler('seekforward', null);
          }
          navigator.mediaSession.playbackState = 'none';
        } catch {}
      }

      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [url, playerType, resumeKey, live]);

  if (!url) {
    return <div className="aspect-video bg-black grid place-items-center text-center p-6"><ShieldAlert className="text-amber-300" /><p className="mt-3 text-sm text-slate-400">No authorized stream is configured yet.</p></div>;
  }

  if (playerType === 'iframe') {
    return <div className="player-frame aspect-video bg-black"><iframe title={title} src={url} className="w-full h-full border-0" loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen /></div>;
  }

  return (
    <div className="relative aspect-video bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full"
        onCanPlay={() => setLoading(false)}
        onPlay={() => { try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; } catch {} }}
        onPause={() => { try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; } catch {} }}
        onError={() => { setLoading(false); setError('The stream could not be played. Check the URL and player type.'); }}
      />
      <div className="absolute inset-0 pointer-events-none grid place-items-center">
        {loading && !error && <Loader2 className="animate-spin text-white/80" size={34} />}
        {error && <div className="pointer-events-auto text-center px-5"><ShieldAlert className="mx-auto text-amber-300" size={32} /><p className="mt-3 text-sm text-slate-300">{error}</p></div>}
      </div>
    </div>
  );
}
