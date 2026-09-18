import { initShell, mediaCardHTML, wireFavoriteButtons, protectSection } from '../app.js';
import { getMedia } from '../content.js';

const state = await initShell('films');
const root = document.getElementById('protected-root');
if (protectSection(root, { ...state, loading: false })) {
  document.getElementById('access-pill').textContent = state.isVip ? 'VIP ACCESS' : 'FREE ACCESS';
  try {
    const items = (await getMedia(true, state.isVip)).filter(i => i.type === 'film' && i.enabled !== false);
    const grid = document.getElementById('films-grid');
    grid.innerHTML = items.map(mediaCardHTML).join('');
    document.getElementById('empty').classList.toggle('hidden', items.length !== 0);
    await wireFavoriteButtons(grid, state.user);
  } catch (err) { console.error(err); }
}
