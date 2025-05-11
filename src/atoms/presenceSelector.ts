import { getDefaultStore } from "jotai";

import { presenceAtom } from "./";

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
