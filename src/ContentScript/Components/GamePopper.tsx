import { useState, useEffect, memo } from "react";

import { createPortal } from "react-dom";

import { usePopper } from "react-popper";
import { useAtomValue } from "jotai";
import unknownGameImage from "../../unknowngame.png";
import { selectAtom } from "jotai/utils";
import {
  createThumbnailSelector,
  placeDetailsFamily,
  placesAtom,
  thumbnailFamily,
} from "@/src/atoms";

const intToString = (value) => {
  const suffixes = ["", "k", "m", "b", "t"];
  const suffixNum = Math.floor(("" + value).length / 3);
  let shortValue = Number.parseFloat(
    (suffixNum !== 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(
      2,
    ),
  );
  if (shortValue % 1 !== 0) {
    shortValue = shortValue.toFixed(1);
  }
  return shortValue + suffixes[suffixNum];
};

const cacheConcurrent: Record<number, string> = {};
const getPlacePlaying = (universeId: number): Promise<string> => {
  if (cacheConcurrent[universeId]) {
    return Promise.resolve(cacheConcurrent[universeId]);
  }
  return new Promise((resolve) => {
    fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`).then(
      (response) => {
        response.json().then((data) => {
          const placeInfo = data.data?.[0];
          if (placeInfo) {
            const shortened = intToString(placeInfo.playing);
            if (shortened) {
              cacheConcurrent[universeId] = shortened;
            }
            resolve(shortened);
          }
        });
      },
    );
  });
};

const cacheVotes: Record<number, number> = {};
const getPlaceVotes = (universeId: number): Promise<string> => {
  if (cacheVotes[universeId]) {
    return Promise.resolve(cacheVotes[universeId]);
  }
  return new Promise((resolve, reject) => {
    fetch(
      `https://games.roblox.com/v1/games/votes?universeIds=${universeId}`,
    ).then((response) =>
      response
        .json()
        .then((data) => {
          const placeVotes = data.data?.[0];
          if (placeVotes) {
            const { upVotes, downVotes } = placeVotes;
            const totalVotes = upVotes + downVotes;
            const percentage = Math.round((upVotes / totalVotes) * 100);
            cacheVotes[universeId] = percentage;
            resolve(`${percentage}`);
          }
        })
        .catch((err) => {
          reject(err);
        }),
    );
  });
};

interface GamePopperProps {
  placeId: number;
  isInGroup: boolean;
}

const createPlaceDetailsAtom = (placeId: number | undefined) =>
  selectAtom(placesAtom, (places) => (placeId ? places[placeId] : undefined));

export const GamePopper = memo(({ placeId, isInGroup }: GamePopperProps) => {
  const [votes, setVotes] = useState<string>("???");
  const [playing, setPlaying] = useState<string>("???");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showPopper, setPopperState] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );

  const [popperReady, setPopperReady] = useState(false);
  const [rootElement, setRootElement] = useState<HTMLElement>();

  const placeDetails = useAtomValue(placeDetailsFamily(placeId));

  const { universeId, builder, universeRootPlaceId } = placeDetails || {};

  const rootPlaceDetails = useAtomValue(
    placeDetailsFamily(universeRootPlaceId),
  );

  const { description } = rootPlaceDetails || {};

  const calculateResponsiveDimensions = () => {
    // Base size - original dimensions we want to preserve whenever possible
    const baseWidth = 390;
    const baseHeight = 390;
    const baseHeaderHeight = 217;
    const baseFooterHeight = 60;

    // Start with original size
    let responsiveWidth = baseWidth;

    // Only shrink when necessary to fit viewport (with some padding)
    // We subtract 100px for some buffer space from the edge of the viewport
    const availableWidth = windowWidth - 100;

    // If available width is less than our base width, scale down proportionally
    if (availableWidth < baseWidth) {
      responsiveWidth = availableWidth;
    }

    // Scale everything else proportionally to maintain aspect ratio
    const scale = responsiveWidth / baseWidth;
    const responsiveHeight = baseHeight * scale;
    const headerHeight = baseHeaderHeight * scale;
    const footerHeight = baseFooterHeight * scale;

    return {
      width: responsiveWidth,
      height: responsiveHeight,
      headerHeight,
      footerHeight,
      scale,
    };
  };

  const dimensions = calculateResponsiveDimensions();

  useEffect(() => {
    const root = (window as any).portalRoot ?? document.body;
    if (!root) return;
    setRootElement(root);

    // Add resize event listener
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const placeIconValueBig = useAtomValue(
    thumbnailFamily(
      universeRootPlaceId
        ? {
            id: universeRootPlaceId,
            type: "PlaceIcon",
            size: "150x150",
          }
        : undefined,
    ),
  );

  const placeIconValueSmall = useAtomValue(
    thumbnailFamily(
      universeRootPlaceId
        ? {
            id: universeRootPlaceId,
            type: "PlaceIcon",
            size: "50x50",
          }
        : undefined,
    ),
  );

  const gameThumbnailValue = useAtomValue(
    thumbnailFamily(
      universeRootPlaceId
        ? {
            id: universeRootPlaceId,
            type: "GameThumbnail",
            size: "768x432",
          }
        : undefined,
    ),
  );

  useEffect(() => {
    const root = (window as any).portalRoot ?? document.body;
    if (!root) return;
    setRootElement(root);
  }, []);

  const { styles, attributes, update } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: "left",

      modifiers: [
        {
          name: "preventOverflow",
          options: {
            rootBoundary: "viewport",
            padding: 8,
          },
        },
        {
          name: "offset",
          options: {
            offset: [0, 20],
          },
        },
      ],
    },
  );

  const handleMouseEnter = () => {
    console.log("handleMouseEnter");
    setPopperState(true);
    if (!universeId) return;
    getPlaceVotes(universeId).then((votes) => {
      setVotes(votes);
    });
    getPlacePlaying(universeId).then((visits) => {
      setPlaying(visits);
    });
  };

  useEffect(() => {
    if (showPopper && update) {
      setPopperReady(false);
      requestAnimationFrame(() => {
        console.log("update");
        update().then(() => setPopperReady(true));
      });
    }
  }, [showPopper, update]);

  const handleMouseLeave = () => {
    setPopperState(false);
  };
  const placeIconBig = placeIconValueBig?.imageUrl;
  const placeThumbnail = gameThumbnailValue?.imageUrl;
  const placeIconSmall = placeIconValueSmall?.imageUrl;
  return (
    <>
      {isInGroup ? (
        <div ref={setReferenceElement}>
          <img
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="groupIcon"
            src={placeIconSmall ?? unknownGameImage}
            alt=""
          />
        </div>
      ) : (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="FriendInGameIcon"
          ref={setReferenceElement}
        >
          <img
            className="gameIcon"
            src={placeIconSmall ?? unknownGameImage}
            alt=""
          />
        </div>
      )}

      {showPopper && rootElement
        ? createPortal(
            <div
              ref={setPopperElement}
              className={`game-popper-container ${showPopper ? "popper-open" : "popper-exit"}`}
              style={{
                ...styles.popper,
                zIndex: 9999,
                maxWidth: `${dimensions.width}px`,
                maxHeight: `${dimensions.height}px`,
              }}
              {...attributes.popper}
            >
              <div
                className="game-popper-container"
                style={{
                  overflow: "hidden",
                  height: `${dimensions.height}px`,
                  width: `${dimensions.width}px`,
                  background: "#2C2C2C",
                  borderRadius: "5px",
                }}
              >
                <div
                  className="game-popper-header"
                  style={{
                    height: `${dimensions.headerHeight}px`,
                    width: `${dimensions.width}px`,
                  }}
                >
                  <div
                    style={{
                      height: `${dimensions.headerHeight}px`,
                      width: `${dimensions.width}px`,
                      backgroundImage: `linear-gradient(transparent, black), url('${placeThumbnail}')`,
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                  <div
                    className="creator-name-popper"
                    style={{
                      color: "white",
                      position: "absolute",
                      top: `${165 * dimensions.scale}px`,
                      left: `${10 * dimensions.scale}px`,
                      fontSize: `${14 * dimensions.scale}px`,
                    }}
                  >
                    {`By ${builder}`}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: `${190 * dimensions.scale}px`,
                      left: `${5 * dimensions.scale}px`,
                      fontSize: `${12 * dimensions.scale}px`,
                    }}
                  >
                    <span
                      className="icon-popper icon-vote-popper"
                      style={{ transform: `scale(${dimensions.scale})` }}
                    />
                    <span className="count-label-popper">{`${votes || "??"}%`}</span>
                    <span
                      className="icon-popper icon-playing-popper"
                      style={{ transform: `scale(${dimensions.scale})` }}
                    />
                    <span className="count-label-popper">
                      {playing || "???"}
                    </span>
                  </div>
                </div>

                <div
                  className="icon-container-popper"
                  style={{
                    transform: `scale(${dimensions.scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <div
                    className="icon-container-popper icon-background-popper"
                    style={{ backgroundImage: `url(${placeIconBig})` }}
                  />
                  <div
                    className="icon-container-popper icon-foreground-popper"
                    style={{ backgroundImage: `url(${placeIconBig})` }}
                  />
                </div>

                <div
                  className="game-popper-footer"
                  style={{
                    height: `${dimensions.footerHeight}px`,
                    width: `${dimensions.width}px`,
                  }}
                >
                  <div>
                    <pre
                      style={{
                        color: "#C5C5C5",
                        overflow: "hidden",
                        padding: `${10 * dimensions.scale}px`,
                        fontSize: `${12 * dimensions.scale}px`,
                      }}
                      className="game-description-popper"
                    >
                      {description}
                    </pre>
                    <div className="game-description-after" />
                  </div>
                </div>
              </div>
            </div>,
            rootElement,
          )
        : null}
    </>
  );
});
GamePopper.displayName = "GamePopper";
