import { JoinStatusCodes } from "../pages/global";
import { fetchApi } from "rozod";
import cache from "webext-storage-cache";
import { postJoinGameInstance } from "rozod/lib/endpoints/gamejoinv1";
import { z } from "zod";

interface fetchServerDetailsInput { placeId: number; gameId: string }

type fetchServerDetailsResponse = z.infer<(typeof postJoinGameInstance)["response"]>;

//const serverDetailsCache: Record<string, fetchServerDetailsResponse> = {};

const API_NAME = "fSD";

const uniqueNameGenerator = (id: string) => `${API_NAME}-${id}`;

export default async function fetchServerDetails(gameIds: fetchServerDetailsInput[]) {
  const serverDetails = await Promise.all(
    gameIds.map(async (gameDetails) => {
      const { placeId, gameId } = gameDetails;
      const uniqueId = uniqueNameGenerator(gameId);
      const inCache = await cache.has(uniqueId);
      const serverDetailsResponse = inCache ?
        await cache.get(uniqueId) as fetchServerDetailsResponse :
        (await fetchApi(postJoinGameInstance, {
          body: {
            placeId: placeId,
            gameJoinAttemptId: gameId,
            gamerTag: "",
            isPartyLeader: false,
            isPlayTogetherGame: false,
            browserTrackerId: 0,
            isTeleport: false,
            channelName: "",
            gameId: gameId,
          },
        }));
      const { status } = serverDetailsResponse;
      if (
        status === JoinStatusCodes.OK ||
        status === JoinStatusCodes.SERVER_FULL ||
        status === JoinStatusCodes.UNAUTHORIZED
      ) {
        await cache.set(uniqueId, serverDetailsResponse, {
          minutes: 5,
        });
      }
      return { serverDetails: serverDetailsResponse, gameId: gameId };
    })
  );
  return serverDetails;
}

