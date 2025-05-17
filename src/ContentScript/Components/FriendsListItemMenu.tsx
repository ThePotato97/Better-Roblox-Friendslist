import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { contextMenuAtom } from "@/src/atoms";
import { useAtom } from "jotai";

const joinGameFriend = (userId: number) => {
  if (chrome.tabs) {
    chrome.tabs.update({ url: `roblox://experiences/start?userId=${userId}` });
  } else {
    window.location.href = `roblox://experiences/start?userId=${userId}`;
  }
};

const joinGame = (placeId: number) => {
  if (chrome.tabs) {
    chrome.tabs.update({
      url: `roblox://experiences/start?placeId=${placeId}`,
    });
  } else {
    window.location.href = `roblox://experiences/start?placeId=${placeId}`;
  }
};

interface FriendsListItemMenuProps {
  children?: React.ReactNode;
}

const FriendsListItemMenu = ({ children }: FriendsListItemMenuProps) => {
  const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);

  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const menuSnapshot = useRef(contextMenu);

  useEffect(() => {
    if (contextMenu) {
      menuSnapshot.current = contextMenu;
      setOpen(true);
    }
  }, [contextMenu]);

  useEffect(() => {
    const menuRoot = menuRef.current?.parentElement;
    if (menuRoot) {
      console.log("Menu portal parent:", menuRoot);
      console.log(
        "Is inside shadow DOM:",
        menuRoot.getRootNode() instanceof ShadowRoot,
      );
    } else {
      console.warn("Menu ref not attached yet.");
    }
  }, []);
  const {
    gameId,
    rootPlaceId,
    placeId,
    userId,
    purchaseRequired,
    placePrice,
    isPresencePrivate,
    mouseX,
    mouseY,
  } = menuSnapshot.current || {};

  const handleOpenProfile = () => {
    if (chrome.tabs) {
      chrome.tabs.update({
        url: `https://www.roblox.com/users/${userId}/profile`,
      });
    } else {
      window.location.href = `https://www.roblox.com/users/${userId}/profile`;
    }
  };

  const handleJoinFriend = () => {
    if (purchaseRequired) {
      chrome.tabs.update({ url: `https://www.roblox.com/games/${placeId}` });
      return;
    }

    if (!gameId || !rootPlaceId || !placeId || !userId) return;

    joinGameFriend(userId);
  };

  const handleJoinGame = () => {
    if (!gameId || !rootPlaceId || !placeId || !userId) return;
    if (purchaseRequired) {
      window.location.href = `https://www.roblox.com/games/${placeId}`;
      return;
    }
    joinGame(userId);
  };
  const closingRef = useRef(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleExited = () => {
    closingRef.current = true;
    setContextMenu(null);
    setTimeout(() => {
      closingRef.current = false;
    }, 100); // allow reopening after menu has definitely closed
  };

  const placePriceDisplay = placePrice || 0;
  const portalRoot = (window as any).interactiveLayer;

  return (
    <>
      <div id="friends-list-item-menu">
        {children}
        <Menu
          ref={menuRef}
          container={portalRoot}
          open={open}
          slotProps={{
            transition: {
              onExited: handleExited,
            },
          }}
          onClose={handleClose}
          anchorReference="anchorPosition"
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
          disableScrollLock={true}
          anchorPosition={
            contextMenu !== null && mouseX !== undefined && mouseY !== undefined
              ? { top: mouseY, left: mouseX }
              : undefined
          }
        >
          <MenuItem onClick={handleOpenProfile}>View Profile</MenuItem>
          {!isPresencePrivate && (
            <MenuItem onClick={handleJoinFriend}>
              {purchaseRequired !== undefined && purchaseRequired ? (
                <span className="icon icon-robux-white-16x16" />
              ) : null}
              {purchaseRequired ? placePriceDisplay : "Join Friend"}
            </MenuItem>
          )}
          {!isPresencePrivate && (
            <MenuItem onClick={handleJoinGame}>Launch Game</MenuItem>
          )}
        </Menu>
      </div>
    </>
  );
};

export default React.memo(FriendsListItemMenu);
