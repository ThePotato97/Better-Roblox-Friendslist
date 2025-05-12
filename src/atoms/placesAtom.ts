import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Place } from "../database/FriendsDB";

export type PlaceAtom = Omit<Place, "lastUpdated">;

export const placesAtom = atom<Record<number, PlaceAtom>>({});

placesAtom.onMount = (set) => {
  FriendsDB().then(async (db) => {
    const places = await db.getAll("places");
    const map: Record<number, PlaceAtom> = Object.fromEntries(
      places.map(({ lastUpdated: _lastUpdated, ...rest }) => [
        rest.placeId,
        rest,
      ]),
    );
    set(map);
  });
};

export async function updatePlacesBatch(
  placesList: Omit<Place, "lastUpdated">[],
) {
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
