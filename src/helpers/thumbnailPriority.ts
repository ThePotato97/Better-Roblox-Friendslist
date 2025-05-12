import { getDefaultStore } from "jotai";
import { ThumbnailType } from "../apis";
import {
  FriendsDB,
  PresenceType,
  getThumbnailRequestId,
} from "../database/FriendsDB";
import { thumbnailsAtom } from "../atoms";

const defaultStore = getDefaultStore();

export const getThumbnailsToLoad = async () => {
  const db = await FriendsDB();
  const existing = defaultStore.get(thumbnailsAtom);

  const hasThumb = new Set(Object.keys(existing));

  const tx = db.transaction("presences", "readonly");
  const store = tx.objectStore("presences");
  const byStatus = store.index("by-status");

  const fetchByStatus = async (status: PresenceType) =>
    await byStatus.getAll(status);

  const generateStructured = (
    ids: number[],
    thumbnailType: ThumbnailType,
    size: string,
  ): { id: number; thumbnailType: ThumbnailType; size: string }[] =>
    ids
      .filter((id) => id !== 0)
      .map((id) => ({ id, thumbnailType, size }))
      .filter(
        ({ id, thumbnailType, size }) =>
          !hasThumb.has(getThumbnailRequestId(id, thumbnailType, size)),
      );

  const result: { id: number; thumbnailType: ThumbnailType; size: string }[] =
    [];
  const push = (entries: typeof result) => {
    const remaining = 100 - result.length;
    if (remaining > 0) result.push(...entries.slice(0, remaining));
  };

  const inGame = await fetchByStatus(PresenceType.InGame);
  const inStudio = await fetchByStatus(PresenceType.InStudio);
  const online = await fetchByStatus(PresenceType.Online);
  const offline = await fetchByStatus(PresenceType.Offline);

  const allPresences = [...inGame, ...inStudio, ...online, ...offline];

  push(
    generateStructured(
      inGame.map((p) => p.userId).filter((id) => id !== null),
      "AvatarHeadShot",
      "150x150",
    ),
  );
  push(
    generateStructured(
      inGame.map((p) => p.rootPlaceId).filter((id) => id !== null),
      "PlaceIcon",
      "150x150",
    ),
  );

  push(
    generateStructured(
      inStudio.map((p) => p.userId),
      "AvatarHeadShot",
      "150x150",
    ),
  );
  push(
    generateStructured(
      inStudio.map((p) => p.rootPlaceId).filter((id) => id !== null),
      "PlaceIcon",
      "150x150",
    ),
  );

  push(
    generateStructured(
      online.map((p) => p.userId),
      "AvatarHeadShot",
      "150x150",
    ),
  );

  push(
    generateStructured(
      allPresences.map((p) => p.placeId).filter((id) => id !== null),
      "GameThumbnail",
      "768x432",
    ),
  );

  push(
    generateStructured(
      offline.map((p) => p.userId),
      "AvatarHeadShot",
      "150x150",
    ),
  );

  return result;
};
