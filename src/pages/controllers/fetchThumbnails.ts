import { fetchApiSplit } from "rozod";
import { postBatch as thumbnailsBatch } from "rozod/lib/endpoints/thumbnailsv1";
import { z } from "zod";

type ThumbnailType = z.infer<(typeof thumbnailsBatch)["parameters"]["body"]>[0]["type"];

const thumbnailsCache = new Map<string, string>();

export const getRequestId = (id: number, thumbnailType: ThumbnailType, size: string) => {
  return `${id}:${thumbnailType}:${size}:png:regular`;
};

export const fetchThumbnails = async function (
  ids: number[],
  thumbnailType: ThumbnailType,
  size: string
): Promise<typeof thumbnailsCache> {
  const newIds = ids.filter((id) => !thumbnailsCache.has(getRequestId(id, thumbnailType, size)));
  if (newIds.length === 0) return thumbnailsCache;
  const response = await fetchApiSplit(
    thumbnailsBatch,
    {
      body: newIds.map((id) => ({
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
    { body: 60 }
  );
  const data = response.map((response) => response.data).flat();
  data.forEach((responseData) => {
    const { requestId } = responseData;
    thumbnailsCache.set(requestId, responseData.imageUrl);
  });

  return thumbnailsCache;
};

