import React, { Component } from "react";

{
  /*             {groups.gameGroups
              && groups.gameGroups.map((group) => (
                <FriendsGroup
                  key={group.name}
                  groupName={group.name}
                  icon={group.icon}
                  groupContents={group.friends}
                  placeId={group.placeId}
                  defaultGroupState
                  disableAvatarGameIcons
                  gameGroups
                  extraClasses="gameGroup"
                />
              ))} */
}
/* 
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
              )} */
export class FriendsList extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render() {
    const { groups, presences, placeDetails } = this.props;
    return (
      <div className="friendsMain">
        <div className="friendlistListContainer">
          <div className="listContentContainer">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}
