import { getDefaultStore } from "jotai";
import { ThumbnailType } from "../apis";
import {
  FriendsDB,
  Presence,
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

  const priorityList = [
    {
      type: "AvatarHeadShot",
      size: "48x48",
      ids: inGame,
    },
    {
      type: "PlaceIcon",
      size: "50x50",
      ids: inGame,
    },
    {
      type: "AvatarHeadShot",
      size: "48x48",
      ids: inStudio,
    },
    {
      type: "PlaceIcon",
      size: "50x50",
      ids: inStudio,
    },
    {
      type: "AvatarHeadShot",
      size: "150x150",
      ids: online,
    },
    {
      type: "GameThumbnail",
      size: "768x432",
      ids: allPresences,
    },
    {
      type: "PlaceIcon",
      size: "150x150",
      ids: allPresences,
    },
    {
      type: "AvatarHeadShot",
      size: "48x48",
      ids: offline,
    },
  ] satisfies Array<{
    type: ThumbnailType;
    size: string;
    ids: Presence[];
  }>;

  for (const { type, size, ids } of priorityList) {
    if (type === "AvatarHeadShot") {
      push(
        generateStructured(
          ids.map((p) => p.userId).filter(Boolean),
          type,
          size,
        ),
      );
    } else if (type === "PlaceIcon" || type === "GameThumbnail") {
      push(
        generateStructured(
          ids.map((p) => p.rootPlaceId).filter(Boolean),
          type,
          size,
        ),
      );
    }
  }

  return result;
};
