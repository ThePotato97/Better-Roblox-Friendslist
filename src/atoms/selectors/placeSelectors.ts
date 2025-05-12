import { atom, getDefaultStore } from "jotai";

import { placesAtom } from "..";
import { atomFamily, selectAtom } from "jotai/utils";

const store = getDefaultStore();

export const getMissingPlacesDetails = (ids: number[]): number[] => {
  const filteredIds = ids.filter((id) => id !== null);
  const uniqueIds = Array.from(new Set(filteredIds));
  const placeDetails = store.get(placesAtom);

  return uniqueIds.filter((id) => {
    const thumb = placeDetails[id];
    return !thumb;
  });
};

export const placesPlaceIds = selectAtom(placesAtom, (places) =>
  Object.values(places)
    .map((p) => p.placeId)
    .sort((a, b) => a - b),
);

export const placeDetailsFamily = atomFamily((placeId: number | undefined) =>
  selectAtom(placesAtom, (places) => {
    // Touch something to ensure subscription
    void places;

    if (placeId === undefined) return undefined;
    return places[placeId];
  }),
);
