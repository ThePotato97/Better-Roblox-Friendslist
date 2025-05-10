import { atom } from "jotai";
import { getDefaultStore } from "jotai";
import { FriendsDB, Presence } from "../database/FriendsDB";

export const presenceAtom = atom<Record<number, Presence>>({});

presenceAtom.onMount = (set) => {
	FriendsDB().then(async (db) => {
		const now = Date.now();
		const ttl = 5 * 60 * 1000;
		const all = await db.getAll("presences");

		const map: Record<number, Presence> = {};
		for (const p of all) {
			if (now - p.lastUpdated <= ttl) {
				map[p.userId] = p;
			} else {
				await db.delete("presences", p.userId); // optional TTL prune
			}
		}
		set(map);
	});
};

export async function updatePresenceBatch(presenceList: Presence[]) {
	const db = await FriendsDB();
	const transaction = db.transaction("presences", "readwrite");

	const now = Date.now();
	const updatedMap: Record<number, Presence> = {};

	for (const presenceEntry of presenceList) {
		const updatedEntry = {
			...presenceEntry,
			lastUpdated: now,
		};
		transaction.store.put(updatedEntry);
		updatedMap[presenceEntry.userId] = updatedEntry;
	}

	await transaction.done;

	// Merge once into atom
	const store = getDefaultStore();
	store.set(presenceAtom, (existingPresence) => ({
		...existingPresence,
		...updatedMap,
	}));
}
