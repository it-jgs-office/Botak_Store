/* Preferensi dan data tambahan profil tersimpan melalui API akun. */

import { fetchProfileExtras, updateProfileExtras } from "./api";

export type ProfileExtras = {
  avatar?: string | null;
  gameNickname?: string;
  gameUserId?: string;
  gameServerId?: string;
  notifOrder: boolean;
  notifPromo: boolean;
};

const DEFAULTS: ProfileExtras = { notifOrder: true, notifPromo: true };

export async function getProfileExtras(): Promise<ProfileExtras> {
  const response = await fetchProfileExtras<ProfileExtras>();
  return { ...DEFAULTS, ...response.data };
}

export async function saveProfileExtras(patch: Partial<ProfileExtras>): Promise<ProfileExtras> {
  const current = await getProfileExtras();
  const response = await updateProfileExtras<ProfileExtras>({ ...current, ...patch });
  return { ...DEFAULTS, ...response.data };
}
