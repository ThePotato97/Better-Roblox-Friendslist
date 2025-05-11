import { ExtractResponse, fetchApi } from "rozod";
import { getUsersUseridFriendsFind } from "rozod/lib/endpoints/friendsv1";

type response = ExtractResponse<typeof getUsersUseridFriendsFind>;

export const fetchFriends = async (
  userId: number,
  onPage?: (batch: number[]) => void,
) => {
  let cursor: string | undefined = undefined;

  do {
    const request = {
      userId,
      limit: 50,
    } as {
      userId: number;
      limit: number;
      cursor?: string;
    };

    if (cursor) {
      request.cursor = cursor;
    }
    const response: response = await fetchApi(
      getUsersUseridFriendsFind,
      request,
    );
    const { PageItems: friends } = response;

    if (onPage) {
      onPage(friends.map((friend) => friend.id));
    }
    cursor = response.NextCursor;
  } while (cursor);
};
