import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Friend } from "../database/FriendsDB";

export const friendsAtom = atom<Array<Friend>>([]);

friendsAtom.onMount = (set) => {
	FriendsDB().then(async (db) => {
		const data = await db.getAll("friends");
		set(data);
	});
};

export async function updateFriendsBatch(friendList: Array<number>) {
	const database = await FriendsDB();
	const store = getDefaultStore();

	const existingFriendsArray: Friend[] = store.get(friendsAtom);
	const existingMap = new Map<number, Friend>();
	for (const friend of existingFriendsArray) {
		existingMap.set(friend.userId, friend);
	}

	const now = Date.now();
	const mergedFriends: Friend[] = [];

	const transaction = database.transaction("friends", "readwrite");

	for (const newEntry of friendList) {
		const existing = existingMap.get(newEntry);

		const merged: Friend = {
			...existing,
			userId: newEntry,
			lastUpdated: now,
		};

		mergedFriends.push(merged);
		transaction.store.put(merged); // IDB handles upserts
		existingMap.set(merged.userId, merged); // Keep map in sync
	}

	await transaction.done;

	// Create a merged array for atom (preserving others if not updated)
	const finalFriends = Array.from(existingMap.values());

	store.set(friendsAtom, finalFriends);
}
