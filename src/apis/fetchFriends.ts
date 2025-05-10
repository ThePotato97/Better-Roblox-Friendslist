import { fetchApi } from "rozod";
import { getUsersUseridFriends } from "rozod/lib/endpoints/friendsv1";

export const fetchFriends = async (userId: number) => {
	const response = await fetchApi(getUsersUseridFriends, {
		userId,
	});
	const { data: friends } = response;

	return friends;
};
