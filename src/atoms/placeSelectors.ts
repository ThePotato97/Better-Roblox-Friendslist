import { getDefaultStore } from "jotai";

import { placesAtom } from "./";

const store = getDefaultStore();

export const getMissingPlacesDetails = (ids: number[]): number[] => {
	const placeDetails = store.get(placesAtom);

	return ids.filter((id) => {
		const thumb = placeDetails[id];
		return !thumb;
	});
};
