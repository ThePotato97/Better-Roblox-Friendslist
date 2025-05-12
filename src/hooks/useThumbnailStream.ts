import { fetchThumbnails, ThumbnailType } from "../apis";
import { getMissingThumbnails, updateThumbnailsBatch } from "../atoms";
import { Thumbnail } from "../database/FriendsDB";
import { InFlightBatcher } from "../helpers/InFlightBatcher";

export function useThumbnailStream(
  ids: number[],
  type: ThumbnailType,
  size: string,
) {
  const batcher = useMemo(
    () =>
      new InFlightBatcher<number, Omit<Thumbnail, "lastUpdated">>(
        async (keys) => fetchThumbnails(keys, type, size),
      ),
    [size, type],
  );

  useEffect(() => {
    const missing = getMissingThumbnails(ids, type, size);
    if (missing.length === 0) return;

    for (const id of missing) {
      batcher.fetch(id, (thumb) => {
        updateThumbnailsBatch([thumb]);
      });
    }
  }, [ids, type, size, batcher]);
}
