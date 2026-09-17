import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firebaseApp } from './firebase';

export const storage = getStorage(firebaseApp);

export async function uploadAdminAsset(file: File, folder: string) {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const path = `public-assets/${folder}/${Date.now()}-${safe}`;
  const snapshot = await uploadBytes(ref(storage, path), file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}
