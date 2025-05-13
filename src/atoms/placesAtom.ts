import { atom, getDefaultStore } from "jotai";
import { FriendsDB, Place } from "../database/FriendsDB";
import { time } from "../helpers/timeHelper";

export type PlaceAtom = Omit<Place, "lastUpdated">;

export const placesAtom = atom<Record<number, PlaceAtom>>({});
placesAtom.debugLabel = "placesAtom";
const store = getDefaultStore();

store.sub(placesAtom, () => {});

export const placesHydratedAtom = atom(null, async (get, set) => {
  const db = await FriendsDB();
  const places = await db.getAll("places");
  const map: Record<number, PlaceAtom> = Object.fromEntries(
    places.map(({ lastUpdated: _, ...rest }) => [rest.placeId, rest]),
  );
  set(placesAtom, map);
});

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

  store.set(placesAtom, (existingPresence) => ({
    ...existingPresence,
    ...updatedMap,
  }));
}
