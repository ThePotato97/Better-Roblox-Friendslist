import { atom, getDefaultStore } from "jotai";
import { isEqual } from "lodash";
import { presenceAtom } from "./";
import { selectAtom } from "jotai/utils";

const store = getDefaultStore();

export const getMissingPresence = (ids: number[]): number[] => {
  const filteredIds = ids.filter((id) => id !== null);
  const uniqueIds = Array.from(new Set(filteredIds));

  const presenceState = store.get(presenceAtom);

  return uniqueIds.filter((id) => {
    const presence = presenceState[id];
    return !presence;
  });
};

export const presencePlaceFlagsAtom = selectAtom(presenceAtom, (presence) => {
  const result: Record<number, boolean> = {};
  for (const [userId, pres] of Object.entries(presence)) {
    result[+userId] = pres.rootPlaceId != null;
  }
  return result;
});

export const presencePlaceIdsAtom = selectAtom(
  presenceAtom,
  (presence) =>
    Object.values(presence)
      .map((p) => p.placeId)
      .filter((id): id is number => id != null)
      // No need for .slice() here since .sort() creates a new array
      .sort((a, b) => a - b),
  // Add equality function to prevent unnecessary updates
  (prev, next) => isEqual(prev, next),
);

export const createPresenceSelector = (userId: number) =>
  selectAtom(presenceAtom, (p) => p[userId]);
