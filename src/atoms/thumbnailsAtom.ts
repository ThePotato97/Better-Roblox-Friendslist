import { atom, getDefaultStore } from "jotai";
import {
  FriendsDB,
  Thumbnail,
  ThumbnailRequestId,
} from "../database/FriendsDB";
export type ThumbnailAtom = Omit<Thumbnail, "lastUpdated">;
export const thumbnailsAtom = atom<Record<ThumbnailRequestId, ThumbnailAtom>>(
  {},
);

thumbnailsAtom.onMount = (set) => {
  FriendsDB().then(async (db) => {
    const thumbnails = await db.getAll("thumbnails");
    const map: Record<ThumbnailRequestId, ThumbnailAtom> = Object.fromEntries(
      thumbnails.map(({ lastUpdated: _lastUpdated, ...rest }) => [
        rest.requestId,
        rest,
      ]),
    );
    set(map);
  });
};

export async function updateThumbnailsBatch(
  thumbnailsList: Array<ThumbnailAtom>,
) {
  const db = await FriendsDB();
  const transaction = db.transaction("thumbnails", "readwrite");

  const now = Date.now();
  const updatedMap: Record<ThumbnailRequestId, ThumbnailAtom> = {};

  for (const thumbnailEntry of thumbnailsList) {
    const updatedDataBaseEntry = {
      ...thumbnailEntry,
      lastUpdated: now,
    };

    transaction.store.put(updatedDataBaseEntry);
    updatedMap[thumbnailEntry.requestId] = thumbnailEntry;
  }

  await transaction.done;

  // Merge once into atom
  const store = getDefaultStore();
  store.set(thumbnailsAtom, (existingThumbnails) => ({
    ...existingThumbnails,
    ...updatedMap,
  }));
}
