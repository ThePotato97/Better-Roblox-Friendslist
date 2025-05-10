import { atom } from "jotai";
import { friendsAtom, presenceAtom } from ".";

import { Friend } from "../database/FriendsDB";

export interface FriendGroup {
  id: number;
  isGameGroup: boolean;
  friends: Friend[];
}

export const groupsAtom = atom<FriendGroup[]>(get => {
  const friendsMap = get(friendsAtom);
  const presenceMap = get(presenceAtom);
  const allFriends = Object.values(friendsMap);
  const rootPlaceIds = allFriends.map(f => presenceMap[f.userId]?.rootPlaceId);
  const duplicates = rootPlaceIds.filter((id,i)=> id!=null && rootPlaceIds.indexOf(id)!==i);

  const buckets: Record<string, FriendGroup> = {};

  for (const friend of allFriends.sort((a,b)=>a.username.localeCompare(b.username))) {
    const pres = presenceMap[friend.userId];
    if (!pres) continue;
    const key = duplicates.includes(pres.rootPlaceId)
      ? `game-${pres.rootPlaceId}`
      : `status-${pres.userPresenceType}`;

    if (!buckets[key]) {
      buckets[key] = {
        id: duplicates.includes(pres.rootPlaceId) ? pres.rootPlaceId! : pres.userPresenceType,
        isGameGroup: duplicates.includes(pres.rootPlaceId),
        friends: [],
      };
    }
    buckets[key].friends.push(friend);
  }

  return Object.values(buckets).sort((a,b)=> {
    // your priority logic here...
    return 0;
  });
});
