import { atom } from "jotai";
import { getDefaultStore } from "jotai";
import { FriendsDB, Profiles } from "../database/FriendsDB";

export type ProfilesAtom = Omit<Profiles, "lastUpdated">;
export const profilesAtom = atom<Record<number, ProfilesAtom>>({});

const TTL = 60 * 60 * 1000;

const store = getDefaultStore();

export const profilesHydratedAtom = atom(null, async (get, set) => {
  const db = await FriendsDB();
  const all = await db.getAll("profiles");
  const map: Record<number, ProfilesAtom> = {};

  for (const p of all) {
    const { lastUpdated: _lastUpdated, ...rest } = p;
    map[rest.userId] = rest;
  }

  set(profilesAtom, map);
});

export async function updateProfilesBatch(profilesList: ProfilesAtom[]) {
  const db = await FriendsDB();
  const now = Date.now();
  const tx = db.transaction("profiles", "readwrite");

  const updatedMap: Record<number, ProfilesAtom> = {};

  for (const entry of profilesList) {
    const stamped: Profiles = {
      ...entry,
      lastUpdated: now,
    };

    tx.store.put(stamped);
    updatedMap[entry.userId] = entry; // Keep atom clean (ProfilesAtom)
  }

  await tx.done;

  store.set(profilesAtom, (prev) => ({
    ...prev,
    ...updatedMap,
  }));
}
