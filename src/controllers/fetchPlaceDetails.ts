import { fetchApiSplit } from "rozod";
import { getGamesMultigetPlaceDetails } from "rozod/lib/endpoints/gamesv1";
import cache from 'webext-storage-cache';
import { z } from "zod";

type gameMultiGetResponse = z.infer<(typeof getGamesMultigetPlaceDetails)["response"]>;


const API_NAME = "gGMPD";

const unqiueNameGenerator = (id: number) => `${API_NAME}-${id}`;

export const multiGetPlaceDetails = async (ids: number[]): Promise<gameMultiGetResponse> => {
  const idsToResolve = ids.filter(async (id) => await cache.has(unqiueNameGenerator(id)));


  const responses = idsToResolve.length > 0 ? await fetchApiSplit(getGamesMultigetPlaceDetails, { placeIds: idsToResolve }, { placeIds: 60 }) : [];
  
  const resolved: gameMultiGetResponse = []

  responses.flat().forEach(async (response) => {
    const { placeId } = response;
    await cache.set(unqiueNameGenerator(placeId), response, {
      minutes: 5,
    });
    resolved.push(response);
  });

  const cachedIds = ids.filter((id) => !idsToResolve.includes(id));
  cachedIds.forEach(async (id) => {
    const cached = await cache.get(unqiueNameGenerator(id)) as gameMultiGetResponse[0];
    resolved.push(cached);
  });

  return resolved;
};

