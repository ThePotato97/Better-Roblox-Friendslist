import { ExtractResponse, fetchApiSplit } from "rozod";
import { getGamesMultigetPlaceDetails } from "rozod/lib/endpoints/gamesv1";
import cache from "webext-storage-cache/legacy.js";
import { z } from "zod";
import { batchHasFilterCache, batchSetCache } from "./batchCache";

export type gameMultiGetResponse = ExtractResponse<
	typeof getGamesMultigetPlaceDetails
>;

export const fetchPlaceDetails = async (
	ids: number[],
): Promise<gameMultiGetResponse> => {
	const responses = await fetchApiSplit(
		getGamesMultigetPlaceDetails,
		{ placeIds: ids },
		{ placeIds: 60 },
	);

	const responseFlat = responses.flat();

	return responseFlat;
};
