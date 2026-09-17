import { Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export function isVip(profile?: UserProfile | null) {
  if (!profile || profile.status !== 'active') return false;
  if (profile.plan === 'vip') {
    if (!profile.vipUntil) return true;
    const value:any = profile.vipUntil;
    const until = value instanceof Timestamp ? value.toMillis() : value?.toDate ? value.toDate().getTime() : new Date(value).getTime();
    return Number.isFinite(until) && until >= Date.now();
  }
  return false;
}

export function canAccess(level: 'free' | 'vip' | undefined, profile?: UserProfile | null) {
  return level !== 'vip' || isVip(profile);
}
