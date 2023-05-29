import { fetchApi } from "rozod";
import { getUsersUseridFriends } from "rozod/lib/endpoints/friendsv1";
import cache from 'webext-storage-cache';

import { z } from "zod";

type getUsersUseridFriendsResponse = z.infer<(typeof getUsersUseridFriends)["response"]>;

const API_NAME = "gUUF";

export const fetchFriends = async (userId: number) => {
  const uniqueName = `${API_NAME}-${userId}`;
  if (await cache.has(uniqueName)) {
    const friends = await cache.get(uniqueName) as getUsersUseridFriendsResponse["data"];
    return friends
  }
  const response = await fetchApi(getUsersUseridFriends, {
    userId,
  });
  const { data: friends } = response;
  await cache.set(uniqueName, friends, {
			minutes: 1,
		});
  return friends;
};
