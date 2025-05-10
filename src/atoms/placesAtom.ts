import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Place } from "../database/FriendsDB";

export const placesAtom = atom<Record<number, Place> | null>(null);

placesAtom.onMount = (set) => {
	FriendsDB().then(async (db) => {
		const places = await db.getAll("places");
		const map: Record<number, Place> = Object.fromEntries(
			places.map((place) => [place.placeId, place]),
		);

		set(map);
	});
};

export async function updatePlacesBatch(placesList: Place[]) {
	const db = await FriendsDB();
	const transaction = db.transaction("places", "readwrite");

	const now = Date.now();
	const updatedMap: Record<number, Place> = {};

	for (const presenceEntry of placesList) {
		const updatedEntry = {
			...presenceEntry,
			lastUpdated: now,
		};
		transaction.store.put(updatedEntry);
		updatedMap[presenceEntry.placeId] = updatedEntry;
	}

	await transaction.done;

	// Merge once into atom
	const store = getDefaultStore();
	store.set(placesAtom, (existingPresence) => ({
		...existingPresence,
		...updatedMap,
	}));
}
