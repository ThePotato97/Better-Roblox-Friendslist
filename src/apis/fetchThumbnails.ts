import { ExtractParams, fetchApiSplit } from "rozod";
import { postBatch as thumbnailsBatch } from "rozod/lib/endpoints/thumbnailsv1";
import { getThumbnailRequestId, Thumbnail } from "../database/FriendsDB";

type thumbnailsResponse = ExtractParams<typeof thumbnailsBatch>;

export type ThumbnailType = NonNullable<
	thumbnailsResponse["body"]
>[number]["type"];

export const fetchThumbnails = async function (
	ids: number[],
	thumbnailType: ThumbnailType,
	size: string,
): Promise<Map<number, Omit<Thumbnail, "lastUpdated">>> {
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

	const map = new Map<number, Omit<Thumbnail, "lastUpdated">>();

	for (const thumbnail of thumbnails) {
		const [idStr, typeStr, sizeStr] = thumbnail.requestId.split(":");
		const id = Number(idStr);
		map.set(id, {
			requestId: getThumbnailRequestId(id, typeStr as ThumbnailType, sizeStr),
			type: typeStr as ThumbnailType,
			imageUrl: thumbnail.imageUrl,
		});
	}

	return map;
};
