import OpenPorts from "./OpenPorts";
import { multiGetPlaceDetails } from "../controllers/fetchPlaceDetails";
import fetchPresence from "../controllers/fetchPresence";
import { fetchThumbnails, getRequestId } from "../controllers/fetchThumbnails";
import fetchServerDetails from "../controllers/fetchServerDetails";
import { fetchFriends } from "../controllers/fetchFriends";

const newRule = [
  {
    id: 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          header: "user-agent",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: "Roblox/WinInet",
        },
      ],
    },
    condition: {
      urlFilter: "https://gamejoin.roblox.com/*",
    },
  },
];

chrome.declarativeNetRequest.getDynamicRules((rules) => {
  const ruleIds = new Set(); // Create a set to store unique IDs

  const uniqueRules = rules.filter((rule) => {
    if (ruleIds.has(rule.id)) {
      return false; // This rule ID is already in use, so don't keep it
    } else {
      ruleIds.add(rule.id); // Add the ID to the set to track it
      return true; // This rule ID is unique, so keep it
    }
  });

  console.log(`Removed ${rules.length - uniqueRules.length} duplicate rules`);

  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: rules.map((rule) => rule.id), // Remove all existing rules
      addRules: newRule, // Add the updated rule
    },
    () => {
      console.log("Rule with ID 1 has been updated");
    }
  );
});

const getFriendInfo = async (userId: number) => {
  const friends = await fetchFriends(userId);
  if (friends?.length === 0) {
    return Promise.resolve({
      placeDetails: null,
      presence: null,
      friends: null,
      serverDetails: null,
    });
  }
  const presence = await fetchPresence(
    friends.map((user) => {
      return user.id;
    }),
    userId
  );
  const presenceLookup = presence.reduce((acc, p) => {
    acc[p.userId] = p;
    return acc;
  }, {} as { [key: number]: (typeof presence)[0] });

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
  const ingamePlayers = presence.filter((p) => {
    return !!p.placeId;
  });
  const servers = ingamePlayers.reduce((acc, p) => {
    acc[p.gameId] = p.placeId;
    return acc;
  }, {} as Record<string, number>);
  const serversTest = Object.entries(servers).map(([gameId, placeId]) => ({
    gameId,
    placeId,
  }));
  const serverDetails = await fetchServerDetails(serversTest);
  console.log("serverDetails", serverDetails);
  const friendIcons = await fetchThumbnails(
    friends.map((friend) => friend.id),
    "AvatarHeadShot",
    "150x150"
  );
  const placeFilteredInfo = [...places].map((place) => {
    const placeDetail = placeDetails.get(place);
    const placeIcon = placeIcons.get(getRequestId(place, "PlaceIcon", "150x150"));
    const thumbnail = gameThumbnails.get(getRequestId(place, "GameThumbnail", "768x432"));
    return {
      ...placeDetail,
      placeId: place,
      icon: placeIcon,
      thumbnail,
    };
  });
  const placeLookup = placeFilteredInfo.reduce((acc, item) => {
    acc[item.placeId] = item;
    return acc;
  }, {} as Record<number, (typeof placeFilteredInfo)[0]>);

  const friendInfo = friends.map((friend) => {
    const friendIcon = friendIcons.get(getRequestId(friend.id, "AvatarHeadShot", "150x150"));
    return {
      ...friend,
      avatar: friendIcon,
    };
  });

  const serverInfoLookup = serverDetails.reduce((acc, item) => {
    acc[item.gameId] = item.serverDetails;
    return acc;
  }, {} as Record<string, (typeof serverDetails)[0]["serverDetails"]>);

  return {
    serverDetails: serverInfoLookup,
    placeDetails: placeLookup,
    presence: presenceLookup,
    friends: friendInfo,
  };
};

const openPorts = new OpenPorts();

// getFriendInfo().then((friends) => {
//   friendsList = friends;
//   openPorts.messageAll(friends);
// });

export type FriendInfo = Awaited<ReturnType<typeof getFriendInfo>>;

const portToUserId = new Map<chrome.runtime.Port, number>();
const userIdToFriends = new Map<number, FriendInfo>();
const userIdToLastRefresh = new Map<number, number>();

setInterval(async () => {
  const ports = openPorts.getPorts();
  if (!ports || Object.keys(ports).length === 0) return;
  for (const port of Object.values(ports)) {
    const userId = portToUserId.get(port);
    if (!userId) {
      continue;
    }
    const friendInfo = await getFriendInfo(userId);
    portToUserId.set(port, userId);
    userIdToFriends.set(userId, friendInfo);
    userIdToLastRefresh.set(userId, Date.now());
    console.log("refreshed friends", friendInfo);
    port.postMessage(friendInfo);
  }
}, 2000);

chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === "update");
  port.onMessage.addListener((msg: { message: string; userId: number }) => {
    portToUserId.set(port, msg.userId);
    getFriendInfo(msg.userId).then((friends) => {
      port.postMessage(friends);
    });
  });
  openPorts.add(port);
});

