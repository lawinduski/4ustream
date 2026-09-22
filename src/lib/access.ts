import { Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.getTime();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return new Date(value).getTime();
  return Number.NaN;
}

export function isVip(profile?: UserProfile | null): boolean {
  if (!profile || profile.status !== 'active' || profile.plan !== 'vip') return false;
  if (!profile.vipUntil) return true;
  const until = toMillis(profile.vipUntil);
  return Number.isFinite(until) && until >= Date.now();
}

export function canAccess(level: 'free' | 'vip' | undefined, profile?: UserProfile | null): boolean {
  return level !== 'vip' || isVip(profile);
}

export function formatVipUntil(value: unknown): string {
  const millis = toMillis(value);
  return Number.isFinite(millis) ? new Date(millis).toLocaleDateString() : '';
}
