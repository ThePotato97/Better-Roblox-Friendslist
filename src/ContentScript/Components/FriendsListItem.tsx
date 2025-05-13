import React, { memo, useState } from "react";
import DateSince from "../DateSince";
import { GamePopper } from "./GamePopper";
import { Skeleton } from "@mui/material";

import unknownGameImage from "../../unknowngame.png";
import { JoinStatusCodes } from "../../global";
import { useAtomValue, useSetAtom } from "jotai";

import { PresenceType } from "@/src/database/FriendsDB";

import {
  createPresenceSelector,
  contextMenuAtom,
  placeDetailsFamily,
  profileDetailsFamily,
  thumbnailFamily,
} from "@/src/atoms";

const PresenceTypesLookup = {
  0: "offline",
  1: "online",
  2: "ingame",
  3: "studio",
  4: "invisible",
};

interface FriendsListItemProps {
  userId: number;
  isInGroup: boolean;
  groupPosition: string;
}

export const FriendsListItem = memo(function FriendsListItem({
  userId,

  isInGroup,
  groupPosition,
}: FriendsListItemProps) {
  const setContextMenu = useSetAtom(contextMenuAtom);

  const profile = useAtomValue(profileDetailsFamily(userId));

  const { combinedName, username } = profile ?? {};

  const userHeadshotDetails = useAtomValue(
    thumbnailFamily({ id: userId, type: "AvatarHeadShot", size: "150x150" }),
  );

  const userHeadshot = userHeadshotDetails?.imageUrl;

  const userPresenceAtom = useMemo(
    () => createPresenceSelector(userId),
    [userId],
  );

  const userPresence = useAtomValue(userPresenceAtom) ?? {};

  const placeDetails = useAtomValue(placeDetailsFamily(userPresence?.placeId));

  const rootPlaceDetails = useAtomValue(
    placeDetailsFamily(placeDetails?.universeRootPlaceId),
  );

  const [serverDetails, setServerDetails] = useState<
    Exclude<FriendInfo["serverDetails"], null>[""]
  >({
    status: 1,
  });

  const [menuProps, setMenuProps] = useState<{ state: "open" | "closed" }>({
    state: "closed",
  });

  // useEffect(() => {
  //   const getServerDetails = async () => {
  //     const { placeId, gameId, userPresenceType } = userPresence;

  //     if (userPresenceType === PresenceType.InGame) {
  //       const serverDetails = await fetchServerDetails(placeId, gameId);
  //       setServerDetails(serverDetails);
  //     }
  //   };
  //   getServerDetails();
  // }, []);

  // const {
  // 	name,
  // 	displayName,
  // 	id: userId,
  // 	isInGroup,
  // 	groupPosition,
  // } = friendInfo;

  const { userPresenceType, lastOnline, placeId, gameId, rootPlaceId } =
    userPresence || {};

  const { name: rootPlaceName } = rootPlaceDetails ?? {};

  const { name: placeName, price: placePrice } = placeDetails ?? {};

  const { status } = serverDetails;

  const purchaseRequired = false;

  const presencePrivate = gameId === null;

  const getCurrentLocation = () => {
    switch (userPresenceType) {
      case PresenceType.Offline:
        if (!!lastOnline) {
          return `Last seen ${lastOnlineString}`;
        } else {
          return "Not seen online";
        }
      case PresenceType.Online:
        return "Online";
      case PresenceType.InGame:
        if (presencePrivate) return "In Game";
        if (isInGroup) {
          return placeName || rootPlaceName;
        } else {
          return rootPlaceName || placeName || "Loading...";
        }
      case PresenceType.InStudio:
        return rootPlaceName || placeName || "In Studio";
      default:
        return "Unknown";
    }
  };
  const isPlayEnabled = (() => {
    switch (userPresenceType) {
      case PresenceType.InGame:
        if (
          status === JoinStatusCodes.OK ||
          status === JoinStatusCodes.SERVER_FULL
        ) {
          return true;
        } else {
          return false;
        }
      default:
        return false;
    }
  })();

  const lastOnlineObject = new Date(lastOnline ?? 0);

  const lastOnlineString = DateSince(lastOnlineObject);

  const richPresenceEnabled =
    userPresenceType === PresenceType.InGame &&
    !isInGroup &&
    rootPlaceName &&
    rootPlaceName !== placeName;

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      userId,
      placeId,
      gameId,
      rootPlaceId,
      purchaseRequired,
      placePrice,
      isPresencePrivate: presencePrivate,
    });
  };

  return (
    <div
      id="friends-list-item-menu"
      onContextMenu={handleContextMenu}
      style={{ width: "100%", boxSizing: "border-box" }}
    >
      <div className="friendCategoryContainer friend-anim-enter-done">
        <div
          className={`friend ${PresenceTypesLookup[userPresenceType]} ${groupPosition && isInGroup ? groupPosition : null} 
        friendStatusHover Panel Focusable`}
        >
          {isInGroup && <div className="SteamPlayerGroupLines" />}
          {userPresence.placeId &&
          (userPresenceType === PresenceType.InGame ||
            userPresenceType === PresenceType.InStudio) &&
          !isInGroup ? (
            <a href={`https://www.roblox.com/games/${placeId}`} target="_top">
              <GamePopper
                placeId={placeDetails?.universeRootPlaceId}
                isInGroup={isInGroup}
              />
            </a>
          ) : (userPresenceType === PresenceType.InGame ||
              userPresenceType === PresenceType.InStudio) &&
            !isInGroup ? (
            <div className="FriendInGameIcon">
              <img className="gameIcon" src={unknownGameImage} alt="" />
            </div>
          ) : null}
          <div className="steamavatar_avatarHolder_1G7LI avatarHolder no-drag Medium">
            <div className="steamavatar_avatarStatus_1Pwr6 avatarStatus" />
            <a href={`/users/${userId}/profile`}>
              <div
                className="steamavatar_avatar_f2laR avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                <img
                  src={
                    userHeadshot ||
                    "https://t7.rbxcdn.com/180DAY-a17918617b20ac9c39b305241f23e58a"
                  }
                  alt=""
                  draggable="false"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </a>
          </div>
          <div
            className={`labelHolder ${!richPresenceEnabled ? "personanameandstatus_twoLine_2wZNn" : ""} ${PresenceTypesLookup[userPresenceType]}`}
          >
            <div
              className={`personanameandstatus_statusAndName_9U-hi ${
                richPresenceEnabled
                  ? "personanameandstatus_threeLines_2pPym"
                  : ""
              }`}
            >
              <div className="personanameandstatus_playerName_1uxaf">
                {combinedName}
                {username !== null && username !== combinedName ? (
                  <span className="personanameandstatus_playerNickname_3-32P">{`(@${username})`}</span>
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
                {userPresenceType === PresenceType.Offline && !lastOnline ? (
                  <span
                    title="We can only show “Last seen” after this user has been spotted online."
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: "1px solid currentColor",
                      fontSize: "12px",
                      lineHeight: "16px",
                      textAlign: "center",
                      marginLeft: "4px",
                      cursor: "help",
                      userSelect: "none",
                    }}
                  >
                    ?
                  </span>
                ) : null}
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
    </div>
  );
});
