import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firebaseApp } from './firebase';

export const storage = getStorage(firebaseApp);
const allowed = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);

export async function uploadAdminAsset(file: File, folder: string) {
  if (!allowed.has(file.type)) throw new Error('Unsupported image type. Use PNG, JPG, WEBP, GIF or SVG.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Image is too large. Maximum size is 8MB.');
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]+/g, '-').replace(/^\/+|\/+$/g, '') || 'misc';
  const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 120);
  const path = `public-assets/${safeFolder}/${Date.now()}-${safe || 'asset'}`;
  const snapshot = await uploadBytes(ref(storage, path), file, { contentType: file.type, cacheControl: 'public,max-age=31536000,immutable' });
  return getDownloadURL(snapshot.ref);
}


export async function uploadAdminFile(file: File, folder: string, options?: { contentTypes?: string[]; maxBytes?: number }) {
  const contentTypes = options?.contentTypes || ['text/vtt'];
  const maxBytes = options?.maxBytes ?? 2 * 1024 * 1024;
  if (!contentTypes.includes(file.type) && !(file.name.toLowerCase().endsWith('.vtt') && contentTypes.includes('text/vtt'))) {
    throw new Error(`Unsupported file type. Allowed: ${contentTypes.join(', ')}`);
  }
  if (file.size > maxBytes) throw new Error(`File is too large. Maximum is ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]+/g, '-').replace(/^\/+|\/+$/g, '') || 'files';
  const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 120);
  const path = `public-assets/${safeFolder}/${Date.now()}-${safe || 'file.vtt'}`;
  const snapshot = await uploadBytes(ref(storage, path), file, { contentType: file.type || 'text/vtt', cacheControl: 'public,max-age=31536000,immutable' });
  return getDownloadURL(snapshot.ref);
}
