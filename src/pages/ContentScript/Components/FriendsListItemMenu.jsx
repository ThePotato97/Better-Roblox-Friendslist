import React, { useState } from "react";
import { ControlledMenu, MenuItem, useMenuState } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/core.css";
import "./FriendsListItemMenu.scss";



export default function FriendsListItemMenu(props) {
  const { toggleMenu, ...menuProps } = useMenuState();
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const {
    purchaseRequired,
    placePrice,
    placeId,
    userId,
    gameId,
    isPlayEnabled,
    rootPlaceId,
  } = props;
  const placePriceDisplay = placePrice || 0;

  const handleJoinGame = () => {
    let isFirefox = typeof InstallTrigger !== "undefined";
    if (purchaseRequired) {
      window.location = `https://www.roblox.com/games/${placeId}`;
      return;
    }
    console.log("Purchase Required", purchaseRequired);
    let content = {
      action: "joinGame",
      rootPlaceId: rootPlaceId,
      placeId: placeId,
      gameId: gameId,
      userId: userId,
    };
    if (isFirefox) {
      content = cloneInto(content, document.defaultView);
    }
    const event = new CustomEvent("RecieveContent", { detail: content });
    window.dispatchEvent(event);
  };
  const handleOpenProfile = () => {
    window.location = `https://www.roblox.com/users/${userId}/profile`;
  };
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setAnchorPoint({ x: e.clientX, y: e.clientY });
        toggleMenu(true);
      }}
    >
      {props.children}

      <ControlledMenu {...menuProps} anchorPoint={anchorPoint} onClose={() => toggleMenu(false)}>
        <MenuItem onClick={handleOpenProfile}>View Profile</MenuItem>
        {isPlayEnabled ? (
          <MenuItem onClick={handleJoinGame}>
            {purchaseRequired ? <span className="icon icon-robux-white-16x16" /> : null}

            {purchaseRequired ? placePriceDisplay : "Join"}
          </MenuItem>
        ) : null}
      </ControlledMenu>
    </div>
  );
}
