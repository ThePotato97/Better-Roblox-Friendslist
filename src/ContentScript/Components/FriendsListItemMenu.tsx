import React, { Component, useState } from "react";
import { Menu, MenuItem, MenuList } from "@mui/material"
//import { ControlledMenu, MenuItem } from "@szhsin/react-menu";
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
  menuProps: { state: "open" | "closed" };
  userId: number;
  placeId: number;
  rootPlaceId: number;
  purchaseRequired: boolean;
  placePrice: number;
  isPresencePrivate: boolean;
  isPlayEnabled: boolean;
  children: React.ReactNode;
  gameId: string;
}

const FriendsListItemMenu = ({ userId, gameId, placeId, rootPlaceId, purchaseRequired, placePrice, isPresencePrivate, children }: FriendsListItemMenuProps) => {


  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

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

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
        }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
        // Other native context menus might behave different.
        // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
        null,
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const placePriceDisplay = placePrice || 0;
  return (
    <>
      <div
        id="friends-list-item-menu"
        onContextMenu={handleContextMenu}
      >
        {children}
        <Menu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          disableScrollLock={true}
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={handleOpenProfile}>View Profile</MenuItem>
          {!isPresencePrivate ? (
            <div>
              <MenuItem onClick={handleJoinFriend}>
                {purchaseRequired ? (
                  <span className="icon icon-robux-white-16x16" />
                ) : null}
                {purchaseRequired ? placePriceDisplay : "Join Friend"}
              </MenuItem>
              <MenuItem onClick={handleJoinGame}>{"Launch Game"}</MenuItem>
            </div>
          ) : null}
        </Menu>
      </div>
    </>
  );
};

export default FriendsListItemMenu;
