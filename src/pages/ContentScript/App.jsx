import React, { Component } from "react";
import { FriendsList } from "./FriendsList";
import { Collapse } from '@mui/material';
import "./friendsnew.scss";

const PresenceTypes = {
  0: {
    status: 'offline',
  },
  1: {
    status: 'online',
  },
  2: {
    status: 'ingame',
  },
  3: {
    status: 'studio',
  },
};

const getGroups = function (friends) {
  let tempGroups = {
    online: [],
    offline: [],
    ingame: [],
    studio: [],
    gameGroups: [],
  };

  if (friends) {
    const groups = friends.gameGroups;
    const allFriends = friends.friends;


    groups.forEach((group) => {
      tempGroups.gameGroups.push(group);
    });
    for (let i = 0; i < allFriends.length; i++) {
      let gameGroup = false;
      const placeId = (allFriends[i] && allFriends[i].rootPlaceId) || allFriends[i].placeId;
      if (tempGroups.gameGroups.length > 0) {
        for (let j = 0; j < tempGroups.gameGroups.length; j++) {
          if (placeId === tempGroups.gameGroups[j].placeId) {
            tempGroups.gameGroups[j].friends.push(allFriends[i]);
            gameGroup = true;
            break;
          }
        }
        if (gameGroup) {
          continue;
        }
      }
      const userPresenceType = PresenceTypes[allFriends[i].userPresenceType].status;
      tempGroups[userPresenceType].push(allFriends[i]);
    }

    for (let i = 0; i < tempGroups.gameGroups.length; i++) {
      const groups = tempGroups.gameGroups[i].friends.reduce((groups, item) => {
        const group = (groups[item.gameId] || []);
        group.push(item);
        groups[item.gameId] = group;
        return groups;
      }, {});
      let tempFriends = [];
      for (const [key, value] of Object.entries(groups)) {
        const length = value.length;
        if (length > 1) {
          for (let i = 0; i < value.length; i++) {
            if (i === 0) {
              value[i].groupPosition = "firstInGroup";
            } else if (i === length-1) {
              value[i].groupPosition = "lastInGroup";
            } else {
              value[i].groupPosition = "inGroup";
            }
            value[i].isInGroup = true;
          }
        }

        tempFriends.push(...value.flat());
      }
      tempGroups.gameGroups[i].friends = tempFriends;
    }
  }

  tempGroups.offline.sort((a, b) => {
    return new Date(b.lastOnline) - new Date(a.lastOnline);
  });
  return tempGroups;
};

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: {
        online: [],
        offline: [],
        ingame: [],
        studio: [],
        gameGroups: [],
      },
      showFriendsList: true,
    };
    this.handleToggleFriendsList = this.handleToggleFriendsList.bind(this);
  }

  componentDidMount() {
    let port = chrome.runtime.connect({ name: "update" });
    port.postMessage({ message: "request" });
    port.onMessage.addListener(
      (msg) => {
        const groups = getGroups(msg);
        console.log("GROUPS", groups);
        this.setState(() => ({
          groups: groups,
        }));
      }
    );
  }

  handleToggleFriendsList() {
    this.setState((prevState) => ({
      showFriendsList: !prevState.showFriendsList,
    }));
  }
  render() {
    return (
      <div className="friendsContainer noselect">
        <button type="button" className="friendsButton" onClick={this.handleToggleFriendsList}>
          <div>Friends List</div>
        </button>
        <Collapse unmountOnExit in={this.state.showFriendsList} dimension="height">
          <FriendsList groups={this.state.groups} />
        </Collapse>
      </div>
    );
  }
}
