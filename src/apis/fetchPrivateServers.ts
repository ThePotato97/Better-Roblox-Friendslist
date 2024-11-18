import { fetchApiPages } from "rozod";
import { getGamesPlaceidPrivateServers } from "rozod/lib/endpoints/gamesv1";
import cache from "webext-storage-cache";
import { z } from "zod";

type getGamesPlaceidPrivateServersResponse = z.infer<(typeof getGamesPlaceidPrivateServers)["response"]>;

const API_NAME = "gGPPS";

const unqiueNameGenerator = (id: number) => `${API_NAME}-${id}`;

interface privateServers {
  servers: getGamesPlaceidPrivateServersResponse["data"];
  placeId: number;
}

export default async function fetchPrivateServers(placeIds: number[]) {
  const privateServers = await Promise.all(
    placeIds.map(async (placeId) => {
      const unqiueId = unqiueNameGenerator(placeId);
      const inCache = await cache.has(unqiueId);
      if (!inCache) {
        const privateServersResponses = await fetchApiPages(getGamesPlaceidPrivateServers, {
          placeId,
        });
        const response = { servers: privateServersResponses.map((res) => res.data).flat(), placeId: placeId };
        await cache.set(unqiueId, response, {
          minutes: 5,
        });
        return response;
      } else {
        const cached = (await cache.get(unqiueId)) as privateServers;
        return { servers: cached.servers, placeId: cached.placeId };
      }
    })
  );
  return privateServers.reduce((acc, { servers, placeId }) => {
    acc[placeId] = servers;
    return acc;
  }, {} as { [key: number]: getGamesPlaceidPrivateServersResponse["data"] });
}
