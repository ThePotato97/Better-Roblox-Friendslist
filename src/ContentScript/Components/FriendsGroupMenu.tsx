import React, { useState, useEffect } from "react";
import { ControlledMenu, MenuItem, useMenuState } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/core.css";

const intToString = (value: number): string => {
  const suffixes = ["", "k", "m", "b", "t"];
  const suffixNum = Math.floor(("" + value).length / 3);
  let shortValue = parseFloat(
    (suffixNum !== 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(
      2,
    ),
  );
  if (shortValue % 1 !== 0) {
    shortValue = parseFloat(shortValue.toFixed(1));
  }
  return shortValue + suffixes[suffixNum];
};

const getPlacePlaying = async (
  universeId: number,
): Promise<string | undefined> => {
  const res = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`,
  );
  const data = await res.json();
  const placeInfo = data.data?.[0];
  return placeInfo ? intToString(placeInfo.playing) : undefined;
};

const getPlaceVotes = async (
  universeId: number,
): Promise<number | undefined> => {
  const res = await fetch(
    `https://games.roblox.com/v1/games/votes?universeIds=${universeId}`,
  );
  const data = await res.json();
  const placeVotes = data.data?.[0];
  if (placeVotes) {
    const { upVotes, downVotes } = placeVotes;
    const total = upVotes + downVotes;
    return total > 0 ? Math.round((upVotes / total) * 100) : undefined;
  }
};

export default function FriendsGroupMenu(props: {
  placeId?: number;
  universeId?: number;
  children: React.ReactNode;
}) {
  console.log("Menu Refresh");
  const { placeId, universeId, children } = props;

  const { toggleMenu, ...menuProps } = useMenuState();
  const [votes, setVotes] = useState<number | undefined>();
  const [playing, setPlaying] = useState<string | undefined>();
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (menuProps.state === "open" && universeId) {
      getPlaceVotes(universeId)
        .then(setVotes)
        .catch(() => setVotes(undefined));
      getPlacePlaying(universeId)
        .then(setPlaying)
        .catch(() => setPlaying(undefined));
    }
  }, [menuProps.state, universeId]);

  const handleViewPlace = () => {
    if (placeId) {
      window.location.href = `/games/${placeId}`;
    }
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setAnchorPoint({ x: e.clientX, y: e.clientY });
        toggleMenu(true);
      }}
    >
      {children}

      <ControlledMenu
        {...menuProps}
        anchorPoint={anchorPoint}
        onClose={() => toggleMenu(false)}
      >
        {placeId && (
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
              <span className="info-label vote-percentage-label">
                {votes ?? "??"}%
              </span>
              <span className="info-label icon-playing-counts-gray" />
              <span className="info-label playing-counts-label">
                {playing ?? "???"}
              </span>
            </div>
          </div>
        )}

        <MenuItem className="view-game-button" onClick={handleViewPlace}>
          View Game
        </MenuItem>
      </ControlledMenu>
    </div>
  );
}
