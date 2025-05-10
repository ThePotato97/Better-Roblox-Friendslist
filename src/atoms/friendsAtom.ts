import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Friend } from "../database/FriendsDB";

export const friendsAtom = atom<Array<Friend>>([]);

friendsAtom.onMount = (set) => {
	FriendsDB().then(async (db) => {
		const data = await db.getAll("friends");
		set(data);
	});
};

export async function updateFriendsBatch(friendList: Friend[]) {
	const database = await FriendsDB();
	const transaction = database.transaction("friends", "readwrite");

	const now = Date.now();

	for (const friendEntry of friendList) {
		const updatedFriend: Friend = {
			...friendEntry,
			lastUpdated: now,
		};

		transaction.store.put(updatedFriend);
	}

	await transaction.done;

	const store = getDefaultStore();
	store.set(friendsAtom, friendList);
}
