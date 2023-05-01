import React, { Component } from "react";
import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/core.css";
import "./FriendsListItemMenu.scss";

const joinGame = (content) => {
  const isFirefox = typeof InstallTrigger !== "undefined";
  if (isFirefox) {
    content = cloneInto(content, document.defaultView);
  }
  const event = new CustomEvent("RecieveContent", { detail: content });
  window.dispatchEvent(event);
};

export default class FriendsListItemMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorPoint: { x: 0, y: 0 },
      menuProps: {
        state: "closed",
      },
    };
    this.handleToggleMenu = this.handleToggleMenu.bind(this);
    this.handleOpenProfile = this.handleOpenProfile.bind(this);
    this.handleJoinFriend = this.handleJoinFriend.bind(this);
    this.handleJoinGame = this.handleJoinGame.bind(this);
  }

  handleToggleMenu(isOpen, x, y) {
    const setStateTo = {
      menuProps: {
        state: isOpen ? "open" : "closed",
      },
    };
    if (x && y) {
      setStateTo.anchorPoint = { x: x, y: y };
    }
    this.setState(() => ({
      ...setStateTo,
    }));
  }

  handleOpenProfile() {
    const { userId } = this.props;
    window.location = `https://www.roblox.com/users/${userId}/profile`;
  }

  handleJoinFriend() {
    const { placeId, gameId, userId, rootPlaceId, purchaseRequired } = this.props;
    if (purchaseRequired) {
      window.location = `https://www.roblox.com/games/${placeId}`;
      return;
    }
    let content = {
      action: "joinGame",
      rootPlaceId: rootPlaceId,
      placeId: placeId,
      gameId: gameId,
      userId: userId,
    };

    joinGame(content);
  }

  handleJoinGame() {
    const { placeId, rootPlaceId, purchaseRequired } = this.props;
    if (purchaseRequired) {
      window.location = `https://www.roblox.com/games/${placeId}`;
      return;
    }
    let content = {
      action: "joinGame",
      rootPlaceId: rootPlaceId,
      placeId: placeId,
    };
    joinGame(content);
  }
  render() {
    const { purchaseRequired, placePrice, isPlayEnabled } = this.props;
    const placePriceDisplay = placePrice || 0;
    return (
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          this.handleToggleMenu(true, e.clientX, e.clientY);
        }}
      >
        {this.props.children}

        <ControlledMenu
          {...this.state.menuProps}
          anchorPoint={this.state.anchorPoint}
          onClose={() => this.handleToggleMenu(false)}
        >
          <MenuItem onClick={this.handleOpenProfile}>View Profile</MenuItem>
          {isPlayEnabled ? (
            <>
              <MenuItem onClick={this.handleJoinFriend}>
                {purchaseRequired ? <span className="icon icon-robux-white-16x16" /> : null}
                {purchaseRequired ? placePriceDisplay : "Join Friend"}
              </MenuItem>
              {purchaseRequired ? undefined : (
                <MenuItem onClick={this.handleJoinGame}>
                  {"Join Game"}
                </MenuItem>
              )}
            </>
          ) : null}
        </ControlledMenu>
      </div>
    );
  }
}
