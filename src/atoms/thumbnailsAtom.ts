import { atom, getDefaultStore } from "jotai";
import {
	FriendsDB,
	Thumbnail,
	ThumbnailRequestId,
} from "../database/FriendsDB";

export const thumbnailsAtom = atom<Record<ThumbnailRequestId, Thumbnail>>({});

thumbnailsAtom.onMount = (set) => {
	FriendsDB().then(async (db) => {
		const thumbnails = await db.getAll("thumbnails");
		const map: Record<ThumbnailRequestId, Thumbnail> = Object.fromEntries(
			thumbnails.map((thumbnail) => [thumbnail.requestId, thumbnail]),
		);
		set(map);
	});
};

export async function updateThumbnailsBatch(
	thumbnailsList: Omit<Thumbnail, "lastUpdated">[],
) {
	const db = await FriendsDB();
	const transaction = db.transaction("thumbnails", "readwrite");

	const now = Date.now();
	const updatedMap: Record<ThumbnailRequestId, Thumbnail> = {};

	for (const thumbnailEntry of thumbnailsList) {
		const updatedEntry = {
			...thumbnailEntry,
			lastUpdated: now,
		};
		transaction.store.put(updatedEntry);
		updatedMap[thumbnailEntry.requestId] = updatedEntry;
	}

	await transaction.done;

	// Merge once into atom
	const store = getDefaultStore();
	store.set(thumbnailsAtom, (existingPresence) => ({
		...existingPresence,
		...updatedMap,
	}));
}
