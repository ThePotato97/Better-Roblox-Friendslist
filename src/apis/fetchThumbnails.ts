import { ExtractParams, fetchApiSplit } from "rozod";
import cache from "webext-storage-cache/legacy.js";
import { postBatch as thumbnailsBatch } from "rozod/lib/endpoints/thumbnailsv1";
import { z } from "zod";
import {
	batchGetCache,
	batchHasFilterCache,
	batchSetCache,
} from "./batchCache";
import { getThumbnailRequestId, Thumbnail } from "../database/FriendsDB";

type thumbnailsResponse = ExtractParams<typeof thumbnailsBatch>;

export type ThumbnailType = NonNullable<
	thumbnailsResponse["body"]
>[number]["type"];

//const thumbnailsCache = new Map<string, string>();

export const fetchThumbnails = async function (
	ids: number[],
	thumbnailType: ThumbnailType,
	size: string,
): Promise<Omit<Thumbnail, "lastUpdated">[]> {
	console.log("fetching", ids, thumbnailType, size);
	const response = await fetchApiSplit(
		thumbnailsBatch,
		{
			body: ids.map((id) => ({
				format: "png",
				requestId: getThumbnailRequestId(id, thumbnailType, size),
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
	const thumbnails = response.flatMap((response) => response.data);
	const formattedThumbnails = thumbnails.map((thumbnail) => {
		const { requestId } = thumbnail;
		const [id, type, size] = requestId.split(":");
		const typeCasted = type as ThumbnailType;
		const requestIdCasted = getThumbnailRequestId(Number(id), typeCasted, size);
		return {
			requestId: requestIdCasted,
			type: typeCasted,
			imageUrl: thumbnail.imageUrl,
		};
	});
	return formattedThumbnails;
};
function getRequestId(id: number, thumbnailType: string, size: string): any {
	throw new Error("Function not implemented.");
}
