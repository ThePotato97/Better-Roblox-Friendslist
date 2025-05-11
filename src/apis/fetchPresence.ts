import { fetchApi } from "rozod";
import { postPresenceUsers } from "rozod/lib/endpoints/presencev1";
import cache from "webext-storage-cache/legacy.js";

interface UserPresence {
	userId: number;
	placeId: number;
	universeId: number;
	rootPlaceId: number;
	userPresenceType: 0 | 2 | 1 | 3 | 4;
	lastLocation: string;
	gameId: string;
}

const MAX_BATCH_SIZE = 200;

export const fetchPresence = async (
	friends: number[],
	onPage?: (batch: UserPresence[]) => void,
): Promise<UserPresence[]> => {
	const merged: UserPresence[] = [];

	for (let i = 0; i < friends.length; i += MAX_BATCH_SIZE) {
		const batch = friends.slice(i, i + MAX_BATCH_SIZE);
		const presence = await fetchApi(postPresenceUsers, {
			body: { userIds: batch },
		});

		const { userPresences } = presence;
		if (onPage) {
			onPage(userPresences);
		}

		merged.push(...userPresences);
	}

	console.log("presence merge", merged);
	return merged;
};
