import { fetchApi } from "rozod";
import { postPresenceUsers } from "rozod/lib/endpoints/presencev1";
import cache from "webext-storage-cache/legacy.js";

const PRESENCE_UPDATE_INTERVAL = 10;

interface UserPresence {
	userId: number;
	placeId: number;
	universeId: number;
	rootPlaceId: number;
	userPresenceType: 0 | 2 | 1 | 3 | 4;
	lastLocation: string;
	gameId: string;
}

const API_NAME = "pPU";

export const fetchPresence = async (friends: number[], userId: number) => {
	const uniqueName = `${API_NAME}-${userId}`;

	if (await cache.has(uniqueName)) {
		return (await cache.get(uniqueName)) as UserPresence[];
	}

	const presence = await fetchApi(postPresenceUsers, {
		body: { userIds: friends },
	});

	const { userPresences } = presence;

	const merged = userPresences.map((user) => {
		return { ...user, lastOnline: "1970-01-01T00:00:00Z" };
	});

	await cache.set(uniqueName, merged, {
		seconds: PRESENCE_UPDATE_INTERVAL,
	});

	console.log("presence merge", merged);
	return merged;
};
