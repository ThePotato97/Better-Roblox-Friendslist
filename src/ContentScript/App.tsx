import React, { useState, useEffect, useMemo, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import { FriendsList, FriendsListItem, FriendsGroup } from "./Components/index.ts";
import { Collapse, Paper, Slide } from "@mui/material";
import extensionIcon from "../../icons/Icon48x.png";
import { FriendInfo } from "pages/Background";
import { JoinStatusCodes, PresenceTypes } from "../global";
import {
  fetchFriends,
  multiGetPlaceDetails,
  fetchThumbnails,
  getRequestId,
  fetchPresence,
  getUsersUseridFriendsResponse,
  gameMultiGetResponse,
} from "../apis/index.ts";
import { ThumbnailContext } from "./Context/Thumbnails.ts";

type friendItem = FriendInfo["friends"][0];

const sortFriendsAlphabet = (a: friendItem, b: friendItem) => {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
};

interface IGroup {
  name: string;
  placeId?: number;
  indexName: string;
  friends: friendItem[];
  isGroup?: boolean;
  gameGroups?: boolean;
  defaultGroupState: boolean;
  extraClasses: string;
  disableAvatarGameIcons?: boolean;
}

const getGroups = async (friendInfo: FriendInfo | undefined) => {
  if (!friendInfo) return [];
  const groupStates = {} || (await chrome.storage.local.get("groupStates"));
  const { presence, friends } = friendInfo;
  if (!friends || !presence) return [];
  const rootPlaceIds = friends.map((f) => presence[f.id].rootPlaceId);

  const duplicates = rootPlaceIds.filter((id, index) => rootPlaceIds.indexOf(id) !== index && id !== null);
  const sortedFriendsList = friends.sort(sortFriendsAlphabet);
  const newGroups: IGroup[] = [
    {
      name: "In Game",
      indexName: "ingame",
      friends: sortedFriendsList
        .filter((f) => {
          const userPresence = presence[f.id];
          return (
            userPresence.userPresenceType === PresenceTypes.IN_GAME && !duplicates.includes(userPresence.rootPlaceId)
          );
        })
        .sort((a: friendItem, b: friendItem) => {
          const { placeId: aPlace, gameId: aGameId } = presence[a.id] ?? {};
          const { placeId: bPlace, gameId: bGameId } = presence[b.id] ?? {};

          // const aServerDetails = serverDetails[aGameId];
          // const bServerDetails = 0
          // const aStatus = aServerDetails?.status;
          // const bStatus = bServerDetails?.status;

          const aIsJoinable = true || aStatus === JoinStatusCodes.OK || aStatus === JoinStatusCodes.SERVER_FULL;
          const bIsJoinable = true || bStatus === JoinStatusCodes.OK || bStatus === JoinStatusCodes.SERVER_FULL;

          if (aIsJoinable && !bIsJoinable) {
            return -1;
          } else if (!aIsJoinable && bIsJoinable) {
            return 1;
          } else if (aPlace && !bPlace) {
            return -1;
          } else if (!aPlace && bPlace) {
            return 1;
          } else {
            return 0;
          }
        }),
      defaultGroupState: groupStates.ingame ?? true,
      extraClasses: "gameGroup OtherGamesGroup",
    },
    {
      name: "In Studio",
      indexName: "studio",
      friends: sortedFriendsList.filter((f) => {
        const userPresence = presence[f.id];
        return userPresence.userPresenceType === PresenceTypes.IN_STUDIO;
      }),
      defaultGroupState: groupStates.studio ?? true,
      extraClasses: "gameGroup OtherGamesGroup",
    },
    {
      name: "Online",
      indexName: "online",
      friends: sortedFriendsList.filter((f) => {
        const userPresence = presence[f.id];
        return userPresence.userPresenceType === PresenceTypes.ONLINE;
      }),
      defaultGroupState: groupStates.online ?? true,
      extraClasses: "onlineFriends",
    },
    {
      name: "Offline",
      indexName: "offline",
      friends: sortedFriendsList
        .filter((f) => {
          const userPresence = presence[f.id];
          return userPresence.userPresenceType === PresenceTypes.OFFLINE;
        })
        .sort((a, b) => {
          const userPresenceA = presence[a.id];
          const userPresenceB = presence[b.id];
          const aDate = new Date(userPresenceA.lastOnline);
          const bDate = new Date(userPresenceB.lastOnline);
          return bDate.getTime() - aDate.getTime();
        }),
      defaultGroupState: groupStates.offline ?? true,
      extraClasses: "offlineFriends",
    },
  ];
  const groupedFriends = Object.entries(
    sortedFriendsList
      .filter((f) => {
        const userPresence = presence[f.id];
        return duplicates.includes(userPresence.rootPlaceId);
      })
      .reduce((acc, f) => {
        const userPresence = presence[f.id];
        acc[userPresence.rootPlaceId] = acc[userPresence.rootPlaceId] || [];
        acc[userPresence.rootPlaceId].push(f);
        return acc;
      }, {} as { [key: number]: Array<friendItem> })
  ).map(([placeId, group]) => {
    return {
      placeId: placeId,
      friends: group.sort((a, b) => {
        const userPresenceA = presence[a.id];
        const userPresenceB = presence[b.id];
        const aGameId = userPresenceA.gameId;
        const bGameId = userPresenceB.gameId;
        return aGameId === bGameId ? 0 : -1;
      }),
      gameGroups: !0,
      disableAvatarGameIcons: !0,
      defaultGroupState: !0,
      extraClasses: "gameGroup",
    };
  });
  newGroups.unshift(...groupedFriends);
  // let extraGroups = {};
  // if (friends) {
  //   // sort friends with joins off
  //   friends.sort((a, b) => {
  //     const aPlace = presence[a.id].placeId ?? 0;
  //     const bPlace = presence[b.id].placeId ?? 0;
  //     if (!aPlace && !bPlace) return 0;
  //     if (!aPlace) return 1;
  //     if (!bPlace) return -1;

  //     return 0;
  //   });

  //   let tempDuplicates = [];
  //   for (const [placeId, item] of Object.entries(duplicates)) item.length > 1 && tempDuplicates.push(placeId);

  //   tempDuplicates.forEach((id) => {
  //     const t = {
  //       placeId: id,
  //       friends: [],
  //       gameGroups: !0,
  //       disableAvatarGameIcons: !0,
  //       defaultGroupState: !0,
  //       extraClasses: "gameGroup",
  //     };
  //     extraGroups[id] = t;
  //   });
  //   friends.forEach((friend) => {
  //     const userPresence = presence[friend.id];
  //     const presenceType = status;
  //     const placeId = userPresence.rootPlaceId || userPresence.placeId;
  //     if (extraGroups[placeId]) {
  //       extraGroups[placeId].friends.push(friend);
  //     } else {
  //       tempGroups[presenceType].friends.push(friend);
  //     }
  //   });
  //   for (const [, value] of Object.entries(extraGroups)) {
  //     const duplicateGameIds = value.friends.reduce((frGroups, friend) => {
  //       const gameId = presence[friend.id].gameId;
  //       if (null === gameId) {
  //         return frGroups;
  //       }
  //       const group = frGroups[gameId] || [];
  //       group.push(friend);
  //       frGroups[gameId] = group;
  //       return frGroups;
  //     }, {});

  //     let tempFriends = [];
  //     for (const [, gameIdGroup] of Object.entries(duplicateGameIds)) {
  //       const length = gameIdGroup.length;
  //       if (length > 1) {
  //         gameIdGroup.forEach((gameIdGroup, index) => {
  //           {
  //             gameIdGroup.groupPosition
  //               = 0 === index ? "firstInGroup" : index === length - 1 ? "lastInGroup" : "inGroup";
  //             gameIdGroup.isInGroup = true;
  //           }
  //         });
  //       }
  //       tempFriends.push(...gameIdGroup.flat());
  //     }
  //     value.friends = tempFriends;
  //   }

  //   tempGroups.offline.friends.sort((a, b) => {
  //     const aDate = new Date(presence[a.id].lastOnline);
  //     const bDate = new Date(presence[b.id].lastOnline);
  //     return bDate - aDate;
  //   });

  //   const groupsMerged = Object.values(extraGroups).concat(Object.values(tempGroups));
  return newGroups;
};

type friendGroups = Awaited<ReturnType<typeof getGroups>>;

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
  const friendIcons = await fetchThumbnails(
    friends.map((friend) => friend.id),
    "AvatarHeadShot",
    "150x150"
  );

  const placeFilteredInfo = [...places].map((place) => {
    const placeDetail = placeDetails.get(place);
    // const placeIcon = placeIcons.get(getRequestId(place, "PlaceIcon", "150x150"));
    // const thumbnail = gameThumbnails.get(getRequestId(place, "GameThumbnail", "768x432"));
    return {
      ...placeDetail,
      placeId: place,
    };
  });
  const placeLookup = placeFilteredInfo.reduce((acc, item) => {
    acc[item.placeId] = item;
    return acc;
  }, {} as Record<number, (typeof placeFilteredInfo)[0]>);

  const friendInfo = friends.map((friend) => {
    // const friendIcon = friendIcons.get(getRequestId(friend.id, "AvatarHeadShot", "150x150"));
    return {
      ...friend,
    };
  });

  // const serverInfoLookup = serverDetails.reduce((acc, item) => {
  //   acc[item.gameId] = item.serverDetails;
  //   return acc;
  // }, {} as Record<string, (typeof serverDetails)[0]["serverDetails"]>);

  return {
    placeDetails: placeLookup,
    presence: presenceLookup,
    friends: friendInfo,
  };
};

const groupInfo: Record<number, { name: string; defaultGroupState: boolean; extraClasses: string; priority: number }> =
{
  [PresenceTypes.IN_GAME]: {
    name: "In Game",
    defaultGroupState: true,
    extraClasses: "gameGroup OtherGamesGroup",
    priority: 0,
  },
  [PresenceTypes.IN_STUDIO]: {
    name: "In Studio",
    defaultGroupState: true,
    extraClasses: "gameGroup OtherGamesGroup",
    priority: 2,
  },
  [PresenceTypes.ONLINE]: {
    name: "Online",
    defaultGroupState: true,
    extraClasses: "onlineFriends",
    priority: 4,
  },
  [PresenceTypes.OFFLINE]: {
    name: "Offline",
    defaultGroupState: false,
    extraClasses: "offlineFriends",
    priority: 5,
  },
  [PresenceTypes.INVISIBLE]: {
    name: "Invisible",
    defaultGroupState: false,
    extraClasses: "offlineFriends",
    priority: 99,
  },
};

const getPlaces = (presence: Exclude<FriendInfo["presence"], null>): Set<number> => {
  return Object.values(presence).reduce((acc, currPresence) => {
    if (currPresence.placeId) {
      acc.add(currPresence.placeId);
    }
    if (currPresence.rootPlaceId) {
      acc.add(currPresence.rootPlaceId);
    }
    return acc;
  }, new Set<number>());
};

interface FriendGroup {
  friends: Array<getUsersUseridFriendsResponse["data"][0]>;
  isGameGroup: boolean;
  id: number;
}

export const App = () => {
  // const [groups, setGroups] = useState<friendGroups>([]);
  const [presence, setPresence] = useState<Exclude<FriendInfo["presence"], null>>([]);

  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const [friends, setFriends] = useState<getUsersUseridFriendsResponse["data"]>([]);

  const [placeDetails, setPlaceDetails] = useState<Record<number, gameMultiGetResponse[0]>>([]);
  const [showFriendsList, setShowFriendsList] = useState<boolean>(
    JSON.parse(sessionStorage.getItem("showFriendsList") ?? "true")
  );
  const [showFriendsExtension, setShowFriendsExtension] = useState<boolean>(
    JSON.parse(sessionStorage.getItem("showFriendsExtension") ?? "true")
  );

  useEffect(() => {
    const getFriendsList = async () => {
      const userId = document.querySelector("meta[name='user-data']")?.getAttribute("data-userid");
      const userIdNum = Number(userId);
      if (!userId || isNaN(userIdNum)) return;
      const friends = await fetchFriends(userIdNum);
      const presence = await fetchPresence(
        friends.map((user) => user.id),
        userIdNum
      );
      setFriends(friends);
      setPresence(
        presence.reduce((acc, p) => {
          acc[p.userId] = p;
          return acc;
        }, {} as { [key: number]: (typeof presence)[0] })
      );
    };
    const interval = setInterval(() => {
      getFriendsList();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getPlaceDetails = async () => {
      if (!presence) return;
      const places: Set<number> = getPlaces(presence);
      const placeDetails = await multiGetPlaceDetails([...places]);

      setPlaceDetails(() => placeDetails);
    };
    getPlaceDetails();
  }, [presence]);

  useEffect(() => {
    const getThumbnails = async () => {
      let newThumbnails = {};
      const places = getPlaces(presence);
      if ([...places].length > 0) {
        const placeIcons = await fetchThumbnails([...places], "PlaceIcon", "150x150");
        newThumbnails = {
          ...newThumbnails,
          ...placeIcons,
        };

        setThumbnails((current) => ({
          ...current,
          ...placeIcons,
        }));
        const gameThumbnails = await fetchThumbnails([...places], "GameThumbnail", "768x432");
        newThumbnails = {
          ...newThumbnails,
          ...gameThumbnails,
        };
        setThumbnails((current) => ({
          ...current,
          ...gameThumbnails,
        }));
      }

      const friendIcons = await fetchThumbnails(
        friends.map((friend) => friend.id),
        "AvatarHeadShot",
        "150x150"
      );
      newThumbnails = {
        ...newThumbnails,
        ...friendIcons,
      };

      setThumbnails(newThumbnails);
    };
    getThumbnails();
  }, [presence, friends, placeDetails]);

  useEffect(() => {
    const friendsListElement = document.querySelector("#chat-container") as HTMLElement;
    if (friendsListElement) {
      friendsListElement.style.display = showFriendsExtension ? "none" : "block";
    }
  }, [showFriendsList]);

  // useEffect(() => {
  //   const getFriendsList = async () => {
  //     const userId = document.querySelector('meta[name=\'user-data\']')?.getAttribute('data-userid')
  //     if (!userId) {
  //       return;
  //     }
  //     const friendInfo = await getFriendInfo(userId);
  //     setPresence(friendInfo.presence);
  //     setPlaceDetails(friendInfo.placeDetails);
  //     setGroups(await getGroups(friendInfo));
  //   }
  //   const interval = setInterval(() => {
  //     console.log("Updated!");
  //     getFriendsList();
  //   }, 1000);
  //   return () => {
  //     clearInterval(interval);
  //   }
  // }, []);

  const handleToggleFriendsList = () => {
    setShowFriendsList(!showFriendsList);
    sessionStorage.setItem("showFriendsList", JSON.stringify(!showFriendsList));
  };

  const handleToggleExtension = () => {
    const friendsListElement = document.querySelector("#chat-container") as HTMLElement;
    setShowFriendsExtension(!showFriendsExtension);
    sessionStorage.setItem("showFriendsExtension", JSON.stringify(!showFriendsExtension));
    if (friendsListElement) {
      friendsListElement.style.display = !showFriendsExtension ? "none" : "block";
    }
  };

  const rootPlaceIds = friends.map((f) => presence[f.id].rootPlaceId);

  const duplicates = rootPlaceIds.filter((id, index) => rootPlaceIds.indexOf(id) !== index && id !== null);

  const newGroups = Object.values(
    friends.reduce((acc, friend) => {
      const friendPresence = presence?.[friend.id];

      if (!friendPresence) return acc;
      const { userPresenceType, rootPlaceId } = friendPresence;
      const duplicate = duplicates.includes(rootPlaceId);

      if (duplicate && userPresenceType === PresenceTypes.IN_GAME) {
        acc[rootPlaceId] = acc[rootPlaceId] || {
          friends: [],
          isGameGroup: true,
          id: rootPlaceId,
        };
        acc[rootPlaceId].friends.push(friend);
      } else {
        acc[userPresenceType] = acc[userPresenceType] || {
          friends: [],
          isGameGroup: false,
          id: userPresenceType,
        };
        acc[userPresenceType].friends.push(friend);
      }
      return acc;
    }, {} as Record<string, FriendGroup>)
  ).sort((a, b) => {
    if (a.isGameGroup && !b.isGameGroup) return -1;
    if (!a.isGameGroup && b.isGameGroup) return 1;
    if (!groupInfo[a.id] || !groupInfo[b.id]) return -1;
    const aPriority = groupInfo[a.id].priority;
    const bPriority = groupInfo[b.id].priority;
    return aPriority - bPriority;
  });
  return (
    <>
      <ThumbnailContext.Provider value={thumbnails}>
        <Slide in={showFriendsExtension} direction={"up"} appear>
          <Paper id="friendslist-container" className="friendsContainer noselect">
            <button type="button" className="friendsButton" onClick={handleToggleFriendsList}>
              <div>Friends List</div>
            </button>
            <Collapse unmountOnExit in={showFriendsList}>
              <FriendsList>
                {presence !== null &&
                  newGroups.length > 0 &&
                  newGroups.map(({ id, friends, isGameGroup }) => {
                    return (
                      <FriendsGroup
                        key={id}
                        groupSize={friends.length}
                        placeDetails={isGameGroup ? placeDetails[id] || {} : {}}
                        groupName={isGameGroup ? undefined : groupInfo[id]?.name}
                        placeId={isGameGroup ? id : undefined}
                        defaultGroupState={groupInfo[id]?.defaultGroupState}
                        extraClasses={groupInfo[id]?.extraClasses || "gameGroup"}
                      >
                        {friends.map((friend) => {
                          const friendPresence = presence[friend.id];
                          const placeDetail = placeDetails?.[friendPresence.placeId] || {};
                          const rootPlaceDetail = placeDetails?.[friendPresence.rootPlaceId] ?? {};
                          return (
                            <FriendsListItem
                              key={friend.id}
                              friendInfo={friend}
                              presence={friendPresence}
                              placeDetails={placeDetail || {}}
                              rootPlaceDetails={rootPlaceDetail}
                              disableAvatarGameIcons={isGameGroup}
                              gameGroups={isGameGroup}
                            />
                          );
                        })}
                      </FriendsGroup>
                    );
                  })}
              </FriendsList>
            </Collapse>
          </Paper>
        </Slide>
      </ThumbnailContext.Provider>
      {document.querySelector("#navbar-stream")
        ? ReactDOM.createPortal(
          <li id="navbar-settings" className="cursor-pointer navbar-icon-item">
            <span
              id="settings-icon"
              className="nav-settings-icon rbx-menu-item"
              onClick={handleToggleExtension}
              style={{
                width: "28px",
                height: "28px",
                marginTop: "5px",
                marginLeft: "6px",
                display: "block",
              }}
            >
              <span
                className="roblox-popover-close"
                id="nav-settings"
                style={{
                  backgroundImage: `url(${extensionIcon})`,
                  cursor: "pointer",
                  filter: !showFriendsExtension ? "grayscale(100%)" : "none",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  width: "100%",
                  height: "100%",
                  display: "inline-block",
                }}
              />
              <span className="notification-red notification nav-setting-highlight hidden">0</span>
            </span>
          </li>,
          document.querySelector("#navbar-stream").parentElement
        )
        : null}
    </>
  );
};
