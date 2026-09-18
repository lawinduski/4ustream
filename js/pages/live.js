import { initShell, channelCardHTML, wireFavoriteButtons, protectSection } from '../app.js';
import { getChannels } from '../content.js';
import { renderPlayer } from '../player.js';
import { icon } from '../icons.js';

document.getElementById('ic-radio').innerHTML = icon('radio', 17);
document.getElementById('ic-search').innerHTML = icon('search', 18);
document.getElementById('ic-alert').innerHTML = icon('shieldalert', 18);

const state = await initShell('live');
const root = document.getElementById('protected-root');
if (!protectSection(root, { ...state, loading: false })) {
  // protectSection already replaced root's content with the lock/pending screen.
} else {
  let channels = [];
  const params = new URLSearchParams(location.search);
  const selectedId = params.get('channel');

  const grid = document.getElementById('channel-grid');
  const qInput = document.getElementById('q');
  const catSelect = document.getElementById('cat');

  function renderList() {
    const q = qInput.value.toLowerCase();
    const cat = catSelect.value;
    const list = channels.filter(c =>
      (cat === 'ALL' || c.category === cat) &&
      c.name.toLowerCase().includes(q) &&
      (c.enabled || selectedId === c.id)
    );
    grid.innerHTML = list.map(channelCardHTML).join('');
    document.getElementById('no-results').classList.toggle('hidden', list.length !== 0);
    wireFavoriteButtons(grid, state.user);
  }

  function renderPlayerSection() {
    const selected = channels.find(c => c.id === selectedId);
    document.getElementById('player-section').classList.toggle('hidden', !selected);
    document.getElementById('no-selection').classList.toggle('hidden', !!selected);
    if (selected) {
      renderPlayer(document.getElementById('player-mount'), { url: selected.streamUrl, title: selected.name, playerType: selected.playerType });
      document.getElementById('p-category').textContent = selected.category;
      document.getElementById('p-name').textContent = selected.name;
      document.getElementById('p-desc').textContent = selected.description || '';
    }
  }

  try {
    channels = await getChannels(true, state.isVip);
    renderPlayerSection();
    renderList();
  } catch (err) {
    console.error(err);
  }

  qInput.addEventListener('input', renderList);
  catSelect.addEventListener('change', renderList);
}
