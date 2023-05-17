import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FriendsList, FriendsListItem, FriendsGroup } from "./Components";
import { Collapse, Slide } from "@mui/material";
import "./friendsmain.scss";
import "./friends.scss";
import extensionIcon from "../../icons/Icon48x.png";
import { FriendInfo } from "pages/Background";
import { JoinStatusCodes, PresenceTypes } from "../global";

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

type IGroup = {
  name: string;
  placeId?: number;
  indexName: string;
  friends: friendItem[];
  isGroup?: boolean;
  gameGroups?: boolean;
  defaultGroupState: boolean;
  extraClasses: string;
  disableAvatarGameIcons?: boolean;
};

const getGroups = async (friendInfo: FriendInfo | undefined) => {
  if (!friendInfo) return [];
  const groupStates = {} || (await chrome.storage.local.get("groupStates"));
  const { presence, friends, serverDetails } = friendInfo;
  if (!friends || !presence || !serverDetails) return [];
  const rootPlaceIds = friends.map((f) => presence[f.id].rootPlaceId);

  const duplicates = rootPlaceIds.filter(
    (id, index) => rootPlaceIds.indexOf(id) !== index && id !== null
  );
  const sortedFriendsList = friends.sort(sortFriendsAlphabet);
  const newGroups: IGroup[] = [
    {
      name: "In Game",
      indexName: "ingame",
      friends: sortedFriendsList
        .filter((f) => {
          const userPresence = presence[f.id];
          return (
            userPresence.userPresenceType === PresenceTypes.IN_GAME &&
            !duplicates.includes(userPresence.rootPlaceId)
          );
        })
        .sort((a: friendItem, b: friendItem) => {
          const { placeId: aPlace, gameId: aGameId } = presence[a.id] ?? {};
          const { placeId: bPlace, gameId: bGameId } = presence[b.id] ?? {};

          const aServerDetails = serverDetails[aGameId];
          const bServerDetails = serverDetails[bGameId];
          const aStatus = aServerDetails?.status;
          const bStatus = bServerDetails?.status;

          const aIsJoinable =
            aStatus === JoinStatusCodes.OK ||
            aStatus === JoinStatusCodes.SERVER_FULL;
          const bIsJoinable =
            bStatus === JoinStatusCodes.OK ||
            bStatus === JoinStatusCodes.SERVER_FULL;

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

export const App = () => {
  const [groups, setGroups] = useState<friendGroups>([]);
  const [presence, setPresence] = useState<FriendInfo["presence"]>(null);

  const [serverDetails, setServerDetails] =
    useState<FriendInfo["serverDetails"]>(null);

  const [placeDetails, setPlaceDetails] =
    useState<FriendInfo["placeDetails"]>(null);
  const [showFriendsList, setShowFriendsList] = useState<boolean>(
    JSON.parse(sessionStorage.getItem("showFriendsList") ?? "true")
  );
  const [showFriendsExtension, setShowFriendsExtension] = useState<boolean>(
    JSON.parse(sessionStorage.getItem("showFriendsExtension") ?? "true")
  );

  useEffect(() => {
    const friendsListElement = document.querySelector(
      "#chat-container"
    ) as HTMLElement;
    if (friendsListElement) {
      friendsListElement.style.display = showFriendsExtension
        ? "none"
        : "block";
    }
    const port = chrome.runtime.connect({ name: "update" });
    port.postMessage({ message: "setUserId", userId: 13277651 });
    port.onMessage.addListener((msg) => {
      if (!msg) {
        console.log("no msg");
        return;
      }
      getGroups(msg).then((groups) => {
        setGroups(groups);
      });
      setPresence(msg.presence);
      setServerDetails(msg.serverDetails);
      setPlaceDetails(msg.placeDetails);
    });
  }, [showFriendsExtension]);

  const handleToggleFriendsList = () => {
    setShowFriendsList(!showFriendsList);
    sessionStorage.setItem("showFriendsList", JSON.stringify(!showFriendsList));
  };

  const handleToggleExtension = () => {
    const friendsListElement = document.querySelector("#chat-container");
    setShowFriendsExtension(!showFriendsExtension);
    sessionStorage.setItem(
      "showFriendsExtension",
      JSON.stringify(!showFriendsExtension)
    );
    if (friendsListElement) {
      friendsListElement.style.display = !showFriendsExtension
        ? "none"
        : "block";
    }
  };

  return (
    <>
      <Slide in={showFriendsExtension} direction={"up"} appear>
        <div className="friendsContainer noselect">
          <button
            type="button"
            className="friendsButton"
            onClick={handleToggleFriendsList}
          >
            <div>Friends List</div>
          </button>
          <Collapse unmountOnExit in={showFriendsList}>
            <FriendsList>
              {groups?.length > 0 &&
                serverDetails !== null &&
                placeDetails !== null &&
                presence !== null &&
                Object.keys(groups).length > 0 &&
                groups.map((group) => (
                  <FriendsGroup
                    key={group.name || group.placeId}
                    indexName={group.indexName}
                    groupSize={group.friends.length}
                    placeDetails={
                      group.placeId ? placeDetails[group.placeId] : {}
                    }
                    groupName={
                      group.name ||
                      (group.placeId &&
                        placeDetails[group.placeId] &&
                        placeDetails[group.placeId].name)
                    }
                    placeId={group.placeId}
                    defaultGroupState={group.defaultGroupState}
                    extraClasses={group.extraClasses}
                  >
                    {group.friends.map((friend) => {
                      const friendPresence = presence[friend.id];
                      const placeDetail = placeDetails[friendPresence.placeId];
                      const gameId = friendPresence.gameId;

                      const serverDetail = serverDetails[gameId] ?? {};

                      return (
                        <FriendsListItem
                          key={friend.id}
                          friendInfo={friend}
                          serverDetails={serverDetail}
                          presence={friendPresence}
                          placeDetails={placeDetail || {}}
                          rootPlaceDetails={friendPresence}
                          disableAvatarGameIcons={group.disableAvatarGameIcons}
                          gameGroups={group.gameGroups}
                        />
                      );
                    })}
                  </FriendsGroup>
                ))}
            </FriendsList>
          </Collapse>
        </div>
      </Slide>
      {document.querySelector("#navbar-stream")
        ? ReactDOM.createPortal(
            <li
              id="navbar-settings"
              className="cursor-pointer navbar-icon-item"
            >
              <span
                id="settings-icon"
                className="nav-settings-icon rbx-menu-item"
                onClick={handleToggleExtension}
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
                    width: "28px",
                    height: "28px",
                    display: "inline-block",
                  }}
                />
                <span className="notification-red notification nav-setting-highlight hidden">
                  0
                </span>
              </span>
            </li>,
            document.querySelector("#navbar-stream").parentElement
          )
        : null}
    </>
  );
};
