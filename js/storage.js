import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js';
import { storage } from './firebase-init.js';

export async function uploadAdminAsset(file, folder) {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const path = `public-assets/${folder}/${Date.now()}-${safe}`;
  const r = ref(storage, path);
  const snapshot = await uploadBytes(r, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}
