import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Friend } from "../database/FriendsDB";
import { db } from "../database/tables";

export type FriendAtom = Omit<Friend, "lastUpdated">;

export const friendsAtom = atom<Array<FriendAtom>>([]);

friendsAtom.onMount = (set) => {
  FriendsDB().then(async (db) => {
    const data = await db.getAll("friends");
    const stripped = data.map(({ lastUpdated: _lastUpdated, ...rest }) => rest);

    set(stripped);
  });
};

export async function updateFriendsBatch(friendList: Array<number>) {
  const database = await FriendsDB();
  const store = getDefaultStore();

  const existingFriendsArray = await database.getAll("friends");

  const existingMap = new Map<number, Friend>();
  for (const friend of existingFriendsArray) {
    existingMap.set(friend.userId, friend);
  }

  const now = Date.now();
  const transaction = database.transaction("friends", "readwrite");

  for (const newEntry of friendList) {
    const existing = existingMap.get(newEntry);

    const merged: Friend = {
      ...existing,
      userId: newEntry,
      lastUpdated: now,
    };

    transaction.store.put(merged);
    existingMap.set(merged.userId, merged);
  }

  await transaction.done;
  // Strip `lastUpdated` before storing in atom
  const finalFriends = Array.from(existingMap.values()).map(
    ({ lastUpdated: _lastUpdated, ...rest }) => rest,
  );

  store.set(friendsAtom, finalFriends);
}
