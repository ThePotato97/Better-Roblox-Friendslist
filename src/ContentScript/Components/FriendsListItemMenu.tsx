import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { contextMenuAtom } from "@/src/atoms/contextMenu";
import { useAtom, useAtomValue } from "jotai";

const joinGame = (content: {
	action: string;
	rootPlaceId: number;
	placeId: number;
	gameId?: string;
	userId?: number;
}) => {
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

const FriendsListItemMenu = ({ children }: FriendsListItemMenuProps) => {
	const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);

	const menuRef = useRef<HTMLDivElement>(null);
	console.log("Menu ref:", menuRef);
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

	const gameId = contextMenu?.gameId;
	const rootPlaceId = contextMenu?.rootPlaceId;
	const purchaseRequired = contextMenu?.purchaseRequired;
	const placePrice = contextMenu?.placePrice;
	const isPresencePrivate = contextMenu?.isPresencePrivate;
	const userId = contextMenu?.userId;
	const placeId = contextMenu?.placeId;

	const handleOpenProfile = () => {
		window.location.href = `https://www.roblox.com/users/${userId}/profile`;
	};

	const handleJoinFriend = () => {
		if (purchaseRequired) {
			window.location.href = `https://www.roblox.com/games/${placeId}`;
			return;
		}

		if (!gameId || !rootPlaceId || !placeId || !userId) return;

		joinGame({
			action: "joinGame",
			rootPlaceId: rootPlaceId,
			placeId: placeId,
			gameId: gameId,
			userId: userId,
		});
	};

	const handleJoinGame = () => {
		if (!gameId || !rootPlaceId || !placeId || !userId) return;
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
	const closingRef = useRef(false);

	const handleClose = () => {
		closingRef.current = true;
		setContextMenu(null);
		setTimeout(() => {
			closingRef.current = false;
		}, 100); // allow reopening after menu has definitely closed
	};

	const placePriceDisplay = placePrice || 0;
	const portalRoot = window.portalRoot;
	console.log("Portal root:", portalRoot);
	return (
		<>
			<div id="friends-list-item-menu">
				{children}
				<Menu
					ref={menuRef}
					container={portalRoot}
					open={contextMenu !== null}
					onClose={handleClose}
					anchorReference="anchorPosition"
					onContextMenu={(e) => {
						e.preventDefault();
						setContextMenu(null);
					}}
					disableScrollLock={true}
					anchorPosition={
						contextMenu !== null
							? { top: contextMenu.mouseY, left: contextMenu.mouseX }
							: undefined
					}
				>
					<MenuItem onClick={handleOpenProfile}>View Profile</MenuItem>
					{!isPresencePrivate && (
						<MenuItem onClick={handleJoinFriend}>
							{purchaseRequired ? (
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
