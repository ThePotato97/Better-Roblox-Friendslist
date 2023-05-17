import { fetchApi, fetchApiSplit, fetchApiPages, fetchApiPagesGenerator } from "rozod";
import { getGamesPlaceidPrivateServers } from "rozod/lib/endpoints/gamesv1";
import { z } from "zod";

type getGamesPlaceidPrivateServersResponse = z.infer<(typeof getGamesPlaceidPrivateServers)["response"]>;

export default async function fetchPrivateServers(placeIds: number[]) {
  const privateServers = await Promise.all(
    placeIds.map(async (placeId) => {
      const privateServersResponses = await fetchApiPages(getGamesPlaceidPrivateServers, {
        placeId,
      });
      return { servers: privateServersResponses.map((res) => res.data).flat(), placeId: placeId };
    })
  );
  return privateServers.reduce((acc, { servers, placeId }) => {
    acc[placeId] = servers;
    return acc;
  }, {} as { [key: number]: getGamesPlaceidPrivateServersResponse["data"] });
}
