import { fetchApi, fetchApiSplit, fetchApiPages, fetchApiPagesGenerator } from "rozod";
import { postPresenceUsers, postPresenceLastOnline } from "rozod/lib/endpoints/presencev1";
import { z } from "zod";

const PRESENCE_UPDATE_INTERVAL = 10 * 1000;

type UserPresence = {
  userId: number;
  placeId: number;
  universeId: number;
  rootPlaceId: number;
  userPresenceType: 0 | 2 | 1 | 3 | 4;
  lastLocation: string;
  lastOnline: string;
  gameId: string;
};

const presenceCache: Record<number, UserPresence[]> = {};
const lastUpdatedCache: Record<number, number> = {};

export default async function fetchPresence(friends: number[], userId: number) {
  if (presenceCache[userId] && Date.now() - lastUpdatedCache[userId] < PRESENCE_UPDATE_INTERVAL) {
    return presenceCache[userId];
  }

  const presence = await fetchApi(postPresenceUsers, {
    body: { userIds: friends },
  });

  const lastOnline = await fetchApi(postPresenceLastOnline, {
    body: { userIds: friends },
  });

  const { lastOnlineTimestamps } = lastOnline;
  const { userPresences } = presence;

  const lastOnlineLookup = lastOnlineTimestamps.reduce((acc, user) => {
    acc[user.userId] = user.lastOnline;
    return acc;
  }, {} as Record<number, string>);

  const merged = userPresences.map((user) => {
    return { ...user, lastOnline: lastOnlineLookup[user.userId] };
  });

  lastUpdatedCache[userId] = Date.now();
  presenceCache[userId] = merged;
  return merged;
}

