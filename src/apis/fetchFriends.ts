import { fetchApi } from "rozod";
import { getUsersUseridFriends } from "rozod/lib/endpoints/friendsv1";
import { CachedValue } from "webext-storage-cache";

import { z } from "zod";

export type getUsersUseridFriendsResponse = z.infer<(typeof getUsersUseridFriends)["response"]>;

const API_NAME = "gUUF";

export const fetchFriends = async (userId: number) => {
  const uniqueName = `${API_NAME}-${userId}`;
  const idCache = new CachedValue(uniqueName, { maxAge: { days: 2 } });
  const cachedFriends = (await idCache.get()) as getUsersUseridFriendsResponse["data"] | undefined;
  if (cachedFriends) {
    return cachedFriends;
  }
  const response = await fetchApi(getUsersUseridFriends, {
    userId,
  });
  const { data: friends } = response;

  await idCache.set(friends);
  return friends;
};
