import { fetchApi } from "rozod";

import { getV1usersUserIdfriends } from "rozod/lib/endpoints/friendsv1";
import OpenPorts from "./OpenPorts";
import { multiGetPlaceDetails } from "../controllers/multiGetPlaceDetails";
import getPresence from "../controllers/getPresence";
import { fetchThumbnails, getRequestId } from "pages/controllers/getThumbnails";

let friendsList: any = null;

const getFriends = async (id: number) => {
  const friends = await fetchApi(getV1usersUserIdfriends, {
    userId: id,
  });
  return friends.data;
};

const getFriendInfo = async (userId: number) => {
  const friends = await getFriends(userId);
  if (friends?.length === 0) {
    return Promise.resolve([]);
  }
  const presence = await getPresence(
    friends.map((user) => {
      return user.id;
    })
  );
  const places: Set<number> = presence.reduce((acc, friend) => {
    if (friend.placeId) {
      acc.add(friend.placeId);
    }
    if (friend.rootPlaceId) {
      acc.add(friend.rootPlaceId);
    }
    return acc;
  }, new Set<number>());

  const placeDetails = await multiGetPlaceDetails([...places]);
  const placeIcons = await fetchThumbnails([...places], "PlaceIcon", "150x150");
  const gameThumbnails = await fetchThumbnails([...places], "GameThumbnail", "768x432");

  const friendIcons = await fetchThumbnails(
    friends.map((friend) => friend.id),
    "AvatarHeadShot",
    "150x150"
  );
  const placeInfo = [...places].map((place) => {
    const placeDetail = placeDetails.get(place);
    const placeIcon = placeIcons.get(getRequestId(place, "PlaceIcon", "150x150"));
    const gameThumbnail = gameThumbnails.get(getRequestId(place, "GameThumbnail", "768x432"));
    return {
      ...placeDetail,
      placeId: place,
      icon: placeIcon,
      gameThumbnail,
    };
  });
  const friendInfo = friends.map((friend) => {
    const friendIcon = friendIcons.get(getRequestId(friend.id, "AvatarHeadShot", "150x150"));
    return {
      ...friend,
      avatar: friendIcon,
    };
  });
  return {
    placeDetails: placeInfo,
    presence,
    friends: friendInfo,
  };
};

const openPorts = new OpenPorts();

// getFriendInfo().then((friends) => {
//   friendsList = friends;
//   openPorts.messageAll(friends);
// });

setInterval(() => {
  const ports = openPorts.getPorts();
  if (!ports || Object.keys(ports).length === 0) return;
  getFriendInfo().then((friends) => {
    friendsList = friends;
    openPorts.messageAll(friends);
  });
}, 10000);

chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === "update");
  port.onMessage.addListener((id: number) => {
    port.postMessage(friendsList);
  });
  openPorts.add(port);
});
