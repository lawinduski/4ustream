import type { MediaItem } from '@/lib/types';

export function getGenres(item: MediaItem): string[] {
  const values = [...(item.genres ?? []), ...(item.genre ? item.genre.split(',') : [])]
    .map(v => v.trim()).filter(Boolean);
  return [...new Set(values)];
}

export function formatRuntime(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60); const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function getBackdrop(item: MediaItem): string {
  return item.backdrop || item.images?.find(i => i.type === 'backdrop')?.url || item.poster;
}

export function getLogo(item: MediaItem): string | undefined {
  return item.logo || item.images?.find(i => i.type === 'logo')?.url;
}
