import { fetchApi, fetchApiSplit, fetchApiPages, fetchApiPagesGenerator } from "rozod";
import { postV1presenceusers, postV1presencelastOnline } from "rozod/lib/endpoints/presencev1";

export default async function getPresence(friends: number[]) {
  const presence = await fetchApi(postV1presenceusers, {
    body: { userIds: friends },
  });
  const lastOnline = await fetchApi(postV1presencelastOnline, {
    body: { userIds: friends },
  });
  const { lastOnlineTimestamps } = lastOnline;
  const { userPresences } = presence;
  const lastOnlineLookup = lastOnlineTimestamps.reduce((acc, user) => {
    acc[user.userId] = user.lastOnline;
    return acc;
  }, {} as { [key: number]: string });
  const merged = userPresences.map((user) => {
    return { ...user, lastOnline: lastOnlineLookup[user.userId] };
  });
  return merged;
}
