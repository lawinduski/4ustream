import { initShell, channelCardHTML, wireFavoriteButtons, protectSection } from '../app.js';
import { getChannels } from '../content.js';
import { icon } from '../icons.js';

document.getElementById('ic-search').innerHTML = icon('search', 20);

const state = await initShell('home');
const root = document.getElementById('protected-root');

if (protectSection(root, { ...state, loading: false })) {
  const qInput = document.getElementById('q');
  const grid = document.getElementById('results-grid');
  const noResults = document.getElementById('no-results');
  let channels = [];

  try {
    channels = await getChannels();
  } catch (err) { console.error(err); }

  function render() {
    const q = qInput.value.trim();
    if (!q) { grid.innerHTML = ''; noResults.classList.add('hidden'); return; }
    const list = channels.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
    grid.innerHTML = list.map(channelCardHTML).join('');
    noResults.classList.toggle('hidden', list.length !== 0);
    wireFavoriteButtons(grid, state.user);
  }

  qInput.addEventListener('input', render);
}
