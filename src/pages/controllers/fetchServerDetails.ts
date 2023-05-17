import { JoinStatusCodes } from "../global";
import { fetchApi } from "rozod";
import { postJoinGameInstance } from "rozod/lib/endpoints/gamejoinv1";
import { z } from "zod";

type fetchServerDetailsInput = { placeId: number; gameId: string };

type fetchServerDetailsResponse = z.infer<(typeof postJoinGameInstance)["response"]>;

const serverDetailsCache: Record<string, fetchServerDetailsResponse> = {};

export default async function fetchServerDetails(gameIds: fetchServerDetailsInput[]) {
  const serverDetails = await Promise.all(
    gameIds.map(async (gameDetails) => {
      const { placeId, gameId } = gameDetails;
      const serverDetailsResponse =
        serverDetailsCache[gameId] ||
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
        serverDetailsCache[gameId] = serverDetailsResponse;
      }
      return { serverDetails: serverDetailsResponse, gameId: gameId };
    })
  );
  return serverDetails;
}

