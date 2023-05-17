import { fetchApi } from "rozod";
import { getUsersUseridFriends } from "rozod/lib/endpoints/friendsv1";
import { z } from "zod";

type getUsersUseridFriendsResponse = z.infer<(typeof getUsersUseridFriends)["response"]>;

const friendsListCache: Record<number, getUsersUseridFriendsResponse["data"]> = {};
const lastUpdatedCache: Record<number, number> = {};

export const fetchFriends = async (userId: number) => {
  if (friendsListCache[userId] && Date.now() - lastUpdatedCache[userId] < 1000 * 60) {
    return friendsListCache[userId];
  }
  const response = await fetchApi(getUsersUseridFriends, {
    userId,
  });
  const { data: friends } = response;
  friendsListCache[userId] = friends;
  lastUpdatedCache[userId] = Date.now();
  return friends;
};
