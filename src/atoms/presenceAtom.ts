import { atom } from "jotai";
import { getDefaultStore } from "jotai";
import {
  FriendsDB,
  Presence,
  PresenceType,
  ttlConfig,
} from "../database/FriendsDB";
import { PresenceTypes } from "../global";

const store = getDefaultStore();

export const presenceAtom = atom<Record<number, Presence>>({});

const TTL = 5 * 60 * 1000;

export const presenceHydratedAtom = atom(null, async (get, set) => {
  const now = Date.now();

  const db = await FriendsDB();

  const all = await db.getAll("presences");

  const map: Record<number, Presence> = {};
  for (const p of all) {
    if (now - p.lastUpdated <= ttlConfig.presences.prune) {
      map[p.userId] = p;
    } else {
      await db.delete("presences", p.userId);
    }
  }
  set(presenceAtom, map);
});

export async function updatePresenceBatch(
  presenceList: Omit<Omit<Presence, "lastUpdated">, "lastOnline">[],
) {
  const db = await FriendsDB();

  // 1) grab the in‑memory map so we know each user’s existing lastOnline
  const store = getDefaultStore();
  const existingMap = store.get(presenceAtom);

  // 2) batch‑write to IndexedDB
  const tx = db.transaction("presences", "readwrite");
  const now = Date.now();
  const updatedMap: Record<number, Presence> = {};

  for (const entry of presenceList) {
    // decide whether to refresh lastOnline
    const old = existingMap[entry.userId];
    const lastOnline =
      entry.userPresenceType !== PresenceType.Offline ? now : old?.lastOnline;

    const stamped: Presence = {
      ...entry,
      lastOnline: lastOnline,
      lastUpdated: now,
    };

    tx.store.put(stamped);
    updatedMap[entry.userId] = stamped;
  }
  await tx.done;

  // 3) merge once into the atom
  store.set(presenceAtom, (prev) => ({
    ...prev,
    ...updatedMap,
  }));
}
