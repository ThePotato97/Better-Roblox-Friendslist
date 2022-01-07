import React, { Component } from "react";
import { FriendsList, FriendsListItem, FriendsGroup } from "./Components";
import { Collapse } from "@mui/material";
import "./friendsmain.scss";
import "./friends.scss";

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
  const { presence, friends } = groups;
  let tempGroups = {
    ingame: {
      name: "In Game",
      friends: [],
      defaultGroupState: true,
      extraClasses: "gameGroup OtherGamesGroup",
    },
    studio: {
      name: "In Studio",
      friends: [],
      defaultGroupState: true,
      extraClasses: "gameGroup OtherGamesGroup",
    },
    online: {
      name: "Online",
      friends: [],
      defaultGroupState: true,
      extraClasses: "onlineFriends",
    },
    offline: {
      name: "Offline",
      friends: [],
      defaultGroupState: false,
      extraClasses: "offlineFriends",
    },
  };
  let extraGroups = {};
  if (friends) {
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
              gameIdGroup.groupPosition = 0 === index ? "firstInGroup" : index === length - 1 ? "lastInGroup" : "inGroup";
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
    this.state = {
      groups: [
        {
          name: "In Game",
          friends: [],
          defaultGroupState: !0,
          extraClasses: "gameGroup OtherGamesGroup",
        },
        {
          name: "In Studio",
          friends: [],
          defaultGroupState: !0,
          extraClasses: "gameGroup OtherGamesGroup",
        },
        {
          name: "Online",
          friends: [],
          defaultGroupState: !0,
          extraClasses: "onlineFriends",
        },
        {
          name: "Offline",
          friends: [],
          defaultGroupState: !1,
          extraClasses: "offlineFriends",
        },
      ],
      showFriendsList: true,
    };
    this.handleToggleFriendsList = this.handleToggleFriendsList.bind(this);
  }

  componentDidMount() {
    let port = chrome.runtime.connect({ name: "update" });
    port.postMessage({ message: "request" });
    port.onMessage.addListener((msg) => {

      const groups = getGroups(msg);
      console.log("GROUPS", groups);
      this.setState(() => ({
        groups: groups,
        presence: msg.presence,
        placeDetails: msg.placeDetails,
      }));
    });
  }

  handleToggleFriendsList() {
    this.setState((prevState) => ({
      showFriendsList: !prevState.showFriendsList,
    }));
  }
  render() {
    const { groups = [], presence = {}, placeDetails = {} } = this.state;
    return (
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
                      rootPlaceDetails={(presence[friend.id] && placeDetails[presence[friend.id].rootPlaceId]) || {}}
                      disableAvatarGameIcons={group.disableAvatarGameIcons}
                      gameGroups={group.gameGroups}
                    />
                  ))}
                </FriendsGroup>
              ))}
          </FriendsList>
        </Collapse>
      </div>
    );
  }
}
