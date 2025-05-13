import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Friend } from "../database/FriendsDB";

const store = getDefaultStore();

export type FriendAtom = Omit<Friend, "lastUpdated">;

export type FriendAtomMap = Map<number, FriendAtom>;

export const friendsAtom = atom<FriendAtomMap>(new Map());

export const friendsHydratedAtom = atom(null, async (_get, set) => {
  const db = await FriendsDB();
  const data = await db.getAll("friends");

  const map = new Map<number, FriendAtom>();
  for (const { lastUpdated: _lastUpdated, ...friend } of data) {
    map.set(friend.userId, friend);
  }

  set(friendsAtom, map);
});

export const convertToFriendAtom = (friends: number[]): FriendAtom[] =>
  friends.map((userId) => ({ userId }));

export async function streamFriendsPartial(friends: number[]) {
  const partial = convertToFriendAtom(friends);
  const db = await FriendsDB();
  const tx = db.transaction("friends", "readwrite");

  const now = Date.now();
  for (const friend of partial) {
    tx.store.put({ ...friend, lastUpdated: now });
  }

  await tx.done;

  store.set(friendsAtom, (prev) => {
    const next = new Map(prev);
    for (const friend of partial) {
      next.set(friend.userId, friend);
    }
    return next;
  });
}

export async function overwriteFriends(friends: number[]) {
  const allFriends = convertToFriendAtom(friends);
  const db = await FriendsDB();
  const tx = db.transaction("friends", "readwrite");

  await tx.store.clear();

  const now = Date.now();
  for (const friend of allFriends) {
    tx.store.put({ ...friend, lastUpdated: now });
  }

  await tx.done;

  const map = new Map<number, FriendAtom>();
  for (const friend of allFriends) {
    map.set(friend.userId, friend);
  }

  store.set(friendsAtom, map);
}

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
