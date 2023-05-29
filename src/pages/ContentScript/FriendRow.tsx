import React, { Component } from "react";
import DateSince from "./DateSince";
import { JoinButton } from "./FriendRow/JoinButton";
import unknownGame from "/images/unknownGame.png";
import { Fade } from "@mui/material";
import { PresenceTypes } from "../global";

export const FriendRow = ({ friendInfo, disableAvatarGameIcons, gameGroups }) => {
  const {
    name,
    userPresenceType,
    displayName,
    placeIcon,
    placeId,
    gameId,
    userId,
    lastOnline,
    reasonProhibited,
    isPlayable,
    placePrice,
    placeName,
    rootPlaceName,
    isInGroup,
    groupPosition,
  } = friendInfo;

  const currentStatus = PresenceTypes[userPresenceType];
  const purchaseRequired = reasonProhibited === "PurchaseRequired";

  const isPlayEnabled =
    (isPlayable &&
      (currentStatus === "ingame" || currentStatus === "studio")) ||
    (purchaseRequired && placeId && gameId);

  const lastOnlineObject = new Date(lastOnline);

  const lastOnlineString = DateSince(lastOnlineObject);
  const getCurrentLocation = () => {
    switch (currentStatus) {
      case "offline":
        return `Last online ${lastOnlineString}`;
      case "online":
        return "Online";
      case "ingame":
        return gameGroups
          ? placeName || rootPlaceName
          : rootPlaceName || placeName || "In Game";
      case "studio":
        return rootPlaceName || placeName || "In Studio";
    }
  };

  const placeIconComponent = () => {
    if (
      placeIcon &&
      (currentStatus === "ingame" || currentStatus === "studio") &&
      !disableAvatarGameIcons
    ) {
      return (
        <a href={`/games/${placeId}`}>
          <div className="FriendInGameIcon">
            <img className="gameIcon" src={placeIcon} alt="" />
          </div>
        </a>
      );
    } else if (
      (currentStatus === "ingame" || currentStatus === "studio") &&
      !disableAvatarGameIcons
    ) {
      return (
        <div className="FriendInGameIcon">
          <img className="gameIcon" src={unknownGame} alt="" />
        </div>
      );
    } else {
      return null;
    }
  };

  const richPresenceEnabled =
    currentStatus === "ingame" &&
    !gameGroups &&
    rootPlaceName &&
    rootPlaceName !== placeName;
  return (
    <Fade in>
      <div className="friendCategoryContainer friend-anim-enter-done">
        <div
          className={`friend ${currentStatus} ${
            groupPosition && isInGroup ? groupPosition : null
          } 
        friendStatusHover Panel Focusable`}
        >
          {isInGroup && <div className="SteamPlayerGroupLines" />}
          {placeIconComponent}
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
                richPresenceEnabled
                  ? "personanameandstatus_threeLines_2pPym"
                  : ""
              }`}
            >
              <div className="personanameandstatus_playerName_1uxaf">
                {displayName}
                {name !== displayName ? (
                  <span className="personanameandstatus_playerNickname_3-32P">{`(@${name})`}</span>
                ) : null}
              </div>

              <div className="ContextMenuButton">
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
                <div className="personanameandstatus_richPresenceLabel_3Q6g1 no-drag">
                  {placeName}
                </div>
              ) : null}
            </div>
          </div>
          {isPlayEnabled ? (
            <JoinButton
              placeId={placeId}
              gameId={gameId}
              purchaseRequired={purchaseRequired}
              currentStatus={currentStatus}
              userId={userId}
              placePrice={placePrice}
            />
          ) : null}
        </div>
      </div>
    </Fade>
  );
};
