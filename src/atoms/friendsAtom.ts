import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Friend } from "../database/FriendsDB";

export const friendsAtom = atom<Array<Friend>>([]);

friendsAtom.onMount = (set) => {
	FriendsDB().then(async (db) => {
		const data = await db.getAll("friends");
		set(data);
	});
};

export async function updateFriendsBatch(
	friendList: Array<Omit<Friend, "lastUpdated">>,
) {
	const database = await FriendsDB();
	const transaction = database.transaction("friends", "readwrite");

	const now = Date.now();

	const updatedFriends: Friend[] = [];

	for (const friendEntry of friendList) {
		const updatedFriend: Friend = {
			...friendEntry,
			lastUpdated: now,
		};
		updatedFriends.push(updatedFriend);
		transaction.store.put(updatedFriend);
	}

	await transaction.done;

	const store = getDefaultStore();
	store.set(friendsAtom, updatedFriends);
}
