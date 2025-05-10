import { fetchApiSplit } from "rozod";
import cache from "webext-storage-cache/legacy.js";
import { postBatch as thumbnailsBatch } from "rozod/lib/endpoints/thumbnailsv1";
import { z } from "zod";
import {
	batchGetCache,
	batchHasFilterCache,
	batchSetCache,
} from "./batchCache";

type ThumbnailType = z.infer<
	(typeof thumbnailsBatch)["parameters"]["body"]
>[0]["type"];

//const thumbnailsCache = new Map<string, string>();

export const getRequestId = (
	id: number,
	thumbnailType: ThumbnailType,
	size: string,
) => {
	return `${id}:${thumbnailType}:${size}:png:regular`;
};

export const fetchThumbnails = async function (
	ids: number[],
	thumbnailType: ThumbnailType,
	size: string,
): Promise<Record<string, string>> {
	const getId = (id: number) => getRequestId(id, thumbnailType, size);
	const idsToResolve = await batchHasFilterCache(ids, getId);

	const cachedIds = ids.filter((id) => !idsToResolve.includes(id));

	const thumbnails: Record<string, string> = {};
	for (const id of cachedIds) {
		const cached = (await cache.get(
			getRequestId(id, thumbnailType, size),
		)) as string;
		thumbnails[getRequestId(id, thumbnailType, size)] = cached;
	}
	if (idsToResolve.length > 0) {
		const response = await fetchApiSplit(
			thumbnailsBatch,
			{
				body: idsToResolve.map((id) => ({
					format: "png",
					requestId: getRequestId(id, thumbnailType, size),
					targetId: id,
					size: size,
					alias: "",
					token: "",
					type: thumbnailType,
					isCircular: false,
				})),
			},
			{ body: 60 },
		);

		const data = response.flatMap((response) => response.data);
		const ids = data.map((responseData) => responseData.requestId);
		const thumbnailData = data.map((responseData) => responseData.imageUrl);
		await batchSetCache(thumbnailData, ids, { minutes: 5 });
		data.forEach((responseData) => {
			const { requestId } = responseData;
			thumbnails[requestId] = responseData.imageUrl;
		});
	}
	return thumbnails;
};
