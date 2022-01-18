import React, { Component } from "react";
import { Collapse, Fade } from "@mui/material";
import { GamePopper } from "./GamePopper";
import FriendsGroupMenu from "./FriendsGroupMenu";

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
    const { groupSize, extraClasses, placeId, placeDetails, groupName } = this.props;
    const { icon, universeId } = placeDetails;
    return (
      <Fade unmountOnExit in={groupSize > 0}>
        <div className={`DropTarget friendGroup ${extraClasses ? extraClasses : ""}`}>
          <FriendsGroupMenu placeId={placeId} universeId={universeId} >
            <div className="groupHeaderContainer Panel Focusable" onClick={this.handleToggleGroup}>
              <div className={`groupName ${!this.state.showGroup && "Collapsed"} Panel Focusable`} tabIndex="0">
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
                {icon && placeId ? (
                  <a href={`/games/${placeId}`}>
                    <GamePopper
                      placeIcon={icon}
                      placeId={placeId}
                      description={placeDetails.description}
                      universeId={universeId}
                      isInGroup
                      builder={placeDetails.builder}
                    />
                  </a>
                ) : null}
                {groupName}
                <span className={`groupCount ${!this.state.showGroup && "collapsed"} `}>{groupSize}</span>
              </div>
            </div>
          </FriendsGroupMenu>
          <Collapse
            unmountOnExit
            in={this.state.showGroup && this.props.children && this.props.children.length > 0}
            dimension="height"
          >
            <div className="groupList">{this.props.children}</div>
          </Collapse>
        </div>
      </Fade>
    );
  }
}
