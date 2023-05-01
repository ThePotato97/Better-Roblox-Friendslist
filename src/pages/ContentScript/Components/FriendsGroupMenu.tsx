import React, { useState, useEffect } from "react";
import { ControlledMenu, MenuItem, useMenuState } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/core.css";

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
  return new Promise((resolve) => {
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
            resolve(percentage);
          }
        })
        .catch((err) => {
          reject(err);
        })
    );
  });
};

export default function FriendsGroupMenu(props) {
  const { placeId, universeId } = props;
  if (placeId) {
    const { toggleMenu, ...menuProps } = useMenuState();
    const [votes, setVotes] = useState([]);
    const [playing, setPlaying] = useState([]);
    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });

    useEffect(() => {
      if (menuProps.state === "open" && universeId) {
        getPlaceVotes(universeId).then((votes) => {
          setVotes(votes);
        });
        getPlacePlaying(universeId).then((visits) => {
          setPlaying(visits);
        });
      }
    });

    const handleViewPlace = () => {
      window.location = `/games/${placeId}`;
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
          <div>
            <div
              style={{
                height: "120px",
                width: "205px",
                backgroundImage: `linear-gradient(transparent, black), url('https://www.roblox.com/asset-thumbnail/image?assetId=${placeId}&width=256&height=144&format=png')`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
              }}
            />
            <div style={{ position: "absolute", bottom: "45px", left: "5px" }}>
              <span className="info-label icon-votes-gray" />
              <span className="info-label vote-percentage-label">{`${votes || "??"}%`}</span>
              <span className="info-label icon-playing-counts-gray" />
              <span className="info-label playing-counts-label">{playing || "???"}</span>
            </div>
          </div>

          <MenuItem className="view-game-button" style={{ align: "center" }} onClick={handleViewPlace}>
            View Game
          </MenuItem>
        </ControlledMenu>
      </div>
    );
  } else {
    return props.children;
  }
}
