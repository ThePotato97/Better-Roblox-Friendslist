import React, { Component } from "react";
import DateSince from "../DateSince";
import { GamePopper } from "./GamePopper";
import { Fade } from "@mui/material";
import FriendsListItemMenu from "./FriendsListItemMenu";
const unknownGameImage = chrome.runtime.getURL("/unknowngame.png");

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
export class FriendsListItem extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    const { friendInfo, disableAvatarGameIcons, gameGroups, presence, placeDetails, rootPlaceDetails } = this.props;
    const { name, displayName, id: userId, isInGroup, groupPosition } = friendInfo;
    const { userPresenceType, lastOnline, placeId, gameId, rootPlaceId } = presence;
    const { icon: placeIcon, name: placeName, isPlayable, reasonProhibited, universeId } = placeDetails;
    const { name: rootPlaceName, price: placePrice, description: rootPlaceDescription } = rootPlaceDetails;

    const currentStatus = PresenceTypes[userPresenceType].status;
    const purchaseRequired = reasonProhibited === "PurchaseRequired";
    const getCurrentLocation = () => {
      return currentStatus === "offline"
        ? `Last online ${lastOnlineString}`
        : currentStatus === "online"
          ? `Online`
          : currentStatus === "ingame"
            ? gameGroups
              ? placeName || rootPlaceName
              : rootPlaceName || placeName || "In Game"
            : currentStatus === "studio"
              ? rootPlaceName || placeName || "In Studio"
              : "Unknown";
    };
    const isPlayEnabled
      = (isPlayable && (currentStatus === "ingame" || currentStatus === "studio"))
      || (purchaseRequired && placeId && gameId);

    const lastOnlineObject = new Date(lastOnline);

    const lastOnlineString = DateSince(lastOnlineObject);

    const richPresenceEnabled
      = currentStatus === "ingame" && !gameGroups && rootPlaceName && rootPlaceName !== placeName;

    return (
      <FriendsListItemMenu
        userId={userId}
        placeId={placeId}
        gameId={gameId}
        placePrice={placePrice}
        purchaseRequired={purchaseRequired}
        isPlayEnabled={isPlayEnabled}
        rootPlaceId={rootPlaceId}
        ref={this.toggleContextMenu}
      >
        <Fade in>
          <div className="friendCategoryContainer friend-anim-enter-done">
            <div
              className={`friend ${currentStatus} ${groupPosition && isInGroup ? groupPosition : null} 
        friendStatusHover Panel Focusable`}
            >
              {isInGroup && <div className="SteamPlayerGroupLines" />}
              {placeIcon && (currentStatus === "ingame" || currentStatus === "studio") && !disableAvatarGameIcons ? (
                <a href={`/games/${placeId}`}>
                  <GamePopper
                    placeIcon={placeIcon}
                    placeId={presence.rootPlaceId || placeId}
                    description={rootPlaceDescription || placeDetails.description}
                    universeId={universeId}
                    builder={rootPlaceDetails.builder}
                  />
                </a>
              ) : (currentStatus === "ingame" || currentStatus === "studio") && !disableAvatarGameIcons ? (
                <div className="FriendInGameIcon">
                  <img className="gameIcon" src={unknownGameImage} alt="" />
                </div>
              ) : null}
              <div className="steamavatar_avatarHolder_1G7LI avatarHolder no-drag Medium">
                <div className="steamavatar_avatarStatus_1Pwr6 avatarStatus" />
                <a href={`/users/${userId}/profile`}>
                  <img
                    className="steamavatar_avatar_f2laR avatar"
                    src={`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=50&height=50&format=png`}
                    alt=""
                    draggable="false"
                  />
                </a>
              </div>
              <div
                className={`labelHolder ${
                  !richPresenceEnabled ? "personanameandstatus_twoLine_2wZNn" : ""
                } ${currentStatus}`}
              >
                <div
                  className={`personanameandstatus_statusAndName_9U-hi ${
                    richPresenceEnabled ? "personanameandstatus_threeLines_2pPym" : ""
                  }`}
                >
                  <div className="personanameandstatus_playerName_1uxaf">
                    {displayName}
                    {name !== displayName ? (
                      <span className="personanameandstatus_playerNickname_3-32P">{`(@${name})`}</span>
                    ) : null}
                  </div>
                  {isPlayEnabled ? (
                    <div className="personastatusicons_Joinable" title="Joinable">
                      <svg
                        version="1.1"
                        id="Layer_2"
                        xmlns="http://www.w3.org/2000/svg"
                        className="SVGIcon_Joinable"
                        x="0px"
                        y="0px"
                        width="15px"
                        height="15px"
                        viewBox="0 0 448 512"
                      >
                        <path
                          fill="currentColor"
                          d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
                        />
                      </svg>
                    </div>
                  ) : null}
                  <div
                    className="ContextMenuButton"
                    onClick={(e) => {
                      e.preventDefault();
                      this.toggleContextMenu.current.setAnchorPoint({ x: e.clientX, y: e.clientY });
                      this.toggleContextMenu.current.toggleMenu(true);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="SVGIcon_Button SVGIcon_DownArrowContextMenu"
                      data-name="Layer 1"
                      viewBox="0 0 128 128"
                      x="0px"
                      y="0px"
                    >
                      <polygon points="50 59.49 13.21 22.89 4.74 31.39 50 76.41 95.26 31.39 86.79 22.89 50 59.49" />
                    </svg>
                  </div>
                </div>
                <div className="personanameandstatus_richPresenceContainer_21cNf">
                  <div className="personanameandstatus_gameName_qvibF personanameandstatus_richPresenceLabel_3Q6g1 no-drag">
                    {getCurrentLocation()}
                  </div>
                  {richPresenceEnabled ? (
                    <div className="personanameandstatus_richPresenceLabel_3Q6g1 no-drag">{placeName}</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </Fade>
      </FriendsListItemMenu>
    );
  }
}
