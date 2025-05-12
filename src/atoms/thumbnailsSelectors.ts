import { Atom, atom, getDefaultStore } from "jotai";
import { getThumbnailRequestId } from "../database/FriendsDB";
import { thumbnailsAtom } from "./thumbnailsAtom";
import { ThumbnailType } from "../apis";
import { selectAtom } from "jotai/utils";

import { placesPlaceIds } from "./placeSelectors";
import { friendIdsSelector } from "./friendsSelectors";

const store = getDefaultStore();

export const getMissingThumbnails = (
  ids: number[],
  type: ThumbnailType,
  size: string,
): number[] => {
  const thumbnails = store.get(thumbnailsAtom);

  return ids.filter((id) => {
    const thumb = thumbnails[getThumbnailRequestId(id, type, size)];

    return !thumb || (!thumb.imageUrl && !thumb.blocked);
  });
};

export function createThumbnailMissingSelector(
  idsAtom: Atom<number[]>,
  type: ThumbnailType,
  size: string,
) {
  return atom((get) => {
    const thumbnails = get(thumbnailsAtom);
    const ids = get(idsAtom);

    const missing: number[] = [];

    for (const id of ids) {
      const thumb = thumbnails[getThumbnailRequestId(id, type, size)];
      if (!thumb || (!thumb.imageUrl && !thumb.blocked)) {
        missing.push(id);
      }
    }

    return missing;
  });
}

export const createThumbnailSelector = (
  userId: number,
  type: ThumbnailType,
  size: string,
) =>
  selectAtom(
    thumbnailsAtom,
    (t) => t[getThumbnailRequestId(userId, type, size)],
  );

export const missingAvatarThumbnailsIdsSelector =
  createThumbnailMissingSelector(
    friendIdsSelector,
    "AvatarHeadShot",
    "150x150",
  );

export const missingGameThumbnailsIdsSelector = createThumbnailMissingSelector(
  placesPlaceIds,
  "GameThumbnail",
  "768x432",
);

export const missingPlaceIconThumbnailsIdsSelector =
  createThumbnailMissingSelector(placesPlaceIds, "PlaceIcon", "150x150");
