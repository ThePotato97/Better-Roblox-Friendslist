import React, { Component } from "react";
import ReactDOM from "react-dom";
import { FriendsList, FriendsListItem, FriendsGroup } from "./Components";
import { Collapse, Slide } from "@mui/material";
import "./friendsmain.scss";
import "./friends.scss";

const extensionIcon = chrome.runtime.getURL("icons/Icon48x.png");

const PresenceTypes = {
  0: {
    status: "offline",
  },
  1: {
    status: "online",
  },
  2: {
    status: "ingame",
  },
  3: {
    status: "studio",
  },
};

const getGroups = (groups) => {
  const groupStates = JSON.parse(localStorage.getItem("groupStates"));
  const { presence, friends } = groups;
  let tempGroups = {
    ingame: {
      name: "In Game",
      indexName: "ingame",
      friends: [],
      defaultGroupState: groupStates?.ingame ?? true,
      extraClasses: "gameGroup OtherGamesGroup",
    },
    studio: {
      name: "In Studio",
      indexName: "studio",
      friends: [],
      defaultGroupState: groupStates?.studio ?? true,
      extraClasses: "gameGroup OtherGamesGroup",
    },
    online: {
      name: "Online",
      indexName: "online",
      friends: [],
      defaultGroupState: groupStates?.online ?? true,
      extraClasses: "onlineFriends",
    },
    offline: {
      name: "Offline",
      indexName: "offline",
      friends: [],
      defaultGroupState: groupStates?.offline ?? true,
      extraClasses: "offlineFriends",
    },
  };
  let extraGroups = {};
  if (friends) {
    // sort friends with joins off
    friends.sort((a, b) => {
      const aPlace = presence[a.id].placeId ?? 0;
      const bPlace = presence[b.id].placeId ?? 0;
      if (!aPlace && !bPlace) return 0;
      if (!aPlace) return 1;
      if (!bPlace) return -1;

      return 0;
    });
    const duplicates = friends.reduce((frGroups, friend) => {
      const item = presence[friend.id];
      const placeId = item.rootPlaceId || item.placeId;
      if (null === placeId || "offline" === PresenceTypes[item.userPresenceType]) {
        return frGroups;
      }
      const group = frGroups[placeId] || [];
      group.push(friend);
      frGroups[placeId] = group;
      return frGroups;
    }, {});

    let tempDuplicates = [];
    for (const [placeId, item] of Object.entries(duplicates)) item.length > 1 && tempDuplicates.push(placeId);

    tempDuplicates.forEach((id) => {
      const t = {
        placeId: id,
        friends: [],
        gameGroups: !0,
        disableAvatarGameIcons: !0,
        defaultGroupState: !0,
        extraClasses: "gameGroup",
      };
      extraGroups[id] = t;
    });
    friends.forEach((friend) => {
      const userPresence = presence[friend.id];
      const presenceType = PresenceTypes[userPresence.userPresenceType].status;
      const placeId = userPresence.rootPlaceId || userPresence.placeId;
      if (extraGroups[placeId]) {
        extraGroups[placeId].friends.push(friend);
      } else {
        tempGroups[presenceType].friends.push(friend);
      }
    });
    for (const [, value] of Object.entries(extraGroups)) {
      const duplicateGameIds = value.friends.reduce((frGroups, friend) => {
        const gameId = presence[friend.id].gameId;
        if (null === gameId) {
          return frGroups;
        }
        const group = frGroups[gameId] || [];
        group.push(friend);
        frGroups[gameId] = group;
        return frGroups;
      }, {});

      let tempFriends = [];
      for (const [, gameIdGroup] of Object.entries(duplicateGameIds)) {
        const length = gameIdGroup.length;
        if (length > 1) {
          gameIdGroup.forEach((gameIdGroup, index) => {
            {
              gameIdGroup.groupPosition
                = 0 === index ? "firstInGroup" : index === length - 1 ? "lastInGroup" : "inGroup";
              gameIdGroup.isInGroup = true;
            }
          });
        }
        tempFriends.push(...gameIdGroup.flat());
      }
      value.friends = tempFriends;
    }

    tempGroups.offline.friends.sort((a, b) => {
      const aDate = new Date(presence[a.id].lastOnline);
      const bDate = new Date(presence[b.id].lastOnline);
      return bDate - aDate;
    });

    const groupsMerged = Object.values(extraGroups).concat(Object.values(tempGroups));
    return groupsMerged;
  }
};

export class App extends Component {
  constructor(props) {
    super(props);
    const showFriendsList = JSON.parse(sessionStorage.getItem("showFriendsList"));
    const showFriendsExtension = JSON.parse(sessionStorage.getItem("showFriendsExtension"));
    const groupStates = JSON.parse(localStorage.getItem("groupStates"));
    this.state = {
      groups: [
        {
          name: "In Game",
          indexName: "ingame",
          friends: [],
          defaultGroupState: groupStates?.ingame ?? true,
          extraClasses: "gameGroup OtherGamesGroup",
        },
        {
          name: "In Studio",
          indexName: "studio",
          friends: [],
          defaultGroupState: groupStates?.studio ?? true,
          extraClasses: "gameGroup OtherGamesGroup",
        },
        {
          name: "Online",
          indexName: "online",
          friends: [],
          defaultGroupState: groupStates?.online ?? true,
          extraClasses: "onlineFriends",
        },
        {
          name: "Offline",
          indexName: "offline",
          friends: [],
          defaultGroupState: groupStates?.offline ?? true,
          extraClasses: "offlineFriends",
        },
      ],
      showFriendsList: showFriendsList ?? true,
      showExtension: showFriendsExtension ?? true,
    };
    this.handleToggleFriendsList = this.handleToggleFriendsList.bind(this);
    this.handleToggleExtension = this.handleToggleExtension.bind(this);
  }

  componentDidMount() {
    const friendsListElement = document.querySelector("#chat-container");
    if (friendsListElement) {
      friendsListElement.style.display = this.state.showExtension ? "none" : "block";
    }
    let port = chrome.runtime.connect({ name: "update" });
    port.postMessage({ message: "request" });
    port.onMessage.addListener((msg) => {
      const groups = getGroups(msg);
      this.setState(() => ({
        groups: groups,
        presence: msg.presence,
        placeDetails: msg.placeDetails,
      }));
    });
  }

  handleToggleExtension() {
    const friendsListElement = document.querySelector("#chat-container");
    this.setState((prevState) => ({
      showExtension: !prevState.showExtension,
      // eslint-disable-next-line no-sequences
    })), sessionStorage.setItem("showFriendsExtension", !this.state.showExtension);
    if (friendsListElement) {
      friendsListElement.style.display = !this.state.showExtension ? "none" : "block";
    }
  }
  handleToggleFriendsList() {
    this.setState((prevState) => ({
      showFriendsList: !prevState.showFriendsList,
      // eslint-disable-next-line no-sequences
    })), sessionStorage.setItem("showFriendsList", !this.state.showFriendsList);
  }
  render() {
    const { groups = [], presence = {}, placeDetails = {} } = this.state;
    return (
      <>
        <Slide in={this.state.showExtension} direction={"up"} appear>
          <div className="friendsContainer noselect">
            <button type="button" className="friendsButton" onClick={this.handleToggleFriendsList}>
              <div>Friends List</div>
            </button>
            <Collapse unmountOnExit in={this.state.showFriendsList} dimension="height">
              <FriendsList>
                {groups
                  && groups.map((group) => (
                    <FriendsGroup
                      key={group.name || group.placeId}
                      indexName={group.indexName}
                      groupSize={group.friends.length}
                      placeDetails={placeDetails[group.placeId] || {}}
                      groupName={
                        group.name || (group.placeId && placeDetails[group.placeId] && placeDetails[group.placeId].name)
                      }
                      placeId={group.placeId}
                      defaultGroupState={group.defaultGroupState}
                      extraClasses={group.extraClasses}
                    >
                      {group.friends.map((friend) => (
                        <FriendsListItem
                          key={friend.id}
                          friendInfo={friend}
                          presence={presence[friend.id]}
                          placeDetails={
                            (presence[friend.id]
                              && presence[friend.id].placeId
                              && placeDetails[presence[friend.id].placeId])
                            || {}
                          }
                          rootPlaceDetails={
                            (presence[friend.id] && placeDetails[presence[friend.id].rootPlaceId]) || {}
                          }
                          disableAvatarGameIcons={group.disableAvatarGameIcons}
                          gameGroups={group.gameGroups}
                        />
                      ))}
                    </FriendsGroup>
                  ))}
              </FriendsList>
            </Collapse>
          </div>
        </Slide>
        {document.querySelector("#navbar-stream") ? ReactDOM.createPortal(
          <li id="navbar-settings" className="cursor-pointer navbar-icon-item">
            <span id="settings-icon" className="nav-settings-icon rbx-menu-item" onClick={this.handleToggleExtension}>
              <span
                className="roblox-popover-close"
                id="nav-settings"
                style={{
                  backgroundImage: `url(${extensionIcon})`,
                  cursor: "pointer",
                  filter: !this.state.showExtension && "grayscale(100%)",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  width: "28px",
                  height: "28px",
                  display: "inline-block",
                }}
              />
              <span className="notification-red notification nav-setting-highlight hidden">0</span>
            </span>
          </li>,
          document.querySelector("#navbar-stream").parentElement
        ) : null}
      </>
    );
  }
}
