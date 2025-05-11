import { atom } from "jotai";
import { friendsAtom, presenceAtom } from ".";
import { Friend } from "../database/FriendsDB";
import { PresenceTypes } from "../global";

export interface FriendGroup {
	id: number;
	isGameGroup: boolean;
	friends: Friend[];
}

export const groupsAtom = atom<FriendGroup[]>((get) => {
	const friendsMap = get(friendsAtom);
	const presenceMap = get(presenceAtom);

	const allFriends = Object.values(friendsMap).sort((a, b) => {
		return Number(a.userId) - Number(b.userId);
	});

	// const allFriends = Object.values(friendsMap).sort((left, right) =>
	// 	left.username.localeCompare(right.username),
	// );

	// 1) Identify game sessions that have >1 player
	const sessionCounts = allFriends.reduce<Record<number, number>>(
		(acc, friend) => {
			const sessionId = presenceMap[friend.userId]?.rootPlaceId;
			if (sessionId != null) {
				acc[sessionId] = (acc[sessionId] || 0) + 1;
			}
			return acc;
		},
		{},
	);

	// 2) Build buckets
	const buckets: Record<string, FriendGroup> = {};

	for (const friend of allFriends) {
		const presence = presenceMap[friend.userId];
		if (!presence) continue;

		const isMultiPlayerSession = sessionCounts[presence.rootPlaceId] > 1;
		let bucketKey: string;
		let bucketId: number;
		let bucketIsGameGroup: boolean;

		if (isMultiPlayerSession) {
			bucketKey = `game-${presence.rootPlaceId}`;
			bucketId = presence.rootPlaceId!;
			bucketIsGameGroup = true;
		} else {
			bucketKey = `status-${presence.userPresenceType}`;
			bucketId = presence.userPresenceType;
			bucketIsGameGroup = false;
		}

		if (!buckets[bucketKey]) {
			buckets[bucketKey] = {
				id: bucketId,
				isGameGroup: bucketIsGameGroup,
				friends: [],
			};
		}
		buckets[bucketKey].friends.push(friend);
	}

	// 3) Split out explicit groups
	const gameGroups = Object.values(buckets).filter(
		(group) => group.isGameGroup,
	);

	const inGameGroup: FriendGroup = {
		id: PresenceTypes.IN_GAME,
		isGameGroup: false,
		friends: (buckets[`status-${PresenceTypes.IN_GAME}`]?.friends || []).sort(
			(a, b) => {
				const aHasPlace = presenceMap[a.userId]?.rootPlaceId != null;
				const bHasPlace = presenceMap[b.userId]?.rootPlaceId != null;
				return Number(bHasPlace) - Number(aHasPlace); // true first
			},
		),
	};

	const inStudioGroup: FriendGroup = {
		id: PresenceTypes.IN_STUDIO,
		isGameGroup: false,
		friends: (buckets[`status-${PresenceTypes.IN_STUDIO}`]?.friends || []).sort(
			(a, b) => {
				const aHasPlace = presenceMap[a.userId]?.rootPlaceId != null;
				const bHasPlace = presenceMap[b.userId]?.rootPlaceId != null;
				return Number(bHasPlace) - Number(aHasPlace); // true first
			},
		),
	};

	const offlineGroup: FriendGroup = {
		id: PresenceTypes.OFFLINE,
		isGameGroup: false,
		friends: (buckets[`status-${PresenceTypes.OFFLINE}`]?.friends || []).sort(
			(a, b) => {
				const aLastOnline =
					presenceMap[a.userId]?.lastOnline ?? Number.NEGATIVE_INFINITY;
				const bLastOnline =
					presenceMap[b.userId]?.lastOnline ?? Number.NEGATIVE_INFINITY;
				return bLastOnline - aLastOnline;
			},
		),
	};

	// 4) Return in desired order
	return [...gameGroups, inGameGroup, inStudioGroup, offlineGroup];
});
