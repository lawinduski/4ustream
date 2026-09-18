import { initShell, protectSection } from '../app.js';
import { getMediaById, getEpisodeById } from '../content.js';
import { canAccess } from '../access.js';
import { renderPlayer } from '../player.js';
import { icon } from '../icons.js';

const state = await initShell('films');
const root = document.getElementById('protected-root');

if (protectSection(root, { ...state, loading: false })) {
  const params = new URLSearchParams(location.search);
  const mediaId = params.get('media');
  const episodeId = params.get('episode');
  const content = document.getElementById('content');

  try {
    const [item, episode] = await Promise.all([
      mediaId ? getMediaById(mediaId) : null,
      episodeId ? getEpisodeById(episodeId) : null,
    ]);

    const level = item?.accessLevel ?? episode?.accessLevel;
    const allowed = canAccess(level, state.profile);
    const title = episode?.title ?? item?.title ?? '';
    const back = episode ? `/drama-detail.html?id=${encodeURIComponent(episode.dramaId)}` : item?.type === 'film' ? '/films.html' : '/drama.html';
    const episodeInfo = episode ? `Season ${episode.seasonNumber} · Episode ${episode.episodeNumber}` : item ? `${item.type} · ${item.year} · ${item.genre}` : '';

    if ((item || episode) && allowed) {
      content.innerHTML = `
        <a href="${back}" class="flex items-center gap-2" style="font-size:13px;color:#94a3b8;width:fit-content">${icon('arrowleft', 16)} Back</a>
        <section class="glass rounded-3xl" style="overflow:hidden">
          <div id="player-mount"></div>
          <div style="padding:24px 28px">
            <div style="font-size:11px;color:#c4b5fd;font-weight:900;text-transform:uppercase">${episodeInfo}</div>
            <h1 style="font-size:2rem;font-weight:1000;margin-top:8px">${title}</h1>
            <p class="mt-4" style="color:#94a3b8;line-height:1.7">${episode?.description || item?.description || ''}</p>
          </div>
        </section>`;
      renderPlayer(document.getElementById('player-mount'), {
        url: episode?.streamUrl || item?.streamUrl || '',
        title,
        playerType: episode?.playerType || item?.playerType,
      });
    } else {
      const locked = (item || episode) && !allowed;
      content.innerHTML = `<div class="empty-state">
        ${icon(locked ? 'lock' : 'shieldalert', 40)}
        <h1 class="mt-4" style="font-size:22px;font-weight:800">${locked ? 'VIP content' : 'Content not found'}</h1>
        <p class="mt-2">${locked ? 'This title is reserved for active VIP members.' : 'This title may have been removed or is not available.'}</p>
      </div>`;
    }
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="empty-state">Could not load this title.</div>`;
  }
}
