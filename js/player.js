import { icon } from './icons.js';

let hlsScriptPromise = null;
function loadHlsJs() {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (!hlsScriptPromise) {
    hlsScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.6.13/hls.min.js';
      s.onload = () => resolve(window.Hls);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return hlsScriptPromise;
}

/**
 * Renders a stream player into `container` (a DOM element).
 * @param {HTMLElement} container
 * @param {{url?:string,title:string,playerType?:'video'|'iframe'}} opts
 */
export function renderPlayer(container, { url, title, playerType = 'video' }) {
  container.innerHTML = '';
  container.className = 'player-shell aspect-video';

  if (!url) {
    container.innerHTML = `<div class="player-overlay" style="position:static;padding:40px 20px">
      <div>${icon('shieldalert', 30, 'opacity-60')}<p class="mt-3" style="font-size:13px;color:#94a3b8">No authorized stream is configured yet.</p></div>
    </div>`;
    return;
  }

  if (playerType === 'iframe') {
    const iframe = document.createElement('iframe');
    iframe.title = title;
    iframe.src = url;
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
    return;
  }

  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  container.appendChild(video);

  const overlay = document.createElement('div');
  overlay.className = 'player-overlay';
  container.appendChild(overlay);

  const setLoading = () => { overlay.innerHTML = icon('loader', 32, 'spin'); };
  const setError = (msg) => { overlay.innerHTML = `<div>${icon('shieldalert', 28)}<p class="mt-2" style="font-size:13px;color:#cbd5e1">${msg}</p></div>`; };
  const clearOverlay = () => { overlay.innerHTML = ''; };

  video.addEventListener('canplay', clearOverlay, { once: true });
  video.addEventListener('error', () => setError('The stream could not be played. Check the URL and player type.'));

  const isHls = /\.m3u8(?:\?|$)/i.test(url);

  if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.load();
    return;
  }

  if (isHls) {
    setLoading();
    loadHlsJs()
      .then((Hls) => {
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, clearOverlay);
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data?.fatal) setError('The HLS stream could not be played. Check the stream URL or CORS settings.');
          });
          container._hls = hls;
        } else {
          setError('This browser cannot play this HLS stream.');
        }
      })
      .catch(() => setError('HLS player could not be loaded.'));
    return;
  }

  video.src = url;
  video.load();
}
