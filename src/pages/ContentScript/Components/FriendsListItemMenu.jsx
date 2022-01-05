import React, { useState, useEffect } from "react";
import { ControlledMenu, MenuItem, useMenuState } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/core.css";
import "./FriendsListItemMenu.scss";

const intToString = (value) => {
  const suffixes = ["", "k", "m", "b", "t"];
  const suffixNum = Math.floor(("" + value).length / 3);
  let shortValue = parseFloat((suffixNum !== 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(2));
  if (shortValue % 1 !== 0) {
    shortValue = shortValue.toFixed(1);
  }
  return shortValue + suffixes[suffixNum];
};

const getPlacePlaying = (universeId) => {
  return new Promise((resolve, reject) => {
    fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`).then((response) => {
      response.json().then((data) => {
        const placeInfo = data.data && data.data[0];
        if (placeInfo) {
          const shortened = intToString(placeInfo.playing);
          resolve(shortened);
        }
      });
    });
  });
};

const getPlaceVotes = (universeId) => {
  return new Promise((resolve, reject) => {
    fetch(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`).then((response) =>
      response
        .json()
        .then((data) => {
          const placeVotes = data.data && data.data[0];
          if (placeVotes) {
            const { upVotes, downVotes } = placeVotes;
            const totalVotes = upVotes + downVotes;
            const percentage = Math.round((upVotes / totalVotes) * 100);
            console.log("Percentage", percentage);
            resolve(percentage);
          }
        })
        .catch((err) => {
          reject(err);
        })
    );
  });
};

export default function FriendsListItemMenu(props) {
  const { toggleMenu, ...menuProps } = useMenuState();
  const [votes, setVotes] = useState([]);
  const [playing, setPlaying] = useState([]);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const { purchaseRequired, currentStatus, placePrice, placeId, userId, gameId, isPlayEnabled, universeId } = props;
  const placePriceDisplay = placePrice || 0;
  
  useEffect(() => {
    if (menuProps.state === "open" && placeId !== null) { 
      console.log("Mounted", placeId, menuProps.state);
      getPlaceVotes(universeId).then((votes) => {
        setVotes(votes);
      });
      getPlacePlaying(universeId).then((visits) => {
        setPlaying(visits);
      });
    }
  });

  const handleJoinGame = () => {
    let isFirefox = typeof InstallTrigger !== "undefined";
    if (purchaseRequired) {
      window.location = `https://www.roblox.com/games/${placeId}`;
      return;
    }
    console.log("Purchase Required", purchaseRequired);
    let content = {
      action: "joinGame",
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
