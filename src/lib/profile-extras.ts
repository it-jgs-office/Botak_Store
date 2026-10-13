/* Preferensi & data tambahan profil — tersimpan murni di localStorage per user. */

export type ProfileExtras = {
  avatar?: string; // data URL (base64)
  gameNickname?: string;
  gameUserId?: string;
  gameServerId?: string;
  notifOrder: boolean;
  notifPromo: boolean;
};

const DEFAULTS: ProfileExtras = { notifOrder: true, notifPromo: true };

const key = (userId: string) => `bs_profile_extras_${userId}`;

export function getProfileExtras(userId: string): ProfileExtras {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ProfileExtras>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveProfileExtras(userId: string, patch: Partial<ProfileExtras>): ProfileExtras {
  const next = { ...getProfileExtras(userId), ...patch };
  window.localStorage.setItem(key(userId), JSON.stringify(next));
  window.dispatchEvent(new Event("bs-profile-extras"));
  return next;
}

export function clearProfileExtras(userId: string) {
  window.localStorage.removeItem(key(userId));
  window.dispatchEvent(new Event("bs-profile-extras"));
}
