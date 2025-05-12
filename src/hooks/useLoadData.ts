import { useAtomValue } from "jotai";
import {
  fetchFriends,
  fetchPlaceDetails,
  fetchPresence,
  fetchThumbnailsStructured,
} from "../apis";

import {
  friendIdsSelector,
  getMissingPlacesDetails,
  updateProfilesBatch,
  getMissingPresence,
  presencePlaceIdsAtom,
  updateFriendsBatch,
  updatePlacesBatch,
  updatePresenceBatch,
  updateThumbnailsBatch,
} from "../atoms";

import { getThumbnailsToLoad } from "../helpers/thumbnailPriority";
import { getProfilesToLoad } from "../helpers/profilePriority";
import { fetchProfiles } from "../apis/fetchProfiles";
import { fetchUserInfo } from "../apis/fetchCurrentUserInfo";

export const useLoadData = () => {
  // 1) initial + polling for friends
  useEffect(() => {
    async function reload() {
      const userInfo = await fetchUserInfo();
      console.log("fetching friends");
      await fetchFriends(userInfo.id, (friends) => {
        updateFriendsBatch(friends);
      });
    }
    reload();
    const handle = setInterval(reload, 20 * 1000);
    return () => clearInterval(handle);
  }, []);

  // 2) initial + polling for thumbnails

  useEffect(() => {
    const loadThumbnails = async () => {
      const toLoad = await getThumbnailsToLoad();
      if (toLoad.length === 0) return;
      const thumbnails = await fetchThumbnailsStructured(toLoad);
      updateThumbnailsBatch(thumbnails);
    };
    loadThumbnails();
    const handle = setInterval(loadThumbnails, 2 * 1000);
    return () => clearInterval(handle);
  }, []);

  const userIds = useAtomValue(friendIdsSelector);

  // fetch profiles
  useEffect(() => {
    const updateProfiles = async () => {
      const toLoad = await getProfilesToLoad();
      console.log("profiles to load", toLoad);
      if (toLoad.length === 0) return;
      const profiles = await fetchProfiles(toLoad);
      updateProfilesBatch(profiles);
    };
    updateProfiles();
    const handle = setInterval(updateProfiles, 2 * 1000);
    return () => clearInterval(handle);
  }, []);

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
    updatePresence(); // initial
    const handle = setInterval(updatePresence, 2 * 1000);
    return () => clearInterval(handle);
  }, [userIds]);

  const presencePlaceIds = useAtomValue(presencePlaceIdsAtom);

  // fetch place details
  useEffect(() => {
    const updatePlaces = async () => {
      const places = getMissingPlacesDetails(presencePlaceIds);

      if (places.length > 0) {
        const placeDetails = await fetchPlaceDetails(places);
        updatePlacesBatch(placeDetails);

        const rootPlaceIds = placeDetails.map((p) => p.universeRootPlaceId);
        const missingRootPlaces = getMissingPlacesDetails(rootPlaceIds);
        if (missingRootPlaces.length > 0) {
          const rootPlaceDetails = await fetchPlaceDetails(missingRootPlaces);
          updatePlacesBatch(rootPlaceDetails);
        }
      }
    };
    updatePlaces();
  }, [presencePlaceIds]);

  return {};
};
