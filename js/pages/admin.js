import { initShell, protectSection } from '../app.js';
import { getFirebase } from '../firebase-init.js';
import {
  collection, deleteDoc, doc, getDoc, getDocs, orderBy, query,
  serverTimestamp, setDoc, Timestamp, updateDoc,
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { uploadAdminAsset } from '../storage.js';
import { icon } from '../icons.js';

const CATEGORIES = ['NEWS', 'SPORTS', 'BEIN', 'MOVIES', 'KIDS', 'KURDISH', 'ENTERTAINMENT'];
const root = document.getElementById('root');

const state = await initShell('account');
const firebase = state.firebaseError ? null : await getFirebase();
const db = firebase?.db;
if (state.firebaseError) {
  // initShell already rendered the service error.
} else if (!protectSection(root, { ...state, loading: false })) {
  // login/pending screen already rendered
} else if (!state.user) {
  // unreachable — protectSection handles this
} else {
  const allowedSnap = await getDoc(doc(db, 'admins', state.user.uid)).catch(() => null);
  const allowed = !!allowedSnap && allowedSnap.exists() && allowedSnap.data()?.active === true;

  if (!allowed) {
    root.innerHTML = `<div class="empty-state">Not authorized.</div>`;
  } else {
    runAdmin(root);
  }
}

async function runAdmin(root) {
  const data = { users: [], channels: [], media: [], episodes: [], ads: [] };
  let tab = 'users';
  let message = '';

  async function load() {
    const [us, cs, ms, es, as] = await Promise.all([
      getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))).catch(() => getDocs(collection(db, 'users'))),
      getDocs(collection(db, 'channels')),
      getDocs(collection(db, 'media')),
      getDocs(collection(db, 'episodes')),
      getDocs(collection(db, 'ads')),
    ]);
    data.users = us.docs.map(d => d.data());
    data.channels = cs.docs.map(d => ({ id: d.id, ...d.data(), accessLevel: d.data().accessLevel || 'free' }));
    data.media = ms.docs.map(d => ({ id: d.id, ...d.data(), accessLevel: d.data().accessLevel || 'free' }));
    data.episodes = es.docs.map(d => ({ id: d.id, ...d.data(), accessLevel: d.data().accessLevel || 'free' }));
    data.ads = as.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  function formatDate(v) {
    if (!v) return 'No expiry';
    try { return v?.toDate ? v.toDate().toLocaleDateString() : new Date(v).toLocaleDateString(); }
    catch { return '—'; }
  }

  async function saveDoc(coll, id, payload) {
    await setDoc(doc(db, coll, id), { ...payload, id, accessLevel: payload.accessLevel || 'free', updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true });
  }

  async function removeDoc(coll, id) {
    if (!confirm('Delete this item?')) return;
    await deleteDoc(doc(db, coll, id));
    await load();
    render();
  }

  async function changeStatus(u, status) {
    await updateDoc(doc(db, 'users', u.uid), { status });
    u.status = status;
    render();
  }

  async function setVip(u, days) {
    if (days === null) await updateDoc(doc(db, 'users', u.uid), { plan: 'free', vipUntil: null });
    else await updateDoc(doc(db, 'users', u.uid), { plan: 'vip', vipUntil: Timestamp.fromDate(new Date(Date.now() + days * 86400000)) });
    await load();
    render();
  }

  function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  function shell() {
    const activeChannels = data.channels.filter(x => x.enabled).length;
    const activeMedia = data.media.filter(x => x.enabled).length;
    return `
    <div class="space-y-6">
      <div class="admin-hero">
        <div>
          <div class="admin-badge">${icon('shield', 14)} 4uSTREAM CONTROL CENTER</div>
          <h1>Admin Studio</h1>
          <p>Manage content, images, ads and VIP access from one place.</p>
        </div>
        <div class="admin-badge">${icon('crown', 15)} Secure console</div>
      </div>
      ${message ? `<div class="glass rounded-2xl flex items-center justify-between" style="padding:12px 16px;font-size:13px;color:#ddd6fe"><span>${esc(message)}</span><button id="msg-close" style="background:none;border:0;color:inherit;cursor:pointer">${icon('x', 16)}</button></div>` : ''}
      <div class="stat-grid">
        <div class="glass stat-card"><div class="l">Users</div><div class="v">${data.users.length}</div></div>
        <div class="glass stat-card"><div class="l">Channels</div><div class="v">${activeChannels}/${data.channels.length}</div></div>
        <div class="glass stat-card"><div class="l">Media</div><div class="v">${activeMedia}/${data.media.length}</div></div>
        <div class="glass stat-card"><div class="l">Episodes</div><div class="v">${data.episodes.length}</div></div>
        <div class="glass stat-card"><div class="l">Ads</div><div class="v">${data.ads.length}</div></div>
      </div>
      <div class="admin-tabs">
        ${[['users', 'Users', 'shield'], ['channels', 'Channels', 'radio'], ['media', 'Films & Drama', 'film'], ['episodes', 'Episodes', 'clapper'], ['ads', 'Ads', 'megaphone']]
          .map(([id, label, ic]) => `<button data-tab="${id}" class="${tab === id ? 'active' : ''}">${icon(ic, 16)}${label}</button>`).join('')}
      </div>
      <div id="tab-content"></div>
    </div>`;
  }

  function usersTab() {
    return `<div class="glass rounded-3xl" style="overflow:hidden">
      <div class="admin-list-head">Members &amp; VIP access</div>
      <div>
        ${data.users.map(u => `
          <div class="admin-row" style="flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
              <div class="flex items-center gap-2" style="font-weight:800">${esc(u.name)}${u.plan === 'vip' ? `<span class="vip-chip">${icon('crown', 11)}VIP</span>` : ''}</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px">${esc(u.email)}</div>
              ${u.plan === 'vip' ? `<div style="font-size:11px;color:#c4b5fd;margin-top:4px">Expires: ${formatDate(u.vipUntil)}</div>` : ''}
            </div>
            <div class="flex gap-2 flex-wrap">
              <span class="status-chip">${u.status}</span><span class="status-chip">${u.plan || 'free'}</span>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button class="mini-btn" data-act="active" data-uid="${u.uid}">${icon('usercheck', 15)}Active</button>
              <button class="mini-btn" data-act="disabled" data-uid="${u.uid}">${icon('userx', 15)}Disable</button>
              <button class="mini-btn vip-btn" data-act="vip30" data-uid="${u.uid}">${icon('crown', 15)}VIP 30d</button>
              <button class="mini-btn" data-act="free" data-uid="${u.uid}">${icon('x', 15)}Free</button>
            </div>
          </div>`).join('') || `<div class="empty-state">No registered users yet.</div>`}
      </div>
    </div>`;
  }

  function contentTab(kind) {
    const isChannel = kind === 'channel';
    const list = isChannel ? data.channels : data.media;
    return `
    <div class="admin-layout">
      <form id="content-form" class="glass rounded-3xl admin-form space-y-4">
        <div class="flex justify-between items-center">
          <div><h2 style="font-weight:900">Add ${isChannel ? 'Channel' : 'Media'}</h2><p style="font-size:11px;color:#64748b;margin-top:4px">Everything can be managed without code.</p></div>
        </div>
        <label class="field"><span>ID (leave blank to auto-generate)</span><input class="input" name="id"></label>
        <label class="field"><span>${isChannel ? 'Name' : 'Title'}</span><input class="input" name="${isChannel ? 'name' : 'title'}" required></label>
        ${isChannel ? `
          <label class="field"><span>Category</span><select class="input" name="category">${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></label>
          ${uploadFieldHTML('logo', 'Logo', 'logos')}
          <label class="field"><span>Stream URL</span><input class="input" name="streamUrl"></label>
        ` : `
          <label class="field"><span>Type</span><select class="input" name="type"><option value="film">Film</option><option value="drama">Drama</option></select></label>
          <label class="field"><span>Year</span><input class="input" type="number" name="year" value="${new Date().getFullYear()}"></label>
          <label class="field"><span>Genre</span><input class="input" name="genre"></label>
          ${uploadFieldHTML('poster', 'Poster', 'posters')}
          <label class="field"><span>Video URL</span><input class="input" name="streamUrl"></label>
        `}
        <label class="field"><span>Player</span><select class="input" name="playerType"><option value="video">Video / HLS</option><option value="iframe">Iframe</option></select></label>
        <label class="field"><span>Description</span><textarea class="input" name="description"></textarea></label>
        <label class="field"><span>Access</span><select class="input" name="accessLevel"><option value="free">FREE — active members</option><option value="vip">VIP — VIP members only</option></select></label>
        <label class="flex items-center gap-3" style="font-size:13px;font-weight:800"><input type="checkbox" name="enabled"><span>Published / active</span></label>
        <button class="btn-primary" type="submit">${icon('plus', 17)} Add</button>
      </form>
      <div class="glass rounded-3xl" style="overflow:hidden">
        <div class="admin-list-head">${isChannel ? 'Channels' : 'Films & Drama'} · ${list.length}</div>
        <div>
          ${list.map(item => `
            <div class="admin-row">
              <div class="admin-thumb">${(isChannel ? item.logo : item.poster) ? `<img src="${item.logo || item.poster}" style="width:100%;height:100%;object-fit:cover">` : icon('image', 18)}</div>
              <div style="flex:1;min-width:0">
                <div class="truncate" style="font-weight:800">${esc(isChannel ? item.name : item.title)}</div>
                <div style="font-size:11px;color:#64748b;margin-top:4px">${isChannel ? item.category : `${item.type} · ${item.year}`} · ${item.enabled ? 'Active' : 'Off'} · ${(item.accessLevel || 'free').toUpperCase()}</div>
              </div>
              <button class="icon-btn-sm" data-edit="${item.id}" data-kind="${kind}">${icon('edit', 16)}</button>
              <button class="icon-btn-sm danger" data-del="${item.id}" data-coll="${isChannel ? 'channels' : 'media'}">${icon('trash', 16)}</button>
            </div>`).join('') || `<div class="empty-state">Nothing added yet.</div>`}
        </div>
      </div>
    </div>`;
  }

  function uploadFieldHTML(name, label, folder) {
    return `<div class="field">
      <span>${label}</span>
      <div class="flex gap-2 mt-1">
        <label class="upload-btn">${icon('upload', 15)}<span data-upload-label="${name}">Choose image</span><input type="file" accept="image/*" class="hidden" data-upload="${name}" data-folder="${folder}"></label>
        <input class="input" name="${name}" placeholder="or paste image URL">
      </div>
      <img data-preview="${name}" class="hidden mt-2" style="height:80px;width:100%;object-fit:cover;border-radius:14px;border:1px solid rgba(255,255,255,.1)">
    </div>`;
  }

  function episodesTab() {
    const dramas = data.media.filter(m => m.type === 'drama');
    return `
    <div class="admin-layout">
      <form id="episode-form" class="glass rounded-3xl admin-form space-y-4">
        <h2 style="font-weight:900">Add Episode</h2>
        <label class="field"><span>Drama</span><select class="input" name="dramaId" required><option value="">Select drama</option>${dramas.map(d => `<option value="${d.id}">${esc(d.title)}</option>`).join('')}</select></label>
        <label class="field"><span>Episode title</span><input class="input" name="title" required></label>
        <div class="grid grid-2 gap-3">
          <label class="field"><span>Season</span><input class="input" type="number" min="1" name="seasonNumber" value="1"></label>
          <label class="field"><span>Episode</span><input class="input" type="number" min="1" name="episodeNumber" value="1"></label>
        </div>
        <label class="field"><span>Duration (minutes)</span><input class="input" type="number" min="0" name="durationMinutes" value="45"></label>
        <label class="field"><span>Video URL</span><input class="input" name="streamUrl"></label>
        <label class="field"><span>Access</span><select class="input" name="accessLevel"><option value="free">FREE</option><option value="vip">VIP</option></select></label>
        <label class="flex items-center gap-3" style="font-size:13px;font-weight:800"><input type="checkbox" name="enabled"><span>Published / active</span></label>
        <button class="btn-primary" type="submit">Add episode</button>
      </form>
      <div class="glass rounded-3xl" style="overflow:hidden">
        <div class="admin-list-head">Episodes · ${data.episodes.length}</div>
        <div>
          ${[...data.episodes].sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber).map(x => `
            <div class="admin-row">
              <div style="height:44px;width:44px;border-radius:14px;background:rgba(139,92,246,.1);color:#c4b5fd;display:flex;align-items:center;justify-content:center;font-weight:900">${String(x.episodeNumber).padStart(2, '0')}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:800">${esc(x.title)}</div>
                <div style="font-size:11px;color:#64748b">S${x.seasonNumber} · ${x.durationMinutes || 0} min · ${(x.accessLevel || 'free').toUpperCase()}</div>
              </div>
              <button class="icon-btn-sm danger" data-del="${x.id}" data-coll="episodes">${icon('trash', 16)}</button>
            </div>`).join('') || `<div class="empty-state">No episodes yet.</div>`}
        </div>
      </div>
    </div>`;
  }

  function adsTab() {
    return `
    <div class="admin-layout">
      <form id="ad-form" class="glass rounded-3xl admin-form space-y-4">
        <h2 style="font-weight:900">Create Advertisement</h2>
        <label class="field"><span>Title</span><input class="input" name="title" required></label>
        ${uploadFieldHTML('image', 'Desktop / main image', 'ads')}
        ${uploadFieldHTML('mobileImage', 'Mobile image (optional)', 'ads')}
        <label class="field"><span>Click link</span><input class="input" name="link" placeholder="https://..."></label>
        <label class="field"><span>Placement</span><select class="input" name="placement">
          <option value="banner">Banner — homepage carousel</option>
          <option value="popup">Popup — every 20 seconds</option>
          <option value="inline">Inline — content area</option>
        </select></label>
        <label class="field"><span>Order</span><input class="input" type="number" name="order" value="1"></label>
        <label class="flex items-center gap-3" style="font-size:13px;font-weight:800"><input type="checkbox" name="enabled" checked><span>Active / visible</span></label>
        <button class="btn-primary" type="submit">Add advertisement</button>
      </form>
      <div class="grid sm:grid-2 gap-4">
        ${data.ads.map(x => `
          <div class="glass rounded-3xl" style="overflow:hidden">
            <img src="${x.image}" alt="${esc(x.title)}" style="width:100%;height:150px;object-fit:cover">
            <div style="padding:14px">
              <div class="truncate" style="font-weight:800">${esc(x.title)}</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px">Order ${x.order} · ${x.enabled ? 'Active' : 'Disabled'} · ${x.placement || 'banner'}</div>
              <button class="icon-btn-sm danger mt-3" data-del="${x.id}" data-coll="ads">${icon('trash', 16)}</button>
            </div>
          </div>`).join('') || `<div class="empty-state">No advertisements yet.</div>`}
      </div>
    </div>`;
  }

  function render() {
    root.innerHTML = shell();
    document.getElementById('msg-close')?.addEventListener('click', () => { message = ''; render(); });

    root.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => { tab = btn.dataset.tab; render(); });
    });

    const tabContent = document.getElementById('tab-content');
    if (tab === 'users') { tabContent.innerHTML = usersTab(); wireUsers(); }
    else if (tab === 'channels') { tabContent.innerHTML = contentTab('channel'); wireContentForm('channel'); }
    else if (tab === 'media') { tabContent.innerHTML = contentTab('media'); wireContentForm('media'); }
    else if (tab === 'episodes') { tabContent.innerHTML = episodesTab(); wireEpisodeForm(); }
    else if (tab === 'ads') { tabContent.innerHTML = adsTab(); wireAdForm(); }

    tabContent.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => removeDoc(btn.dataset.coll, btn.dataset.del));
    });
    wireUploads(tabContent);
  }

  function wireUsers() {
    document.getElementById('tab-content').querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const u = data.users.find(x => x.uid === btn.dataset.uid);
        if (!u) return;
        if (btn.dataset.act === 'active') await changeStatus(u, 'active');
        else if (btn.dataset.act === 'disabled') await changeStatus(u, 'disabled');
        else if (btn.dataset.act === 'vip30') await setVip(u, 30);
        else if (btn.dataset.act === 'free') await setVip(u, null);
      });
    });
  }

  function wireUploads(scope) {
    scope.querySelectorAll('[data-upload]').forEach(input => {
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) { alert('Max 8MB'); return; }
        const label = scope.querySelector(`[data-upload-label="${input.dataset.upload}"]`);
        const originalLabel = label.textContent;
        label.textContent = 'Uploading…';
        try {
          const url = await uploadAdminAsset(file, input.dataset.folder);
          const textInput = scope.querySelector(`input[name="${input.dataset.upload}"]`);
          if (textInput) textInput.value = url;
          const preview = scope.querySelector(`[data-preview="${input.dataset.upload}"]`);
          if (preview) { preview.src = url; preview.classList.remove('hidden'); }
        } catch {
          alert('Upload failed');
        } finally {
          label.textContent = originalLabel;
        }
      });
    });
  }

  function wireContentForm(kind) {
    const form = document.getElementById('content-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const isChannel = kind === 'channel';
      const titleField = isChannel ? fd.get('name') : fd.get('title');
      if (!titleField?.trim()) { message = 'Title / name is required.'; render(); return; }
      const id = (fd.get('id') || '').trim() || titleField.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `${kind}-${Date.now().toString(36)}`;
      const payload = isChannel ? {
        name: fd.get('name'), category: fd.get('category'), logo: fd.get('logo') || '',
        streamUrl: fd.get('streamUrl') || '', playerType: fd.get('playerType'),
        description: fd.get('description') || '', accessLevel: fd.get('accessLevel'),
        enabled: fd.get('enabled') === 'on',
      } : {
        title: fd.get('title'), type: fd.get('type'), year: Number(fd.get('year')), genre: fd.get('genre') || '',
        poster: fd.get('poster') || '', streamUrl: fd.get('streamUrl') || '', playerType: fd.get('playerType'),
        description: fd.get('description') || '', accessLevel: fd.get('accessLevel'),
        enabled: fd.get('enabled') === 'on',
      };
      try {
        await saveDoc(isChannel ? 'channels' : 'media', id, payload);
        message = 'Saved.';
        await load();
        render();
      } catch (err) { message = err?.message || 'Save failed.'; render(); }
    });
  }

  function wireEpisodeForm() {
    const form = document.getElementById('episode-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (!fd.get('dramaId')) { message = 'Choose a drama first.'; render(); return; }
      const title = fd.get('title');
      if (!title?.trim()) { message = 'Title / name is required.'; render(); return; }
      const id = `episode-${Date.now().toString(36)}`;
      const payload = {
        dramaId: fd.get('dramaId'), title, seasonNumber: Number(fd.get('seasonNumber')),
        episodeNumber: Number(fd.get('episodeNumber')), durationMinutes: Number(fd.get('durationMinutes')),
        streamUrl: fd.get('streamUrl') || '', accessLevel: fd.get('accessLevel'),
        enabled: fd.get('enabled') === 'on', playerType: 'video',
      };
      try {
        await saveDoc('episodes', id, payload);
        message = 'Saved.';
        await load();
        render();
      } catch (err) { message = err?.message || 'Save failed.'; render(); }
    });
  }

  function wireAdForm() {
    const form = document.getElementById('ad-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const title = fd.get('title');
      if (!title?.trim()) { message = 'Title is required.'; render(); return; }
      const id = `ad-${Date.now().toString(36)}`;
      const payload = {
        title, image: fd.get('image') || '', mobileImage: fd.get('mobileImage') || '',
        link: fd.get('link') || '', placement: fd.get('placement'), order: Number(fd.get('order')) || 1,
        enabled: fd.get('enabled') === 'on',
      };
      try {
        await setDoc(doc(db, 'ads', id), { ...payload, id, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true });
        message = 'Saved.';
        await load();
        render();
      } catch (err) { message = err?.message || 'Save failed.'; render(); }
    });
  }

  root.innerHTML = `<div class="empty-state">Loading…</div>`;
  await load();
  render();
}
