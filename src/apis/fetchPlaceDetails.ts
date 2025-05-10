import { fetchApiSplit } from "rozod";
import { getGamesMultigetPlaceDetails } from "rozod/lib/endpoints/gamesv1";
import cache from "webext-storage-cache/legacy.js";
import { z } from "zod";
import { batchHasFilterCache, batchSetCache } from "./batchCache";

export type gameMultiGetResponse = z.infer<
	(typeof getGamesMultigetPlaceDetails)["response"]
>;

const API_NAME = "gGMPD";

const uniqueNameGenerator = (id: number) => `${API_NAME}-${id}`;

export const multiGetPlaceDetails = async (
	ids: number[],
): Promise<Record<number, gameMultiGetResponse[0]>> => {
	const idsToResolve = await batchHasFilterCache(ids, uniqueNameGenerator);

	const responses =
		idsToResolve.length > 0
			? await fetchApiSplit(
					getGamesMultigetPlaceDetails,
					{ placeIds: idsToResolve },
					{ placeIds: 60 },
				)
			: [];

	const resolved: Record<number, gameMultiGetResponse[0]> = Object.create(null);

	const responseFlat = responses.flat();

	const cacheIds = responseFlat.map(({ placeId }) =>
		uniqueNameGenerator(placeId),
	);

	batchSetCache(responseFlat, cacheIds, { minutes: 5 });

	const cachedIds = ids.filter((id) => !idsToResolve.includes(id));
	const cachedData = await Promise.all(
		cachedIds.map(async (id) => {
			const cached = (await cache.get(
				uniqueNameGenerator(id),
			)) as gameMultiGetResponse[0];
			return { data: cached, placeId: id };
		}),
	);
	cachedData.forEach((cache) => {
		resolved[cache.placeId] = cache.data;
	});
	return resolved;
};
