import React, { Component } from "react";
import { Collapse } from '@mui/material';
import { FriendRow } from "./FriendRow";
export class FriendsGroup extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = { showGroup: props.defaultGroupState };
    this.handleToggleGroup = this.handleToggleGroup.bind(this);
  }

  handleToggleGroup() {
    this.setState((prevState) => ({
      showGroup: !prevState.showGroup,
    }));
  }
  render() {
    const { groupName, groupContents, extraClasses, icon, disableAvatarGameIcons, gameGroups, placeId } = this.props;
    return (
      <div className={`DropTarget friendGroup ${extraClasses ? extraClasses : ""}`}>
        <div className="groupHeaderContainer Panel Focusable" onClick={this.handleToggleGroup}>
          <div className={`groupName ${this.state.showGroup ? "" : "Collapsed"} Panel Focusable`} tabIndex="0">
            <div className="ExpandPlusMinus">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                className="SVGIcon_Button SVGIcon_PlusCircle"
                x="0px"
                y="0px"
                width="256px"
                height="256px"
                viewBox="0 0 256 256"
              >
                <circle fill="none" strokeWidth="10" strokeMiterlimit="10" cx="128" cy="128" r="95.333" />
                <line
                  className="horizontalLine"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeMiterlimit="10"
                  x1="73.333"
                  y1="128"
                  x2="183.333"
                  y2="128"
                />
                <line
                  className="verticalLine"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeMiterlimit="10"
                  x1="128.333"
                  y1="73.335"
                  x2="128.333"
                  y2="183.333"
                />
              </svg>
            </div>
            {icon 
              ? <a href={`/games/${placeId}`}> <img className="groupIcon" src={icon} alt="" /> </a>
              : null}
            {groupName}
            {!this.state.showGroup && groupContents?.length > 0 ? (
              
              <span className="groupCount">{groupContents?.length}</span>
              
            ) : null}
          </div>
        </div>
        <Collapse unmountOnExit in={this.state.showGroup && groupContents?.length > 0}>
          <div className="groupList">
            {groupContents?.map((friend) => (
              <FriendRow
                key={friend.id}
                friendInfo={friend}
                disableAvatarGameIcons={disableAvatarGameIcons}
                gameGroups={gameGroups}
              />
            ))}
          </div>
        </Collapse>
      </div>
    );
  }
}
