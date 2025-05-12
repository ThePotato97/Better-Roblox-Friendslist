import { FriendsDB, PresenceType } from "../database/FriendsDB";

const MAX_PROFILES = 50;

export const getProfilesToLoad = async () => {
  const db = await FriendsDB();

  const profiles = await db.getAll("profiles");

  const hasProfile = new Set(profiles.map((p) => p.userId));

  const tx = db.transaction("presences", "readonly");
  const store = tx.objectStore("presences");
  const byStatus = store.index("by-status");

  const fetchByStatus = async (status: PresenceType) =>
    await byStatus.getAll(status);

  const online = await fetchByStatus(PresenceType.Online);
  const offline = await fetchByStatus(PresenceType.Offline);
  const ingame = await fetchByStatus(PresenceType.InGame);
  const studio = await fetchByStatus(PresenceType.InStudio);

  const filterNeedsProfile = (ids: number[]) => {
    return ids.filter((id) => !hasProfile.has(id));
  };

  const result: number[] = [];

  const push = (entries: typeof result) => {
    const remaining = MAX_PROFILES - result.length;
    if (remaining > 0) result.push(...entries.slice(0, remaining));
  };

  for (const ids of [online, ingame, studio, offline]) {
    push(filterNeedsProfile(ids.map((p) => p.userId)));
    if (result.length >= MAX_PROFILES) return result;
  }

  return result;
};
