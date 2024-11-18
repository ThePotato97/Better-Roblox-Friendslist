import React, { useEffect, useState } from "react";
import DateSince from "../DateSince";
import { GamePopper } from "./GamePopper";
import { Fade } from "@mui/material";
import FriendsListItemMenu from "./FriendsListItemMenu";
import { FriendInfo } from "pages/Background";
import unknownGameImage from "../../../images/unknownGame.png";
import { JoinStatusCodes, PresenceTypes } from "../../global";
import { fetchServerDetails, getRequestId } from "../../apis";
import { ThumbnailContext } from "../Context/Thumbnails";

const PresenceTypesLookup = {
  0: "offline",
  1: "online",
  2: "ingame",
  3: "studio",
  4: "invisible",
};

interface friendInfoProp {
  isInGroup: boolean;
  groupPosition: number;
}

interface FriendsListItemProps {
  friendInfo: Exclude<FriendInfo["friends"], null>[0] & friendInfoProp;
  disableAvatarGameIcons: boolean;
  gameGroups: boolean;
  presence: Exclude<FriendInfo["presence"], null>[0];
  placeDetails: Exclude<FriendInfo["placeDetails"], null>[0];
  rootPlaceDetails: Exclude<FriendInfo["placeDetails"], null>[0];
}
export const FriendsListItem = function FriendsListItem({
  friendInfo, disableAvatarGameIcons, gameGroups, presence, placeDetails, rootPlaceDetails,
}: FriendsListItemProps) {
  const [serverDetails, setServerDetails] = useState<Exclude<FriendInfo["serverDetails"], null>[""]>({
    status: 1
  });

  const thumbnails = React.useContext(ThumbnailContext);

  const [menuProps, setMenuProps] = useState<{ state: "open" | "closed" }>({ state: "closed" });

  useEffect(() => {
    const getServerDetails = async () => {
      const { placeId, gameId, userPresenceType } = presence;

      if (userPresenceType === PresenceTypes.IN_GAME) {
        const serverDetails = await fetchServerDetails(placeId, gameId);
        setServerDetails(serverDetails);
      }
    };
    getServerDetails();
  }, []);


  const {
    name, displayName, id: userId, isInGroup, groupPosition,
  } = friendInfo;

  const { userPresenceType, lastOnline, placeId, gameId, rootPlaceId } = presence;

  const { name: placeName, isPlayable, reasonProhibited, universeId,
  } = placeDetails;

  const {
    name: rootPlaceName, price: placePrice, description: rootPlaceDescription,
  } = rootPlaceDetails;
  const { status } = serverDetails;

  const purchaseRequired = reasonProhibited === "PurchaseRequired";

  const presencePrivate = gameId === null;

  const getCurrentLocation = () => {
    switch (userPresenceType) {
      case PresenceTypes.OFFLINE: return `Last online ${lastOnlineString}`
      case PresenceTypes.ONLINE: return 'Online'
      case PresenceTypes.IN_GAME:
        if (presencePrivate) return "In Game"
        if (gameGroups) {
          return placeName || rootPlaceName
        } else {
          return rootPlaceName || placeName || "Loading..."
        }
      case PresenceTypes.IN_STUDIO: return rootPlaceName || placeName || "In Studio"
      default:
        return "Unknown";
    }
  }
  const isPlayEnabled = (() => {
    switch (userPresenceType) {
      case PresenceTypes.IN_GAME:
        if (isPlayable && status === JoinStatusCodes.OK || status === JoinStatusCodes.SERVER_FULL) {
          return true;
        } else {
          return false;
        }
      default:
        return false;
    }
  })()

  const lastOnlineObject = new Date(lastOnline);

  const lastOnlineString = DateSince(lastOnlineObject);

  const richPresenceEnabled = userPresenceType === PresenceTypes.IN_GAME &&
    !gameGroups &&
    rootPlaceName &&
    rootPlaceName !== placeName;

  return (
    <FriendsListItemMenu
      menuProps={menuProps}
      userId={userId}
      placeId={placeId}
      gameId={gameId}
      placePrice={placePrice ?? 0}
      isPresencePrivate={presencePrivate}
      purchaseRequired={purchaseRequired}
      isPlayEnabled={isPlayEnabled}
      rootPlaceId={rootPlaceId}
    >
      <Fade in>
        <div className="friendCategoryContainer friend-anim-enter-done">
          <div
            className={`friend ${PresenceTypesLookup[userPresenceType]} ${groupPosition && isInGroup ? groupPosition : null} 
        friendStatusHover Panel Focusable`}
          >
            {isInGroup && <div className="SteamPlayerGroupLines" />}
            {presence.placeId &&
              (userPresenceType === PresenceTypes.IN_GAME ||
                userPresenceType === PresenceTypes.IN_STUDIO) &&
              !disableAvatarGameIcons ? (
              <a href={`/games/${placeId}`}>
                <GamePopper
                  placeId={placeId}
                  description={rootPlaceDescription || placeDetails.description}
                  universeId={universeId}
                  builder={rootPlaceDetails.builder || placeDetails.builder} />
              </a>
            ) : (userPresenceType === PresenceTypes.IN_GAME ||
              userPresenceType === PresenceTypes.IN_STUDIO) &&
              !disableAvatarGameIcons ? (
              <div className="FriendInGameIcon">
                <img className="gameIcon" src={unknownGameImage} alt="" />
              </div>
            ) : null}
            <div className="steamavatar_avatarHolder_1G7LI avatarHolder no-drag Medium">
              <div className="steamavatar_avatarStatus_1Pwr6 avatarStatus" />
              <a href={`/users/${userId}/profile`}>
                <img
                  className="steamavatar_avatar_f2laR avatar"
                  src={thumbnails[getRequestId(userId, "AvatarHeadShot",
                    "150x150")]}
                  alt=""
                  draggable="false" />
              </a>
            </div>
            <div
              className={`labelHolder ${!richPresenceEnabled ? "personanameandstatus_twoLine_2wZNn" : ""} ${PresenceTypesLookup[userPresenceType]}`}
            >
              <div
                className={`personanameandstatus_statusAndName_9U-hi ${richPresenceEnabled
                  ? "personanameandstatus_threeLines_2pPym"
                  : ""}`}
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
                        d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" />
                    </svg>
                  </div>
                ) : null}
                <div
                  className="ContextMenuButton"
                  onClick={(e) => {
                    // e.preventDefault();
                    // handleToggleMenu(
                    //   true,
                    //   e.clientX + 2,
                    //   e.clientY - 6
                    // );
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
                  <div className="personanameandstatus_richPresenceLabel_3Q6g1 no-drag">
                    {placeName}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Fade>
    </FriendsListItemMenu>
  );
}