import { fetchApiSplit } from "rozod";
import { getGamesMultigetPlaceDetails } from "rozod/lib/endpoints/gamesv1";
import { z } from "zod";

type gameMultiGetResponse = z.infer<(typeof getGamesMultigetPlaceDetails)["response"]>;

const placeDetailsCache = new Map<number, gameMultiGetResponse[0]>();

export const multiGetPlaceDetails = async (ids: number[]): Promise<typeof placeDetailsCache> => {
  const newIds = ids.filter((id) => !placeDetailsCache.has(id));
  if (newIds.length === 0) return placeDetailsCache;
  const responses = await fetchApiSplit(getGamesMultigetPlaceDetails, { placeIds: newIds }, { placeIds: 60 });
  responses.flat().forEach((response) => {
    const { placeId } = response;
    placeDetailsCache.set(placeId, response);
  });
  return placeDetailsCache;
};

