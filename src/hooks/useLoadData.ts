import { useAtomValue } from "jotai";
import {
  fetchFriends,
  fetchPlaceDetails,
  fetchPresence,
  fetchThumbnailsStructured,
} from "../apis";
import {
  updateFriendsBatch,
  updatePlacesBatch,
  updatePresenceBatch,
  updateThumbnailsBatch,
} from "../atoms";
import { friendIdsSelector } from "../atoms/friendsSelectors";
import {
  getMissingPresence,
  presencePlaceIdsAtom,
} from "../atoms/presenceSelector";
import { getMissingPlacesDetails } from "../atoms/placeSelectors";
import { getThumbnailsToLoad } from "../helpers/thumbnailPriority";

export const useLoadData = () => {
  // 1) initial + polling for friends
  useEffect(() => {
    async function reload() {
      //   const userInfo = await fetchUserInfo();
      console.log("fetching friends");
      await fetchFriends(109176680, (friends) => {
        updateFriendsBatch(friends);
      });
    }
    reload();
    const handle = setInterval(reload, 5 * 1000);
    return () => clearInterval(handle);
  }, []);

  // 2) initial + polling for thumbnails

  useEffect(() => {
    const loadThumbnails = async () => {
      const toLoad = await getThumbnailsToLoad();
      console.log("loading", toLoad);
      const thumbnails = await fetchThumbnailsStructured(toLoad);
      updateThumbnailsBatch(thumbnails);
    };
    loadThumbnails();
    const handle = setInterval(loadThumbnails, 2 * 1000);
    return () => clearInterval(handle);
  }, []);

  const userIds = useAtomValue(friendIdsSelector);

  // fetch presence
  useEffect(() => {
    const updatePresence = async () => {
      console.log("fetching presence");
      const missingPresence = getMissingPresence(userIds);
      if (missingPresence.length > 0) {
        fetchPresence(missingPresence, (newPresence) => {
          updatePresenceBatch(newPresence);
        });
      }
    };
    updatePresence();
  }, [userIds]);

  const presencePlaceIds = useAtomValue(presencePlaceIdsAtom);

  // fetch place details
  useEffect(() => {
    const updatePlaces = async () => {
      const places = getMissingPlacesDetails(presencePlaceIds);

      if (places.length > 0) {
        const placeDetails = await fetchPlaceDetails(places);
        updatePlacesBatch(placeDetails);
      }
    };
    updatePlaces();
  }, [presencePlaceIds]);

  return {};
};
