import { initShell, protectSection } from '../app.js';
import { getMediaById, getEpisodes } from '../content.js';
import { icon } from '../icons.js';

const state = await initShell('drama');
const root = document.getElementById('protected-root');

if (protectSection(root, { ...state, loading: false })) {
  const id = decodeURIComponent(new URLSearchParams(location.search).get('id') || '');
  const content = document.getElementById('content');

  try {
    const [drama, episodes] = await Promise.all([
      getMediaById(id),
      getEpisodes(id, state.isVip),
    ]);

    if (!drama || drama.type !== 'drama') {
      content.innerHTML = `<div class="empty-state">Drama not found.</div>`;
    } else {
      const seasons = [...new Set(episodes.map(e => e.seasonNumber))].sort((a, b) => a - b);

      content.innerHTML = `
        <a href="/drama.html" class="flex items-center gap-2" style="font-size:13px;color:#94a3b8;width:fit-content">${icon('arrowleft', 16)} Drama</a>
        <section class="glass rounded-3xl" style="overflow:hidden">
          <div class="grid" style="grid-template-columns:1fr" >
            <div class="aspect-poster" style="background:#0f172a"><img src="${drama.poster || ''}" alt="${drama.title}" style="width:100%;height:100%;object-fit:cover"></div>
            <div style="padding:28px">
              <div class="flex items-center gap-2" style="color:#c4b5fd;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em">
                <span>${drama.year}</span><span>•</span><span>${drama.genre || ''}</span>
                ${drama.accessLevel === 'vip' ? `<span class="vip-chip">${icon('lock', 12)} VIP</span>` : ''}
              </div>
              <h1 style="font-size:2.4rem;font-weight:1000;margin-top:10px">${drama.title}</h1>
              <p class="mt-4" style="color:#94a3b8;line-height:1.7;max-width:640px">${drama.description || ''}</p>
              <div class="flex flex-wrap gap-2 mt-6">
                <span class="glass rounded-full" style="padding:8px 12px;font-size:11px;font-weight:800">${episodes.length} Episodes</span>
                <span class="glass rounded-full" style="padding:8px 12px;font-size:11px;font-weight:800">${state.isVip ? 'VIP access' : 'Free access'}</span>
              </div>
            </div>
          </div>
        </section>
        ${seasons.map(season => `
          <section class="space-y-3 mt-7">
            <div class="flex items-center justify-between">
              <h2 style="font-size:20px;font-weight:900">Season ${season}</h2>
              <span style="font-size:11px;color:#64748b">${episodes.filter(e => e.seasonNumber === season).length} episodes</span>
            </div>
            <div class="grid sm:grid-3 gap-3">
              ${episodes.filter(e => e.seasonNumber === season).map(ep => `
                <a href="/watch.html?episode=${encodeURIComponent(ep.id)}" class="glass rounded-2xl flex items-center gap-3" style="padding:14px">
                  <span style="height:44px;width:44px;border-radius:14px;background:rgba(139,92,246,.1);color:#c4b5fd;display:flex;align-items:center;justify-content:center;font-weight:900">${String(ep.episodeNumber).padStart(2, '0')}</span>
                  <div style="min-width:0;flex:1">
                    <div class="truncate" style="font-weight:800">${ep.title}</div>
                    <div class="flex items-center gap-2" style="font-size:11px;color:#64748b;margin-top:4px">
                      ${icon('clock', 12)}${ep.durationMinutes ? `${ep.durationMinutes} min` : 'Episode'}
                      ${ep.accessLevel === 'vip' ? `<span>•</span><span style="color:#c4b5fd">VIP</span>` : ''}
                    </div>
                  </div>
                  ${icon('play', 20, 'opacity-60')}
                </a>`).join('')}
            </div>
          </section>`).join('')}
        ${!episodes.length ? `<div class="empty-state">No episodes are available for this access level yet.</div>` : ''}
      `;
    }
  } catch (err) {
    console.error(err);
    content.innerHTML = `<div class="empty-state">Could not load this title.</div>`;
  }
}
