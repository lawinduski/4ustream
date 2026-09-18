import { initShell, doSignOut } from '../app.js';
import { getFavorites } from '../favorites.js';
import { icon } from '../icons.js';
import { tSync } from '../i18n.js';

const { user, profile } = await initShell('account');
const content = document.getElementById('content');

if (!user) {
  content.innerHTML = `<div class="glass rounded-3xl text-center" style="padding:32px;max-width:36rem;margin:0 auto">
    ${icon('user', 38, 'opacity-60')}
    <h1 class="mt-4" style="font-size:1.5rem;font-weight:800">${tSync('login')}</h1>
    <a href="/login.html" class="btn-primary mt-5" style="display:inline-flex;width:auto;padding:12px 20px">${tSync('login')}</a>
  </div>`;
} else {
  content.innerHTML = `
    <div class="glass rounded-3xl account-hero">
      <div class="avatar-lg">${icon('user', 26)}</div>
      <h1 class="mt-5" style="font-size:1.9rem;font-weight:1000">${profile?.name || user.displayName || 'User'}</h1>
      <p class="mt-1" style="color:#94a3b8">${user.email}</p>
      <div class="status-box">
        <div class="label">Status</div>
        <div class="value">${profile?.status || 'pending'}</div>
      </div>
      <div class="flex flex-wrap gap-3 mt-7">
        <button id="install-account" class="mini-btn" style="padding:12px 16px">${icon('download', 17)}${tSync('install')}</button>
        <button id="signout-btn" class="mini-btn btn-danger" style="padding:12px 16px">${icon('logout', 17)}${tSync('logout')}</button>
      </div>
    </div>
    <section class="glass rounded-3xl" style="padding:20px 24px">
      <div class="flex items-center gap-2 mb-5">
        ${icon('star', 20)}<h2 style="font-size:1.3rem;font-weight:900">${tSync('favorites')}</h2>
        <span id="fav-count" style="font-size:11px;color:#64748b"></span>
      </div>
      <div id="fav-grid" class="grid grid-2 sm:grid-3 lg:grid-4 gap-4"></div>
      <div id="fav-empty" class="empty-state hidden" data-t="noResults"></div>
    </section>`;

  document.getElementById('signout-btn').addEventListener('click', doSignOut);
  document.getElementById('install-account').addEventListener('click', () => {
    document.getElementById('install-btn')?.click();
  });

  async function loadFavorites() {
    const favorites = await getFavorites(user.uid).catch(() => []);
    document.getElementById('fav-count').textContent = favorites.length;
    const grid = document.getElementById('fav-grid');
    document.getElementById('fav-empty').classList.toggle('hidden', favorites.length !== 0);
    grid.innerHTML = favorites.map(f => {
      const href = f.type === 'channel' ? `/live.html?channel=${encodeURIComponent(f.id)}` : `/watch.html?media=${encodeURIComponent(f.id)}`;
      return `<a href="${href}" class="glass card-hover rounded-2xl" style="overflow:hidden;display:block">
        <div class="aspect-wide card-media flex items-center justify-center">
          ${f.image ? `<img src="${f.image}" alt="${f.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover">` : icon(f.type === 'channel' ? 'radio' : 'film', 22)}
        </div>
        <div class="card-body">
          <div class="card-kicker">${f.type}</div>
          <div class="card-title truncate">${f.title}</div>
        </div>
      </a>`;
    }).join('');
  }

  await loadFavorites();
  window.addEventListener('4u-favorites-changed', loadFavorites);
}
