let dict = null;
let loading = null;

async function load() {
  if (dict) return dict;
  if (!loading) {
    loading = fetch('/data/i18n.json').then(r => r.json()).then(j => (dict = j));
  }
  return loading;
}

export function getLang() {
  return localStorage.getItem('4u-lang') || 'badini';
}

export function setLang(l) {
  localStorage.setItem('4u-lang', l);
}

export async function t(key) {
  const d = await load();
  const lang = getLang();
  return (d[lang] && d[lang][key]) || (d.en && d.en[key]) || key;
}

// Synchronous translate — use after ensureI18n() has resolved once.
export function tSync(key) {
  const lang = getLang();
  if (!dict) return key;
  return (dict[lang] && dict[lang][key]) || (dict.en && dict.en[key]) || key;
}

export async function ensureI18n() {
  await load();
  return dict;
}

export function dirFor(lang) {
  return lang === 'en' ? 'ltr' : 'rtl';
}
