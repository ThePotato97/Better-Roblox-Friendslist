import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Friend } from "../database/FriendsDB";

const store = getDefaultStore();

export type FriendAtom = Omit<Friend, "lastUpdated">;

export const friendsAtom = atom<Array<FriendAtom>>([]);

export const friendsHydratedAtom = atom(null, async (get, set) => {
  const db = await FriendsDB();
  const data = await db.getAll("friends");
  const stripped: FriendAtom[] = data.map(
    ({ lastUpdated: _lastUpdated, ...rest }) => rest,
  );
  set(friendsAtom, stripped);
});

export async function updateFriendsBatch(friendIds: number[]) {
  const db = await FriendsDB();
  const existing = await db.getAll("friends");

  const map = new Map<number, Friend>();
  for (const f of existing) map.set(f.userId, f);

  const now = Date.now();
  const tx = db.transaction("friends", "readwrite");

  for (const userId of friendIds) {
    const merged: Friend = {
      userId,
      lastUpdated: now,
    };
    tx.store.put(merged);
    map.set(userId, merged);
  }

  await tx.done;

  const stripped = Array.from(map.values()).map(
    ({ lastUpdated: _lastUpdated, ...rest }) => rest,
  );

  store.set(friendsAtom, stripped);
}
