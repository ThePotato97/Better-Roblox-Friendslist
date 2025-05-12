import { useState, useEffect, memo } from "react";
import ReactDOM from "react-dom";
import {
  FriendsListContainer,
  FriendsListItem,
  FriendsGroup,
} from "./Components/index.ts";
import { Button, Collapse, Paper, Slide } from "@mui/material";
import extensionIcon from "../48.png";
import { FriendInfo } from "pages/Background";
import { PresenceTypes } from "../global.ts";
import FriendsListItemMenu from "./Components/FriendsListItemMenu.tsx";
import { useAtomValue } from "jotai";
import { groupsAtom } from "../atoms/index.ts";
import { useLoadData } from "../hooks/useLoadData.ts";

const groupInfo: Record<
  number,
  {
    name: string;
    defaultGroupState: boolean;
    extraClasses: string;
    priority: number;
  }
> = {
  [PresenceTypes.IN_GAME]: {
    name: "In Game",
    defaultGroupState: true,
    extraClasses: "gameGroup OtherGamesGroup",
    priority: 0,
  },
  [PresenceTypes.IN_STUDIO]: {
    name: "In Studio",
    defaultGroupState: true,
    extraClasses: "gameGroup OtherGamesGroup",
    priority: 2,
  },
  [PresenceTypes.ONLINE]: {
    name: "Online",
    defaultGroupState: true,
    extraClasses: "onlineFriends",
    priority: 4,
  },
  [PresenceTypes.OFFLINE]: {
    name: "Offline",
    defaultGroupState: false,
    extraClasses: "offlineFriends",
    priority: 5,
  },
  [PresenceTypes.INVISIBLE]: {
    name: "Invisible",
    defaultGroupState: false,
    extraClasses: "offlineFriends",
    priority: 99,
  },
};

function getGroupPosition(total: number, position: number) {
  if (position === 0) {
    return "firstInGroup";
  }
  if (position === total - 1) {
    return "lastInGroup";
  }
  return "inGroup";
}

const MemoizedCollapse = memo(Collapse);
MemoizedCollapse.displayName = "MemoizedCollapse";
const MemoizedSlide = memo(Slide);
MemoizedSlide.displayName = "MemoizedSlide";
export const FriendList = memo(() => {
  console.log("rendering main");
  useLoadData();
  const groups = useAtomValue(groupsAtom);

  const [isListVisible, setListVisible] = useState<boolean>(
    JSON.parse(sessionStorage.getItem("showFriendsList") ?? "true"),
  );
  const [isExtensionActive, setExtensionActive] = useState<boolean>(
    JSON.parse(sessionStorage.getItem("showFriendsExtension") ?? "true"),
  );

  // const friendIds = useMemo(() => {
  //   return friends
  //     .map((f) => f.userId)
  //     .sort((a, b) => {
  //       const presenceA = presencePlaceFlags[a];
  //       const presenceB = presencePlaceFlags[b];
  //       return Number(presenceB) - Number(presenceA); // true first
  //     });
  // }, [presencePlaceFlags, friends]);

  useEffect(() => {
    const friendsListElement = document.querySelector(
      "#chat-container",
    )! as HTMLElement;
    if (friendsListElement) {
      friendsListElement.style.display = isExtensionActive ? "none" : "block";
    }
  }, [isExtensionActive, isListVisible]);

  const handleToggleFriendsList = () => {
    setListVisible(!isListVisible);
    sessionStorage.setItem("showFriendsList", JSON.stringify(!isListVisible));
  };

  const handleToggleExtension = () => {
    const friendsListElement = document.querySelector("#chat-container")!;
    setExtensionActive(!isExtensionActive);
    sessionStorage.setItem(
      "showFriendsExtension",
      JSON.stringify(!isExtensionActive),
    );
    if (friendsListElement) {
      friendsListElement.style.display = !isExtensionActive ? "none" : "block";
    }
  };
  interface MemoizedFriendItemsProps {
    friends: FriendInfo[];
    isInGroup: boolean;
  }
  const MemoizedFriendItems = memo(
    function MemoizedFriendItems({
      friends,
      isInGroup,
    }: MemoizedFriendItemsProps) {
      return (
        <>
          {friends.map((friend, index) => {
            const groupPosition =
              index === 0
                ? "firstInGroup"
                : index === friends.length - 1
                  ? "lastInGroup"
                  : "inGroup";

            return (
              <FriendsListItem
                key={friend.userId}
                userId={friend.userId}
                username={friend.username}
                displayName={friend.displayName}
                isInGroup={isInGroup}
                groupPosition={groupPosition}
              />
            );
          })}
        </>
      );
    },
    (prev, next) =>
      prev.isInGroup === next.isInGroup &&
      prev.friends.length === next.friends.length &&
      prev.friends.every((f, i) => f.userId === next.friends[i].userId),
  );
  return (
    <>
      <FriendsListItemMenu />
      <MemoizedSlide in={isExtensionActive} direction={"up"} appear>
        <Paper
          sx={{
            userSelect: "none",
            position: "fixed",
            bottom: 0,
            right: 0,
            width: "400px",
            zIndex: 1299,
            display: "flex",
            flexDirection: "column-reverse", // <-- yes, this stays here
            pointerEvents: "auto",
          }}
        >
          <Button
            disableRipple
            onClick={handleToggleFriendsList}
            sx={{
              width: "100%",
            }}
          >
            <div>Friends List</div>
          </Button>
          <MemoizedCollapse unmountOnExit in={isListVisible}>
            <FriendsListContainer>
              {groups.length > 0 &&
                groups.map(({ id, friends, isGameGroup }) => {
                  return (
                    <FriendsGroup
                      key={id}
                      groupSize={friends.length}
                      groupName={isGameGroup ? undefined : groupInfo[id]?.name}
                      placeId={isGameGroup ? id : undefined}
                      defaultGroupState={groupInfo[id]?.defaultGroupState}
                      extraClasses={groupInfo[id]?.extraClasses || "gameGroup"}
                    >
                      <MemoizedFriendItems
                        friends={friends}
                        isInGroup={!!isGameGroup}
                      />
                    </FriendsGroup>
                  );
                })}
            </FriendsListContainer>
          </MemoizedCollapse>
        </Paper>
      </MemoizedSlide>

      {document.querySelector("#navbar-stream")
        ? ReactDOM.createPortal(
            <li
              id="navbar-settings"
              className="cursor-pointer navbar-icon-item"
            >
              <span
                id="settings-icon"
                className="nav-settings-icon rbx-menu-item"
                onClick={handleToggleExtension}
                style={{
                  width: "28px",
                  height: "28px",
                  marginTop: "5px",
                  marginLeft: "6px",
                  display: "block",
                }}
              >
                <span
                  className="roblox-popover-close"
                  id="nav-settings"
                  style={{
                    backgroundImage: `url(${extensionIcon})`,
                    cursor: "pointer",
                    filter: !isExtensionActive ? "grayscale(100%)" : "none",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    width: "100%",
                    height: "100%",
                    display: "inline-block",
                  }}
                />
                <span className="notification-red notification nav-setting-highlight hidden">
                  0
                </span>
              </span>
            </li>,
            document.querySelector("#navbar-stream").parentElement,
          )
        : null}
    </>
  );
});

FriendList.displayName = "MainFriendList";
