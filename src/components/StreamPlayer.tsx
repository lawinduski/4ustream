'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { PlayerType } from '@/lib/types';

type Props = {
  url?: string;
  title: string;
  playerType?: PlayerType;
  resumeKey?: string;
  /** Live TV channel. Enables low-latency HLS; movies and episodes leave this off. */
  live?: boolean;
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

  /*
  |--------------------------------------------------------------------------
  | iPhone / Android Lock Screen Media Session
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
  if (!url || playerType === 'iframe') return;

  if (
    typeof navigator === 'undefined' ||
    !('mediaSession' in navigator)
  ) {
    return;
  }

  const updateMediaSession = () => {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: '4uStream',
        artist: title || 'Live TV',
        album: '4uStream',
        artwork: [
          {
            src: '/IMG_6501.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
          {
            src: '/IMG_6501.jpeg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
        ],
      });
    } catch {
      // Ignore Media Session errors.
    }
  };

  updateMediaSession();

  return () => {
    try {
      navigator.mediaSession.metadata = null;
    } catch {
      // Ignore cleanup errors.
    }
  };
}, [url, title, playerType]);

  /*
  |--------------------------------------------------------------------------
  | Stream Player
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !url ||
      (playerType !== 'video' && playerType !== 'hls') ||
      !videoRef.current
    ) {
      return;
    }

    let hls: any = null;
    let cancelled = false;

    const video = videoRef.current;

    setError('');
    setLoading(true);

    /*
    |--------------------------------------------------------------------------
    | Resume playback
    |--------------------------------------------------------------------------
    */

    const restore = () => {
      if (!resumeKey) return;

      try {
        const saved = Number(
          localStorage.getItem(`4u-progress:${resumeKey}`) || 0
        );

        if (
          Number.isFinite(saved) &&
          saved > 5 &&
          saved < Math.max(video.duration - 10, 0)
        ) {
          video.currentTime = saved;
        }
      } catch {
        // Ignore localStorage errors.
      }
    };

    /*
    |--------------------------------------------------------------------------
    | Save playback progress
    |--------------------------------------------------------------------------
    */

    const saveProgress = () => {
      if (
        !resumeKey ||
        !Number.isFinite(video.currentTime) ||
        video.currentTime < 5
      ) {
        return;
      }

      const now = Date.now();

      if (now - lastSaved.current < 4000) {
        return;
      }

      lastSaved.current = now;

      try {
        localStorage.setItem(
          `4u-progress:${resumeKey}`,
          String(Math.floor(video.currentTime))
        );
      } catch {
        // Ignore localStorage errors.
      }
    };

    /*
    |--------------------------------------------------------------------------
    | Media Session controls
    |--------------------------------------------------------------------------
    */

    const updateMediaSession = () => {
      if (
        typeof window === 'undefined' ||
        !('mediaSession' in navigator)
      ) {
        return;
      }

      try {
        navigator.mediaSession.playbackState = video.paused
          ? 'paused'
          : 'playing';
        } catch {
        // Ignore unsupported behavior.
      }
    };

    const playMedia = async () => {
      try {
        await video.play();
        updateMediaSession();
      } catch {
        // Browser may require user interaction.
      }
    };

    const pauseMedia = () => {
      video.pause();
      updateMediaSession();
    };

    const skipForward = () => {
      if (!Number.isFinite(video.duration)) return;

      video.currentTime = Math.min(
        video.currentTime + 10,
        video.duration
      );
    };

    const skipBackward = () => {
      video.currentTime = Math.max(
        video.currentTime - 10,
        0
      );
    };

    /*
    |--------------------------------------------------------------------------
    | Register Lock Screen buttons
    |--------------------------------------------------------------------------
    */

    if (
      typeof window !== 'undefined' &&
      'mediaSession' in navigator
    ) {
      try {
        navigator.mediaSession.setActionHandler(
          'play',
          playMedia
        );

        navigator.mediaSession.setActionHandler(
          'pause',
          pauseMedia
        );

        navigator.mediaSession.setActionHandler(
          'seekbackward',
          skipBackward
        );

        navigator.mediaSession.setActionHandler(
          'seekforward',
          skipForward
        );
      } catch {
        // Some browsers do not support all Media Session actions.
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Load HLS / normal video
    |--------------------------------------------------------------------------
    */

    const setup = async () => {
      if (cancelled) return;

      /*
      iPhone Safari can play HLS natively.
      */
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        return;
      }

      /*
      Other browsers use hls.js.
      */
      if (
        /\.m3u8(?:\?|$)/i.test(url) ||
        playerType === 'hls'
      ) {
        try {
          const Hls = (await import('hls.js')).default;

          if (cancelled) return;

          if (Hls.isSupported()) {
            hls = new Hls({
              enableWorker: true,
              lowLatencyMode: live, // low latency only makes sense for live channels
              backBufferLength: 30,
              maxBufferLength: 20,
              maxMaxBufferLength: 30,
            });

            hls.loadSource(url);
            hls.attachMedia(video);
          } else {
            setError(
              'This browser cannot play this HLS stream.'
            );
          }
        } catch {
          setError(
            'HLS player could not be loaded.'
          );
        }
      } else {
        video.src = url;
      }
    };

    /*
    |--------------------------------------------------------------------------
    | Video events
    |--------------------------------------------------------------------------
    */

    video.addEventListener(
      'loadedmetadata',
      restore
    );

    video.addEventListener(
      'timeupdate',
      saveProgress
    );

    video.addEventListener(
      'play',
      updateMediaSession
    );

    video.addEventListener(
      'pause',
      updateMediaSession
    );

    video.addEventListener(
      'playing',
      updateMediaSession
    );

    video.addEventListener(
      'ended',
      updateMediaSession
    );

    setup();

    /*
    |--------------------------------------------------------------------------
    | Cleanup
    |--------------------------------------------------------------------------
    */

    return () => {
      cancelled = true;

      video.removeEventListener(
        'loadedmetadata',
        restore
      );

      video.removeEventListener(
        'timeupdate',
        saveProgress
      );

      video.removeEventListener(
        'play',
        updateMediaSession
      );

      video.removeEventListener(
        'pause',
        updateMediaSession
      );

      video.removeEventListener(
        'playing',
        updateMediaSession
      );

      video.removeEventListener(
        'ended',
        updateMediaSession
      );

      if (
        typeof window !== 'undefined' &&
        'mediaSession' in navigator
      ) {
        try {
          navigator.mediaSession.setActionHandler(
            'play',
            null
          );

          navigator.mediaSession.setActionHandler(
            'pause',
            null
          );

          navigator.mediaSession.setActionHandler(
            'seekbackward',
            null
          );

          navigator.mediaSession.setActionHandler(
            'seekforward',
            null
          );

          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = 'none';
        } catch {
          // Ignore unsupported cleanup.
        }
      }

      if (hls) {
        hls.destroy();
      }

      video.removeAttribute('src');
      video.load();
    };
  }, [url, playerType, resumeKey, live]);

  /*
  |--------------------------------------------------------------------------
  | No stream
  |--------------------------------------------------------------------------
  */

  if (!url) {
    return (
      <div className="aspect-video bg-black grid place-items-center text-center p-6">
        <ShieldAlert className="text-amber-300" />

        <p className="mt-3 text-sm text-slate-400">
          No authorized stream is configured yet.
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Iframe player
  |--------------------------------------------------------------------------
  */

  if (playerType === 'iframe') {
    return (
      <div className="player-frame aspect-video bg-black">
        <iframe
          title={title}
          src={url}
          className="w-full h-full border-0"
          loading="lazy"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Video / HLS player
  |--------------------------------------------------------------------------
  */

  return (
    <div className="relative aspect-video bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full"
        onCanPlay={() => setLoading(false)}
        onPlay={() => {
          if (
            typeof navigator !== 'undefined' &&
            'mediaSession' in navigator
          ) {
            try {
              navigator.mediaSession.playbackState = 'playing';
            } catch {}
          }
        }}
        onPause={() => {
          if (
            typeof navigator !== 'undefined' &&
            'mediaSession' in navigator
          ) {
            try {
              navigator.mediaSession.playbackState = 'paused';
            } catch {}
          }
        }}
        onError={() => {
          setLoading(false);
          setError(
            'The stream could not be played. Check the URL and player type.'
          );
        }}
      />

      <div className="absolute inset-0 pointer-events-none grid place-items-center">
        {loading && !error && (
          <Loader2
            className="animate-spin text-white/80"
            size={34}
          />
        )}

        {error && (
          <div className="pointer-events-auto text-center px-5">
            <ShieldAlert
              className="mx-auto text-amber-300"
              size={32}
            />

            <p className="mt-3 text-sm text-slate-300">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
