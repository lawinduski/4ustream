import { initShell, channelCardHTML, mediaCardHTML, wireFavoriteButtons, adRotatorHTML, wireAdRotator } from '../app.js';
import { getChannels, getMedia } from '../content.js';
import { getAds } from '../ads.js';
import { icon } from '../icons.js';
import { tSync } from '../i18n.js';

document.getElementById('hero-play').innerHTML = icon('play', 17);
document.getElementById('m-zap').innerHTML = icon('zap', 14) + ' Fast UI';
document.getElementById('m-shield').innerHTML = icon('shield', 14) + ' Secure access';
document.getElementById('m-phone').innerHTML = icon('smartphone', 14) + ' PWA';
document.getElementById('q-live').innerHTML = icon('radio', 19);
document.getElementById('q-films').innerHTML = icon('film', 19);
document.getElementById('q-drama').innerHTML = icon('clapper', 19);
document.getElementById('q-vip').innerHTML = icon('crown', 19);
document.querySelectorAll('#cl-live,#cl-films,#cl-drama').forEach(el => el.innerHTML = icon('chevronleft', 15));

const { user, profile, isVip } = await initShell('home');

document.getElementById('hero-secondary').innerHTML =
  (user ? (isVip ? 'VIP MEMBER' : 'FREE ACCOUNT') : tSync('signup')) + icon('crown', 16);
document.getElementById('hero-secondary').href = user ? '/account.html' : '/signup.html';
document.getElementById('q-vip-text').textContent = isVip ? 'Your VIP is active' : 'Explore VIP';

try {
  const [channels, media, ads] = await Promise.all([
    getChannels(true, isVip),
    getMedia(true, isVip),
    getAds(true),
  ]);

  if (ads.length) {
    document.getElementById('ad-slot').innerHTML = adRotatorHTML(ads);
    wireAdRotator(ads);
  }

  const films = media.filter(x => x.type === 'film');
  const dramas = media.filter(x => x.type === 'drama');

  if (channels.length) {
    document.getElementById('section-live').classList.remove('hidden');
    document.getElementById('live-grid').innerHTML = channels.slice(0, 8).map(channelCardHTML).join('');
  }
  if (films.length) {
    document.getElementById('section-films').classList.remove('hidden');
    document.getElementById('films-grid').innerHTML = films.slice(0, 10).map(mediaCardHTML).join('');
  }
  if (dramas.length) {
    document.getElementById('section-drama').classList.remove('hidden');
    document.getElementById('drama-grid').innerHTML = dramas.slice(0, 10).map(mediaCardHTML).join('');
  }

  await wireFavoriteButtons(document, user);
} catch (err) {
  console.error(err);
}
