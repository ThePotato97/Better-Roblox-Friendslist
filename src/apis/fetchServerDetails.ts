import { JoinResultReason } from "../global.ts";
import { ExtractResponse, fetchApi } from "rozod";
import cache from "webext-storage-cache/legacy.js";
import { postJoinGameInstance } from "rozod/lib/endpoints/gamejoinv1";
import { z } from "zod";

interface fetchServerDetailsInput {
  placeId: number;
  gameId: string;
}

export type fetchServerDetailsResponse = ExtractResponse<
  typeof postJoinGameInstance
>;

//const serverDetailsCache: Record<string, fetchServerDetailsResponse> = {};

const API_NAME = "fSD";

const uniqueNameGenerator = (id: string) => `${API_NAME}-${id}`;

export const fetchServerDetails = async (placeId: number, gameId: string) => {
  const uniqueId = uniqueNameGenerator(gameId);
  const inCache = await cache.has(uniqueId);
  const serverDetailsResponse = inCache
    ? ((await cache.get(uniqueId)) as fetchServerDetailsResponse)
    : await fetchApi(postJoinGameInstance, {
        body: {
          placeId: placeId,
          gameJoinAttemptId: gameId,
          gamerTag: "",
          cId: "",
          isPlayTogetherGame: false,
          isImmersiveAdsTeleport: false,
          browserTrackerId: 0,
          isTeleport: false,
          isQueueAllowedOverride: false,
          partyId: "",
          joinOrigin: "",
          channelName: "",
          gameId: gameId,
        },
      });
  const { status } = serverDetailsResponse;
  if (
    status === JoinResultReason.OK ||
    status === JoinResultReason.UNAUTHORIZED_OTHER
  ) {
    await cache.set(uniqueId, serverDetailsResponse, {
      minutes: 5,
    });
  }
  return serverDetailsResponse;
};
