import React, { Component } from "react";
import { FriendsGroup } from "./FriendsGroup";
import "./friendsnew.scss";
import "./friends.scss";

export class FriendsList extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render() {
    const { groups } = this.props;
    return (
      <div className="friendsMain">
        <div className="friendlistListContainer">
          <div className="listContentContainer">
            {groups.gameGroups
              && groups.gameGroups.map((group) => (
                <FriendsGroup
                  key={group.name}
                  groupName={group.name}
                  icon={group.icon}
                  groupContents={group.friends}
                  defaultGroupState
                  disableAvatarGameIcons
                  extraClasses="gameGroup"
                />
              ))}
            {groups.ingame && groups.ingame.length > 0 && (
              <FriendsGroup
                groupName="In Game"
                groupContents={groups.ingame}
                defaultGroupState
                extraClasses="gameGroup OtherGamesGroup"
              />
            )}
            {groups.studio && groups.studio.length > 0 && (
              <FriendsGroup
                groupName="In Studio"
                groupContents={groups.studio}
                defaultGroupState
                extraClasses="gameGroup OtherGamesGroup"
              />
            )}
            {groups.online && groups.online.length > 0 && (
              <FriendsGroup
                groupName="Online"
                groupContents={groups.online}
                defaultGroupState
                extraClasses="onlineFriends"
              />
            )}
            {groups.offline && groups.offline.length > 0 && (
              <FriendsGroup
                groupName="Offline"
                groupContents={groups.offline}
                defaultGroupState={false}
                extraClasses="offlineFriends"
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}
