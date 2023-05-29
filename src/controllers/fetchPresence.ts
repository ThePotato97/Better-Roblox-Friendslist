import { fetchApi } from "rozod";
import { postPresenceUsers, postPresenceLastOnline } from "rozod/lib/endpoints/presencev1";
import { z } from "zod";
import cache from 'webext-storage-cache';

const PRESENCE_UPDATE_INTERVAL = 10;

interface UserPresence {
  userId: number;
  placeId: number;
  universeId: number;
  rootPlaceId: number;
  userPresenceType: 0 | 2 | 1 | 3 | 4;
  lastLocation: string;
  lastOnline: string;
  gameId: string;
}

const API_NAME = "pPU";

export default async function fetchPresence(friends: number[], userId: number) {
  const uniqueName = `${API_NAME}-${userId}`;

  if (await cache.has(uniqueName)) {
    return await cache.get(uniqueName) as UserPresence[];
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

  await cache.set(uniqueName, merged, {
    seconds: PRESENCE_UPDATE_INTERVAL,
  });
  return merged;
}
