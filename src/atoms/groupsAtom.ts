import { atom, Getter } from "jotai";
import { isEqual } from "lodash";
import { friendsAtom, presenceAtom } from ".";
import { Friend } from "../database/FriendsDB";
import { PresenceTypes } from "../global";

export interface FriendGroup {
  id: number;
  isGameGroup: boolean;
  friends: Friend[];
}

function atomWithCompareDerived<Value>(
  read: (get: Getter) => Value,
  areEqual: (prev: Value, next: Value) => boolean,
) {
  let prevValue: Value | undefined = undefined;
  let initialized = false; // To ensure the read function runs at least once

  return atom((get) => {
    const nextValue = read(get); // Compute the potential new value

    // If initialized and the new value is deeply equal to the previous one...
    if (
      initialized &&
      prevValue !== undefined &&
      areEqual(prevValue, nextValue)
    ) {
      return prevValue; // ...return the stable, previous reference.
    }

    // Otherwise, update the stored previous value and return the new value.
    prevValue = nextValue;
    initialized = true;
    return nextValue;
  });
}

// Helper to ensure stable sorting of friends if their order doesn't semantically change the group
// This might be overkill if isEqual handles array order differences appropriately for your needs,
// but explicit sorting ensures consistent internal structure before isEqual is even called.
// For this specific case, the existing sorts within the groups are more important.
const sortFriendsById = (friends: Friend[]): Friend[] => {
  return [...friends].sort((a, b) => Number(a.userId) - Number(b.userId));
};

export const groupsAtom = atomWithCompareDerived<FriendGroup[]>((get) => {
  const friendsMap = get(friendsAtom);
  const presenceMap = get(presenceAtom);

  // Stable sort for allFriends initially to ensure consistent processing order
  // if friendsMap iteration order isn't guaranteed (Object.values might not be).
  const allFriends = Object.values(friendsMap).sort((a, b) => {
    return Number(a.userId) - Number(b.userId);
  });

  // The username sort can also be stable if usernames are unique and don't change often
  // const allFriends = Object.values(friendsMap).sort((left, right) =>
  // 	left.username.localeCompare(right.username),
  // );

  // 1) Identify game sessions that have >1 player
  const sessionCounts = allFriends.reduce<Record<number, number>>(
    (acc, friend) => {
      const presence = presenceMap[friend.userId];
      // Ensure presence and rootPlaceId exist before trying to count
      if (presence?.rootPlaceId != null) {
        const sessionId = presence.rootPlaceId;
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
    // If friend has no presence data, they might be considered offline later
    // or skipped if not handled by a specific group.
    // For this logic, if no presence, they won't be in game/studio/multiplayer.
    if (!presence) continue;

    // Check if rootPlaceId exists for multiplayer session check
    const rootPlaceId = presence.rootPlaceId;
    const isMultiPlayerSession =
      rootPlaceId != null && sessionCounts[rootPlaceId] > 1;

    let bucketKey: string;
    let bucketId: number;
    let bucketIsGameGroup: boolean;

    if (isMultiPlayerSession && rootPlaceId != null) {
      // Ensure rootPlaceId is non-null
      bucketKey = `game-${rootPlaceId}`;
      bucketId = rootPlaceId; // rootPlaceId is confirmed non-null here
      bucketIsGameGroup = true;
    } else {
      // Fallback to userPresenceType if not in a multiplayer session
      // or if rootPlaceId was null (though presence.userPresenceType should always exist if presence exists)
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
  // Ensure friends within each group are sorted consistently for stability
  // if their order doesn't matter semantically. The existing sorts are semantic.

  const gameGroups: FriendGroup[] = Object.values(buckets)
    .filter((group) => group.isGameGroup)
    .map((group) => ({
      ...group,
      // Optional: sort friends within game groups if order isn't semantic
      // and can change due to processing order.
      // friends: sortFriendsById(group.friends)
      // If the order they are added to buckets[bucketKey].friends is stable,
      // and allFriends is stable, this might not be needed.
      // However, explicit sort guarantees it. For now, let's assume
      // the order derived from allFriends is sufficient.
    }));

  const inGameFriends =
    buckets[`status-${PresenceTypes.IN_GAME}`]?.friends || [];
  const inGameGroup: FriendGroup = {
    id: PresenceTypes.IN_GAME,
    isGameGroup: false,
    friends: [...inGameFriends].sort((a, b) => {
      // Sort a copy
      const aPresence = presenceMap[a.userId];
      const bPresence = presenceMap[b.userId];
      const aHasPlace = aPresence?.rootPlaceId != null;
      const bHasPlace = bPresence?.rootPlaceId != null;
      // Sort by game name if available, then by place ID presence
      if (
        aHasPlace &&
        bHasPlace &&
        aPresence?.lastLocation &&
        bPresence?.lastLocation
      ) {
        const gameNameCompare = aPresence.lastLocation.localeCompare(
          bPresence.lastLocation,
        );
        if (gameNameCompare !== 0) return gameNameCompare;
      }
      return Number(bHasPlace) - Number(aHasPlace); // true (has place) first
    }),
  };

  const inStudioFriends =
    buckets[`status-${PresenceTypes.IN_STUDIO}`]?.friends || [];
  const inStudioGroup: FriendGroup = {
    id: PresenceTypes.IN_STUDIO,
    isGameGroup: false,
    friends: [...inStudioFriends].sort((a, b) => {
      // Sort a copy
      const aPresence = presenceMap[a.userId];
      const bPresence = presenceMap[b.userId];
      const aHasPlace = aPresence?.rootPlaceId != null;
      const bHasPlace = bPresence?.rootPlaceId != null;
      // Sort by game/place name if available, then by place ID presence
      if (
        aHasPlace &&
        bHasPlace &&
        aPresence?.lastLocation &&
        bPresence?.lastLocation
      ) {
        const gameNameCompare = aPresence.lastLocation.localeCompare(
          bPresence.lastLocation,
        );
        if (gameNameCompare !== 0) return gameNameCompare;
      }
      return Number(bHasPlace) - Number(aHasPlace); // true (has place) first
    }),
  };

  const offlineFriends =
    buckets[`status-${PresenceTypes.OFFLINE}`]?.friends || [];
  const offlineGroup: FriendGroup = {
    id: PresenceTypes.OFFLINE,
    isGameGroup: false,
    // Sorting offline friends by last online timestamp
    friends: [...offlineFriends].sort((a, b) => {
      // Sort a copy
      const aLastOnline =
        presenceMap[a.userId]?.lastOnline ?? Number.MIN_SAFE_INTEGER; // Use MIN_SAFE_INTEGER for very old
      const bLastOnline =
        presenceMap[b.userId]?.lastOnline ?? Number.MIN_SAFE_INTEGER;
      return bLastOnline - aLastOnline; // Most recent first
    }),
  };

  // 4) Return in desired order
  const result = [...gameGroups, inGameGroup, inStudioGroup, offlineGroup];

  // Optional: Sort gameGroups themselves by some stable criteria if their order can change
  // e.g., by game name or ID.
  // gameGroups.sort((a,b) => a.id - b.id); // if id is a gameId and numeric
  // or by name if you add a name property to FriendGroup for games.

  return result;
}, isEqual); // Use the deep equality check here
