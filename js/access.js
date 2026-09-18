export function isVip(profile) {
  if (!profile || profile.status !== 'active') return false;
  if (profile.plan === 'vip') {
    if (!profile.vipUntil) return true;
    const v = profile.vipUntil;
    const until = v?.toMillis ? v.toMillis() : v?.toDate ? v.toDate().getTime() : new Date(v).getTime();
    return Number.isFinite(until) && until >= Date.now();
  }
  return false;
}

export function canAccess(level, profile) {
  return level !== 'vip' || isVip(profile);
}
