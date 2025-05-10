import { atom, getDefaultStore } from "jotai";
import { getThumbnailRequestId } from "../database/FriendsDB";
import { thumbnailsAtom } from "./thumbnailsAtom";
import { ThumbnailType } from "../apis";

const store = getDefaultStore();

export const getMissingThumbnails = (
	ids: number[],
	type: ThumbnailType,
	size: string,
): number[] => {
	const thumbnails = store.get(thumbnailsAtom);

	return ids.filter((id) => {
		const thumb = thumbnails[getThumbnailRequestId(id, type, size)];
		return !thumb || !thumb.imageUrl;
	});
};
