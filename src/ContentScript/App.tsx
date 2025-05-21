import { useState, useEffect, memo, Fragment } from "react";
import ReactDOM from "react-dom";
import {
  FriendsListContainer,
  FriendsListItem,
  FriendsGroup,
} from "./Components/index.ts";
import { GroupedVirtuoso } from "react-virtuoso";
import { Box, Button, Collapse, Paper, Slide } from "@mui/material";
import extensionIcon from "../Icon48x.png";
import { FriendInfo } from "pages/Background";
import { PresenceTypes } from "../global.ts";
import FriendsListItemMenu from "./Components/FriendsListItemMenu.tsx";
import { getDefaultStore, useAtomValue } from "jotai";
import { groupsAtom } from "../atoms";
import { useLoadData } from "../hooks/useLoadData.ts";
import { useAtomsDevtools } from "jotai-devtools";

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

const PresenceTypesLookup: Record<number, string> = {
  0: "offline",
  1: "online",
  2: "ingame",
  3: "studio",
  4: "invisible",
};

interface NullRendererProps {
  children?: React.ReactNode;
}

const NullRenderer = (props: NullRendererProps) => {
  return props.children;
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

interface FriendListProps {
  framed: boolean;
}

const MemoizedCollapse = memo(Collapse);
MemoizedCollapse.displayName = "MemoizedCollapse";
const MemoizedSlide = memo(Slide);
MemoizedSlide.displayName = "MemoizedSlide";
export const FriendList = memo(({ framed }: FriendListProps) => {
  useLoadData();
  const groupsFromAtom = useAtomValue(groupsAtom);

  const [isListVisible, setListVisible] = useState<boolean>(
    JSON.parse(localStorage.getItem("showFriendsList") ?? "true"),
  );
  const [isExtensionActive, setExtensionActive] = useState<boolean>(
    JSON.parse(localStorage.getItem("showFriendsExtension") ?? "true"),
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
    localStorage.setItem("showFriendsList", JSON.stringify(!isListVisible));
  };

  const handleToggleExtension = () => {
    chrome.runtime.sendMessage({ type: "open_side_panel" });
    const friendsListElement = document.querySelector("#chat-container")!;
    setExtensionActive(!isExtensionActive);
    localStorage.setItem(
      "showFriendsExtension",
      JSON.stringify(!isExtensionActive),
    );
    if (friendsListElement) {
      friendsListElement.style.display = !isExtensionActive ? "none" : "block";
    }
  };

  const [expandedGroupIds, setExpandedGroupIds] = useState<
    Record<string | number, boolean>
  >(() => {
    const initial: Record<string | number, boolean> = {};
    groupsFromAtom.forEach((g) => {
      initial[g.id] = groupInfo[g.id]?.defaultGroupState ?? true;
    });
    return initial;
  });

  // ONLY compute how many items each group has; no cloning
  const groupCounts = useMemo(
    () =>
      groupsFromAtom.map((g) =>
        expandedGroupIds[g.id] ? g.friends.length : 0,
      ),
    [expandedGroupIds, groupsFromAtom],
  );

  const flatGroup = useMemo(
    () =>
      groupsFromAtom
        .filter((g) => expandedGroupIds[g.id])
        .flatMap((g) => g.friends),
    [expandedGroupIds, groupsFromAtom],
  );

  const flatGroupKeys = useMemo(() => {
    const keys: (string | number)[] = [];

    for (const group of groupsFromAtom) {
      keys.push(`group-${group.id}-${group.isGameGroup}`);

      // Expanded friends' keys
      if (expandedGroupIds[group.id]) {
        for (const friend of group.friends) {
          keys.push(`friend-${friend.userId}`);
        }
      }
    }

    return keys;
  }, [groupsFromAtom, expandedGroupIds]);

  const handleToggleGroup = useCallback(
    (groupId: string | number, enabled: boolean) => {
      setExpandedGroupIds((prev) => ({
        ...prev,
        [groupId]: enabled,
      }));
    },
    [setExpandedGroupIds],
  );

  const friendsListContainer = useMemo(() => {
    return (
      <>
        {groupsFromAtom.length > 0 && (
          <GroupedVirtuoso
            computeItemKey={(itemIndex) => {
              const groupKey = flatGroupKeys[itemIndex];
              return groupKey ?? itemIndex;
            }}
            components={{
              TopItemList: NullRenderer,
            }}
            style={{ height: "100%", width: "100%" }} // Example dimensions
            groupCounts={groupCounts}
            groupContent={(index) => {
              const group = groupsFromAtom[index];

              if (!group) return null;

              return (
                <FriendsGroup
                  key={group.id}
                  groupSize={group.friends.length}
                  groupName={
                    group.isGameGroup ? undefined : groupInfo[group.id]?.name
                  }
                  groupId={group.id}
                  onToggleGroup={handleToggleGroup}
                  placeId={group.isGameGroup ? group.id : undefined}
                  defaultGroupState={groupInfo[group.id]?.defaultGroupState}
                  indexName={
                    group.isGameGroup
                      ? `group_state_${group.id} : undefined}`
                      : undefined
                  }
                  extraClasses={
                    groupInfo[group.id]?.extraClasses || "gameGroup"
                  }
                />
              );
            }}
            itemContent={(itemIndex, groupIndex) => {
              const group = groupsFromAtom[groupIndex];
              let friend = flatGroup[itemIndex];

              friend = friend ?? {
                username: `No friend found at index ${groupIndex}/${itemIndex}`,
              };
              const groupTypeSpecificClass = group.isGameGroup
                ? groupInfo[group.id]?.extraClasses ||
                  "gameGroup OtherGamesGroup"
                : groupInfo[group.id]?.extraClasses || "";

              let PADDING_LEFT_FOR_ITEM_WRAPPER = "12px"; // Default from .friendGroup .friend
              if (group.isGameGroup) {
                PADDING_LEFT_FOR_ITEM_WRAPPER = "44px";
              }

              const friendStatusClass =
                PresenceTypesLookup[group.id] ?? "ingame";

              const itemRowClasses = `virtual-friend-item-row friend ${groupTypeSpecificClass} ${friendStatusClass}`;

              const itemInlineStyles: React.CSSProperties = {
                minHeight: "38px",
                display: "flex",
                paddingTop: "2px",
                paddingBottom: "2px",
                paddingLeft: PADDING_LEFT_FOR_ITEM_WRAPPER, // Apply calculated left padding
                paddingRight: "0", // From original rule
                marginTop: "2px",
                marginBottom: "2px",
              };

              return (
                <div
                  key={friend.userId}
                  className={itemRowClasses}
                  style={itemInlineStyles}
                >
                  <FriendsListItem
                    key={friend.userId}
                    userId={friend.userId}
                    username={friend.username}
                    isInGroup={!!group.isGameGroup}
                    groupPosition={friend.groupPosition}
                  />
                </div>
              );
            }}
          />
        )}
      </>
    );
  }, [
    groupsFromAtom,
    groupCounts,
    flatGroupKeys,
    handleToggleGroup,
    flatGroup,
  ]);

  if (framed !== true)
    return (
      <>
        <FriendsListItemMenu />
        <Paper
          sx={{
            fontFamily: "'Motiva Sans', Arial, Helvetica, sans-serif",
            userSelect: "none",
            position: "fixed",
            bottom: 0,
            right: 0,
            height: "100%",
            width: "100%",
            zIndex: 1299,
            display: "flex",
            flexDirection: "column-reverse", // <-- yes, this stays here
            pointerEvents: "auto",
          }}
        >
          {friendsListContainer}
        </Paper>
      </>
    );

  return (
    <>
      {/* <FriendsListItemMenu />
      <MemoizedSlide in={isExtensionActive} direction={"up"} appear>
        <Paper
          sx={{
            fontFamily: "'Motiva Sans', Arial, Helvetica, sans-serif",
            userSelect: "none",
            position: "fixed",
            bottom: 0,
            right: 0,
            width: "400px",
            zIndex: 1299,
            display: "flex",
            flexDirection: "column", // <-- yes, this stays here
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
          <MemoizedCollapse
            in={isListVisible}
            unmountOnExit
            collapsedSize={0}
            sx={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "80vh", // only here, so Collapse can animate
                width: "100%",
                overflowY: "auto", // scroll your list
              }}
            >
              {friendsListContainer}
            </Box>
          </MemoizedCollapse>
        </Paper>
      </MemoizedSlide> */}

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
                    filter: "none",
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
