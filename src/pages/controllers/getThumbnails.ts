import { fetchApiSplit } from "rozod";
import { postV1batch as thumbnailsBatch } from "rozod/lib/endpoints/thumbnailsv1";
import { z } from "zod";

type thumbnailsBatchGetResponse = z.infer<(typeof thumbnailsBatch)["response"]>;

type ThumbnailType = z.infer<(typeof thumbnailsBatch)["parameters"]["body"]>[0]["type"];

const thumbnailsCache = new Map<string, thumbnailsBatchGetResponse>();

export const getRequestId = (id: number, thumbnailType: ThumbnailType, size: string) => {
  return `${id}:${thumbnailType}:${size}:png:regular`;
};

export const fetchThumbnails = async function (
  ids: number[],
  thumbnailType: ThumbnailType,
  size: string
): Promise<typeof thumbnailsCache> {
  const newIds = ids.filter((id) => !thumbnailsCache.has(getRequestId(id, thumbnailType, size)));
  const response = await fetchApiSplit(
    thumbnailsBatch,
    {
      body: newIds.map((id) => ({
        format: "png",
        requestId: getRequestId(id, thumbnailType, size),
        targetId: id,
        size: size,
        token: "",
        type: thumbnailType,
      })),
    },
    { body: 60 }
  );
  const data = response.map((response) => response.data).flat();
  data.forEach((responseData) => {
    // Check if the responseData object has an array of data
    if (Array.isArray(responseData)) {
      // Iterate through each data object in the array and cache it
      responseData.forEach((data) => {
        const { requestId } = data;
        thumbnailsCache.set(requestId, data);
      });
    }
  });

  return thumbnailsCache;
};
