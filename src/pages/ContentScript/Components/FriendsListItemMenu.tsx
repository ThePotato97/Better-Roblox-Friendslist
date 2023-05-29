import React, { Component, useState } from "react";
import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/core.css";

const joinGame = (content: { action: string; rootPlaceId: number; placeId: number; gameId?: string; userId?: number; }) => {
  const isFirefox = typeof InstallTrigger !== "undefined";
  if (isFirefox) {
    content = cloneInto(content, document.defaultView);
  }
  const event = new CustomEvent("RecieveContent", { detail: content });
  window.dispatchEvent(event);
};

interface FriendsListItemMenuProps {
  handleToggleMenu: (isOpen: boolean, x?: number, y?: number) => void;
  anchorPoint: { x: number; y: number };
  menuProps: { state: "open" | "closed" };
  userId: number;
  placeId: number;
  rootPlaceId: number;
  purchaseRequired: boolean;
  placePrice: number;
  isPlayEnabled: boolean;
  children: React.ReactNode;
  gameId: string;
}

const FriendsListItemMenu = ({ handleToggleMenu, anchorPoint, menuProps, userId, gameId, placeId, rootPlaceId, purchaseRequired, placePrice, isPlayEnabled, children }: FriendsListItemMenuProps) => {




  const handleOpenProfile = () => {
    window.location.href = `https://www.roblox.com/users/${userId}/profile`;
  };

  const handleJoinFriend = () => {
    if (purchaseRequired) {
      window.location.href = `https://www.roblox.com/games/${placeId}`;
      return;
    }

    joinGame({
      action: "joinGame",
      rootPlaceId: rootPlaceId,
      placeId: placeId,
      gameId: gameId,
      userId: userId,
    });
  };

  const handleJoinGame = () => {
    if (purchaseRequired) {
      window.location = `https://www.roblox.com/games/${placeId}`;
      return;
    }
    joinGame({
      action: "joinGame",
      rootPlaceId: rootPlaceId,
      placeId: placeId,
    });
  };

  const placePriceDisplay = placePrice || 0;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        handleToggleMenu(true, e.clientX, e.clientY);
      }}
    >
      {children}

      <ControlledMenu
        {...menuProps}
        anchorPoint={anchorPoint}
        onClose={() => handleToggleMenu(false)}
      >
        <MenuItem onClick={handleOpenProfile}>View Profile</MenuItem>
        {isPlayEnabled ? (
          <>
            <MenuItem onClick={handleJoinFriend}>
              {purchaseRequired ? (
                <span className="icon icon-robux-white-16x16" />
              ) : null}
              {purchaseRequired ? placePriceDisplay : "Join Friend"}
            </MenuItem>
            {purchaseRequired ? undefined : (
              <MenuItem onClick={handleJoinGame}>{"Launch Game"}</MenuItem>
            )}
          </>
        ) : null}
      </ControlledMenu>
    </div>
  );
};

export default FriendsListItemMenu;
