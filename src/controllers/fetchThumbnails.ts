import { fetchApiSplit } from "rozod";
import cache from "webext-storage-cache";
import { postBatch as thumbnailsBatch } from "rozod/lib/endpoints/thumbnailsv1";
import { z } from "zod";

type ThumbnailType = z.infer<(typeof thumbnailsBatch)["parameters"]["body"]>[0]["type"];

//const thumbnailsCache = new Map<string, string>();

const API_NAME = "gT";

export const getRequestId = (id: number, thumbnailType: ThumbnailType, size: string) => {
  return `${API_NAME}${id}:${thumbnailType}:${size}:png:regular`;
};

export const fetchThumbnails = async function (
  ids: number[],
  thumbnailType: ThumbnailType,
  size: string
): Promise<Map<string, string>> {
  const newIds = ids.filter(async (id) => await cache.has(getRequestId(id, thumbnailType, size)));
  const cachedIds = ids.filter((id) => !newIds.includes(id));

  const thumbnails: Map<string, string> = new Map();
  cachedIds.forEach(async (id) => {
    const cached = await cache.get(getRequestId(id, thumbnailType, size)) as string;
    thumbnails.set(getRequestId(id, thumbnailType, size), cached);
  });
  if (newIds.length > 0) {
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
      cache.set(requestId, responseData.requestId, {
        minutes: 5,
      });
    });
  }
  return thumbnails;
};

