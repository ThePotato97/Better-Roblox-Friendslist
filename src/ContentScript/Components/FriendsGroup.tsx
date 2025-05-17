import React, { memo, useState } from "react";
import { Collapse } from "@mui/material";
import { GamePopper } from "./GamePopper";
import FriendsGroupMenu from "./FriendsGroupMenu";

import { useAtomValue } from "jotai";
import { placeDetailsFamily } from "@/src/atoms";

interface FriendsGroupProps {
  defaultGroupState: boolean;
  indexName?: string;
  groupSize: number;
  extraClasses?: string;
  groupId: string | number;
  onToggleGroup: (groupId: string | number, enabled: boolean) => void;
  placeId?: number;
  groupName?: string;
  children?: React.ReactNode;
  onClick?: (enabled: boolean) => void;
}

const MemoizedCollapse = memo(Collapse);
MemoizedCollapse.displayName = "MemoizedCollapse";

function FriendsGroupComponent({
  groupSize,
  extraClasses,
  placeId,
  groupName,
  groupId,
  onToggleGroup,
  defaultGroupState,
  indexName,
  onClick,
}: FriendsGroupProps) {
  const [showGroup, setShowGroup] = useState(defaultGroupState);

  const handleClick = useCallback(
    (enabled: boolean) => {
      onToggleGroup(groupId, enabled);
    },
    [onToggleGroup, groupId],
  );

  const handleToggleGroup = () => {
    if (indexName) {
      const groupStates = JSON.parse(
        localStorage.getItem("groupStates") ?? "{}",
      );
      groupStates[indexName] = !showGroup;
      localStorage.setItem("groupStates", JSON.stringify(groupStates));
    }
    setShowGroup((prevState) => {
      handleClick(!prevState);
      return !prevState;
    });
  };

  const placeDetails = useAtomValue(placeDetailsFamily(placeId));

  const { universeId, description, builder, name } = placeDetails ?? {
    name: "Loading...",
    description: "Loading...",
    builder: "Loading...",
  };

  return (
    <div className={`DropTarget friendGroup ${extraClasses ?? ""}`}>
      <div
        className="groupHeaderContainer Panel Focusable"
        onClick={handleToggleGroup}
      >
        <div
          className={`groupName ${!showGroup && "Collapsed"} Panel Focusable`}
          tabIndex={0}
        >
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
              <circle
                fill="none"
                strokeWidth="10"
                strokeMiterlimit="10"
                cx="128"
                cy="128"
                r="95.333"
              />
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
          {placeId ? (
            <a
              href={`https://www.roblox.com/games/${placeId}`}
              target="_top"
              onClick={(e) => {
                if (chrome.tabs) {
                  e.preventDefault();
                  chrome.tabs.update({
                    url: `https://www.roblox.com/games/${placeId}`,
                  });
                }
              }}
            >
              <GamePopper placeId={placeId} isInGroup />
            </a>
          ) : null}
          {groupName || name}
          <span className={`groupCount ${!showGroup && "collapsed"} `}>
            {groupSize}
          </span>
        </div>
      </div>
      {/* <MemoizedCollapse unmountOnExit in={showGroup}>
        <div className="groupList">{props.children}</div>
      </MemoizedCollapse> */}
    </div>
  );
}

export const FriendsGroup = memo(FriendsGroupComponent);
