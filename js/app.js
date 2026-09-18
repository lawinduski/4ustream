import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { icon } from './icons.js';
import { ensureI18n, tSync, getLang, setLang, dirFor } from './i18n.js';
import { isVip as checkVip } from './access.js';
import { readLocalFavorites, toggleFavorite, getFavorites } from './favorites.js';

const NAV = [
  ['/', 'home', 'home'],
  ['/live.html', 'live', 'radio'],
  ['/films.html', 'films', 'film'],
  ['/drama.html', 'drama', 'clapper'],
  ['/account.html', 'account', 'heart'],
];

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

function getTheme() { return localStorage.getItem('4u-theme') || 'dark'; }
function setTheme(t) { localStorage.setItem('4u-theme', t); document.documentElement.classList.toggle('light', t === 'light'); }

function applyLangAttrs(lang) {
  document.documentElement.lang = lang === 'badini' ? 'ku' : lang;
  document.documentElement.dir = dirFor(lang);
}

function headerHTML(active) {
  const lang = getLang();
  const navHtml = NAV.map(([href, key, ic]) =>
    `<a href="${href}" class="nav-pill ${active === key ? 'active' : ''}">${icon(ic, 15)}<span>${tSync(key)}</span></a>`
  ).join('');
  const mobileNavHtml = NAV.map(([href, key, ic]) =>
    `<a href="${href}" class="mobile-nav-row ${active === key ? 'active' : ''}">${icon(ic, 18)}<span>${tSync(key)}</span></a>`
  ).join('');
  const bottomNavHtml = NAV.map(([href, key, ic]) =>
    `<a href="${href}" class="bottom-nav-item ${active === key ? 'active' : ''}">${icon(ic, 18)}<span>${tSync(key)}</span></a>`
  ).join('');

  return `
  <div class="animated-bg"><span class="orb one"></span><span class="orb two"></span><span class="orb three"></span></div>
  <header class="site-header">
    <div class="bar glass-header">
      <div class="header-inner">
        <a href="/" class="flex items-center gap-2" style="flex-shrink:0">
          <div class="brand-mark"><span>4U</span><i></i></div>
          <div class="brand-text"><div class="name">4uStream</div><div class="tag">Badini • Stream</div></div>
        </a>
        <nav class="desktop-nav">${navHtml}</nav>
        <div class="header-right">
          <a href="/search.html" class="icon-btn" aria-label="search">${icon('search', 18)}</a>
          <button id="theme-toggle" class="icon-btn" aria-label="theme">${icon(getTheme() === 'dark' ? 'sun' : 'moon', 18)}</button>
          <div class="language-chip">${icon('languages', 14)}
            <select id="lang-select" aria-label="language">
              <option value="badini" ${lang === 'badini' ? 'selected' : ''}>Badini</option>
              <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
              <option value="ar" ${lang === 'ar' ? 'selected' : ''}>العربية</option>
            </select>
          </div>
          <button id="install-btn" class="icon-btn hidden" style="display:none" title="install">${icon('download', 18)}</button>
          <span id="account-slot"></span>
          <button id="menu-toggle" class="icon-btn menu-toggle" aria-label="menu">${icon('menu', 19)}</button>
        </div>
      </div>
      <div id="mobile-menu" class="mobile-menu">
        ${mobileNavHtml}
        <div class="lang-row">
          <button class="language-btn" data-lang="badini">Badini</button>
          <button class="language-btn" data-lang="en">English</button>
          <button class="language-btn" data-lang="ar">العربية</button>
        </div>
      </div>
    </div>
  </header>
  <nav class="mobile-bottom-nav"><div class="bar glass-header">${bottomNavHtml}</div></nav>
  `;
}

function footerHTML() {
  return `<footer class="site-footer">© ${new Date().getFullYear()} 4uStream. Built for authorized content.</footer>`;
}

/**
 * Sets up the shared page shell: header/footer, theme, language, auth state.
 * @param {string} active - key of the active nav item
 * @returns {Promise<{user:import('firebase/auth').User|null, profile:any, isVip:boolean}>}
 */
export async function initShell(active) {
  await ensureI18n();
  applyLangAttrs(getLang());
  setTheme(getTheme());

  const headerSlot = document.getElementById('app-header');
  const footerSlot = document.getElementById('app-footer');
  if (headerSlot) headerSlot.outerHTML = headerHTML(active);
  if (footerSlot) footerSlot.outerHTML = footerHTML();

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.getElementById('theme-toggle').innerHTML = icon(next === 'dark' ? 'sun' : 'moon', 18);
  });

  document.getElementById('lang-select')?.addEventListener('change', (e) => {
    setLang(e.target.value);
    location.reload();
  });
  document.querySelectorAll('.language-btn').forEach(btn => {
    btn.addEventListener('click', () => { setLang(btn.dataset.lang); location.reload(); });
  });

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('open');
  });

  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    window.addEventListener('beforeinstallprompt', () => { installBtn.style.display = ''; });
    installBtn.addEventListener('click', async () => {
      if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; }
    });
  }

  // apply static translations declared via data-t attributes
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = tSync(el.dataset.t); });
  document.querySelectorAll('[data-t-placeholder]').forEach(el => { el.placeholder = tSync(el.dataset.tPlaceholder); });

  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      let profile = null;
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          profile = snap.exists() ? snap.data() : null;
        } catch { profile = null; }
      }
      const vip = checkVip(profile);
      renderAccountSlot(user, profile);
      resolve({ user, profile, isVip: vip });
    });
  });
}

function renderAccountSlot(user, profile) {
  const slot = document.getElementById('account-slot');
  if (!slot) return;
  if (user) {
    slot.innerHTML = `<a href="/account.html" class="account-header-btn">${icon('user', 17)}<span>${tSync('account')}</span></a>` +
      (profile?.uid ? `<a href="/admin.html" class="icon-btn" title="${tSync('admin')}">${icon('shield', 18)}</a>` : '');
  } else {
    slot.innerHTML = `<a href="/login.html" class="account-header-btn">${icon('login', 17)}<span>${tSync('login')}</span></a>`;
  }
}

export async function doSignOut() {
  await signOut(auth);
  location.href = '/';
}

/** Shows a lock/pending screen in `container` if not allowed; returns true if the page may render its real content. */
export function protectSection(container, { user, profile, loading }) {
  if (loading) {
    container.innerHTML = `<div class="empty-state">Loading…</div>`;
    return false;
  }
  if (!user) {
    container.innerHTML = `<div class="empty-state">${icon('lock', 34)}<h2 class="mt-4" style="font-size:22px;font-weight:800">${tSync('login')}</h2>
      <a href="/login.html" class="btn-primary mt-5" style="display:inline-flex;width:auto;padding:12px 22px">${tSync('login')}</a></div>`;
    return false;
  }
  if (profile?.status !== 'active') {
    container.innerHTML = `<div class="empty-state">${icon('lock', 34)}<h2 class="mt-4" style="font-size:22px;font-weight:800">${tSync('pending')}</h2>
      <p class="mt-2" style="color:#94a3b8">${tSync('noAccess')}</p></div>`;
    return false;
  }
  return true;
}

/* ---------------- Card renderers (reused on home / live / films / drama) ---------------- */

export function channelCardHTML(channel) {
  const initials = (channel.name || '?').slice(0, 2).toUpperCase();
  return `<div class="glass card-hover rounded-2xl card" style="overflow:hidden" data-channel-card="${channel.id}">
    <div class="aspect-wide card-media">
      ${channel.logo
        ? `<img src="${channel.logo}" alt="${channel.name}" loading="lazy" decoding="async" style="object-fit:contain">`
        : `<div class="flex items-center justify-center" style="height:100%"><div style="height:56px;width:56px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-weight:900;color:#cbd5e1">${initials}</div></div>`}
      ${channel.accessLevel === 'vip' ? `<span class="badge-vip">${icon('lock', 11)} VIP</span>` : ''}
      <button class="fav-btn" data-fav-toggle data-fav-type="channel" data-fav-id="${channel.id}" data-fav-title="${escapeAttr(channel.name)}" data-fav-image="${escapeAttr(channel.logo || '')}" aria-label="favorite">${icon('star', 16)}</button>
      <a href="/live.html?channel=${encodeURIComponent(channel.id)}" class="play-overlay"><span class="play-circle">${icon('play', 19)}</span></a>
    </div>
    <div class="card-body">
      <div class="card-kicker">${channel.category}</div>
      <h3 class="card-title truncate">${channel.name}</h3>
      <p class="card-sub">Ready to watch</p>
    </div>
  </div>`;
}

export function mediaCardHTML(item) {
  const href = item.type === 'drama' ? `/drama-detail.html?id=${encodeURIComponent(item.id)}` : `/watch.html?media=${encodeURIComponent(item.id)}`;
  return `<div class="card" data-media-card="${item.id}">
    <a href="${href}" class="glass card-hover rounded-2xl" style="display:block;overflow:hidden">
      <div class="aspect-poster card-media">
        <img src="${item.poster || ''}" alt="${escapeAttr(item.title)}" loading="lazy" decoding="async">
        ${item.accessLevel === 'vip' ? `<span class="badge-vip">${icon('lock', 11)} VIP</span>` : ''}
        <div class="play-overlay"><span class="play-circle">${icon('play', 18)}</span></div>
      </div>
      <div class="card-body">
        <div class="card-kicker">${item.year} · ${item.genre || ''}</div>
        <h3 class="card-title truncate">${item.title}</h3>
      </div>
    </a>
    <button class="fav-btn" data-fav-toggle data-fav-type="media" data-fav-id="${item.id}" data-fav-title="${escapeAttr(item.title)}" data-fav-image="${escapeAttr(item.poster || '')}" aria-label="favorite">${icon('star', 16)}</button>
  </div>`;
}

function escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Wires up every [data-fav-toggle] button inside `root`, syncing star state from local + Firestore favorites. */
export async function wireFavoriteButtons(root, user) {
  const sync = async () => {
    const local = readLocalFavorites();
    const remote = user ? await getFavorites(user.uid).catch(() => []) : [];
    root.querySelectorAll('[data-fav-toggle]').forEach(btn => {
      const id = btn.dataset.favId, type = btn.dataset.favType;
      const active = local.some(x => x.id === id && x.type === type) || remote.some(x => x.id === id && x.type === type);
      btn.classList.toggle('active', active);
    });
  };
  await sync();
  window.addEventListener('4u-favorites-changed', sync);
  root.querySelectorAll('[data-fav-toggle]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      await toggleFavorite(user?.uid, {
        id: btn.dataset.favId, type: btn.dataset.favType,
        title: btn.dataset.favTitle, image: btn.dataset.favImage,
      });
    });
  });
}

export function adRotatorHTML(ads) {
  const banners = ads.filter(a => (a.placement || 'banner') === 'banner');
  if (!banners.length) return '';
  const first = banners[0];
  return `<section class="ad-shell fade-up" id="ad-banner" data-index="0" data-count="${banners.length}">
    <a href="${first.link || '#'}" ${first.link ? 'target="_blank" rel="noopener noreferrer"' : ''}>
      <img id="ad-banner-img" src="${first.image}" alt="${escapeAttr(first.title)}" loading="eager" decoding="async">
    </a>
    <div class="ad-caption">${icon('megaphone', 13)} <span id="ad-banner-title">${first.title}</span></div>
  </section>`;
}

export function wireAdRotator(ads) {
  const banners = ads.filter(a => (a.placement || 'banner') === 'banner');
  const popups = ads.filter(a => (a.placement || 'banner') === 'popup');
  const el = document.getElementById('ad-banner');
  if (el && banners.length > 1) {
    let i = 0;
    setInterval(() => {
      i = (i + 1) % banners.length;
      const ad = banners[i];
      document.getElementById('ad-banner-img').src = ad.image;
      document.getElementById('ad-banner-title').textContent = ad.title;
      el.querySelector('a').href = ad.link || '#';
    }, 5000);
  }
  if (popups.length) {
    let pi = 0;
    const showPopup = () => {
      const ad = popups[pi % popups.length]; pi++;
      const wrap = document.createElement('div');
      wrap.className = 'ad-popup';
      wrap.innerHTML = `<div class="ad-popup-card">
        <div class="ad-popup-close">${icon('x', 18)}</div>
        <a href="${ad.link || '#'}" ${ad.link ? 'target="_blank" rel="noopener noreferrer"' : ''}><img src="${ad.image}" alt="${escapeAttr(ad.title)}"></a>
      </div>`;
      document.body.appendChild(wrap);
      wrap.querySelector('.ad-popup-close').addEventListener('click', () => wrap.remove());
      wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
    };
    setTimeout(showPopup, 5000);
    setInterval(showPopup, 20000);
  }
}
