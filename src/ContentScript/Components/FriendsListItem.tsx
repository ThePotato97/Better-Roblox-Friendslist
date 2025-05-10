import React, { useEffect, useState } from "react";
import DateSince from "../DateSince";
import { GamePopper } from "./GamePopper";
import { Fade } from "@mui/material";

import { FriendInfo } from "pages/Background";
import unknownGameImage from "../../unknowngame.png";
import { JoinStatusCodes } from "../../global";
import { fetchServerDetails } from "../../apis";
import { ThumbnailContext } from "../Context/Thumbnails";
import { useAtomValue, useSetAtom } from "jotai";
import FriendsListItemMenu from "./FriendsListItemMenu";
import { contextMenuAtom } from "@/src/atoms/contextMenu";
import { thumbnailsAtom } from "@/src/atoms/thumbnailsAtom";
import { getThumbnailRequestId, PresenceType } from "@/src/database/FriendsDB";
import { placesAtom, presenceAtom } from "@/src/atoms";

const PresenceTypesLookup = {
	0: "offline",
	1: "online",
	2: "ingame",
	3: "studio",
	4: "invisible",
};

interface FriendsListItemProps {
	userId: number;
	username: string;
	isInGroup: boolean;
	displayName: string;
	groupPosition: number;
}
export const FriendsListItem = function FriendsListItem({
	userId,
	username,
	isInGroup,
	groupPosition,
	displayName,
}: FriendsListItemProps) {
	const setContextMenu = useSetAtom(contextMenuAtom);
	const thumbnails = useAtomValue(thumbnailsAtom);
	const placeDetailsAtom = useAtomValue(placesAtom);
	const presence = useAtomValue(presenceAtom);

	const userPresence = presence[userId];
	const placeDetails = placeDetailsAtom[userId];

	console.log("thumbnails", thumbnails);
	const [serverDetails, setServerDetails] = useState<
		Exclude<FriendInfo["serverDetails"], null>[""]
	>({
		status: 1,
	});

	const [menuProps, setMenuProps] = useState<{ state: "open" | "closed" }>({
		state: "closed",
	});

	useEffect(() => {
		const getServerDetails = async () => {
			const { placeId, gameId, userPresenceType } = userPresence;

			if (userPresenceType === PresenceType.InGame) {
				const serverDetails = await fetchServerDetails(placeId, gameId);
				setServerDetails(serverDetails);
			}
		};
		getServerDetails();
	}, []);

	// const {
	// 	name,
	// 	displayName,
	// 	id: userId,
	// 	isInGroup,
	// 	groupPosition,
	// } = friendInfo;

	const { userPresenceType, lastOnline, placeId, gameId, rootPlaceId } =
		userPresence || {};

	const { name: placeName } = placeDetails || {};

	const rootPlaceDetails = placeDetailsAtom[rootPlaceId];

	const { name: rootPlaceName, description: rootPlaceDescription } =
		rootPlaceDetails || {};
	const { status } = serverDetails;

	const purchaseRequired = false;

	const presencePrivate = gameId === null;

	const getCurrentLocation = () => {
		switch (userPresenceType) {
			case PresenceType.Offline:
				return `Last online ${lastOnlineString}`;
			case PresenceType.Online:
				return "Online";
			case PresenceType.InGame:
				if (presencePrivate) return "In Game";
				if (isInGroup) {
					return placeName || rootPlaceName;
				} else {
					return rootPlaceName || placeName || "Loading...";
				}
			case PresenceType.InStudio:
				return rootPlaceName || placeName || "In Studio";
			default:
				return "Unknown";
		}
	};
	const isPlayEnabled = (() => {
		switch (userPresenceType) {
			case PresenceType.InGame:
				if (
					status === JoinStatusCodes.OK ||
					status === JoinStatusCodes.SERVER_FULL
				) {
					return true;
				} else {
					return false;
				}
			default:
				return false;
		}
	})();

	const lastOnlineObject = new Date(lastOnline ?? 0);

	const lastOnlineString = DateSince(lastOnlineObject);

	const richPresenceEnabled =
		userPresenceType === PresenceType.InGame &&
		!isInGroup &&
		rootPlaceName &&
		rootPlaceName !== placeName;

	const handleContextMenu = (event: React.MouseEvent) => {
		event.preventDefault();
		setContextMenu({
			mouseX: event.clientX + 2,
			mouseY: event.clientY - 6,
			userId,
			placeId,
			gameId,
			rootPlaceId,
			purchaseRequired,
			placePrice,
			isPresencePrivate: presencePrivate,
		});
	};

	return (
		<div id="friends-list-item-menu" onContextMenu={handleContextMenu}>
			<Fade in>
				<div className="friendCategoryContainer friend-anim-enter-done">
					<div
						className={`friend ${PresenceTypesLookup[userPresenceType]} ${groupPosition && isInGroup ? groupPosition : null} 
        friendStatusHover Panel Focusable`}
					>
						{isInGroup && <div className="SteamPlayerGroupLines" />}
						{presence.placeId &&
						(userPresenceType === PresenceType.InGame ||
							userPresenceType === PresenceType.InStudio) &&
						!isInGroup ? (
							<a href={`https://www.roblox.com/games/${placeId}`} target="_top">
								<GamePopper
									placeId={placeId}
									description={rootPlaceDescription || placeDetails.description}
									universeId={universeId}
									builder={rootPlaceDetails.builder || placeDetails.builder}
								/>
							</a>
						) : (userPresenceType === PresenceType.InGame ||
								userPresenceType === PresenceType.InStudio) &&
							!isInGroup ? (
							<div className="FriendInGameIcon">
								<img className="gameIcon" src={unknownGameImage} alt="" />
							</div>
						) : null}
						<div className="steamavatar_avatarHolder_1G7LI avatarHolder no-drag Medium">
							<div className="steamavatar_avatarStatus_1Pwr6 avatarStatus" />
							<a href={`/users/${userId}/profile`}>
								<img
									className="steamavatar_avatar_f2laR avatar"
									src={
										thumbnails && [
											thumbnails[
												getThumbnailRequestId(
													userId,
													"AvatarHeadShot",
													"150x150",
												)
											]?.imageUrl,
										]
									}
									alt=""
									draggable="false"
								/>
							</a>
						</div>
						<div
							className={`labelHolder ${!richPresenceEnabled ? "personanameandstatus_twoLine_2wZNn" : ""} ${PresenceTypesLookup[userPresenceType]}`}
						>
							<div
								className={`personanameandstatus_statusAndName_9U-hi ${
									richPresenceEnabled
										? "personanameandstatus_threeLines_2pPym"
										: ""
								}`}
							>
								<div className="personanameandstatus_playerName_1uxaf">
									{displayName}
									{name !== displayName ? (
										<span className="personanameandstatus_playerNickname_3-32P">{`(@${name})`}</span>
									) : null}
								</div>
								{isPlayEnabled ? (
									<div className="personastatusicons_Joinable" title="Joinable">
										<svg
											version="1.1"
											id="Layer_2"
											xmlns="http://www.w3.org/2000/svg"
											className="SVGIcon_Joinable"
											x="0px"
											y="0px"
											width="15px"
											height="15px"
											viewBox="0 0 448 512"
										>
											<path
												fill="currentColor"
												d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
											/>
										</svg>
									</div>
								) : null}
								<div
									className="ContextMenuButton"
									onClick={(e) => {
										// e.preventDefault();
										// handleToggleMenu(
										//   true,
										//   e.clientX + 2,
										//   e.clientY - 6
										// );
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="SVGIcon_Button SVGIcon_DownArrowContextMenu"
										data-name="Layer 1"
										viewBox="0 0 128 128"
										x="0px"
										y="0px"
									>
										<polygon points="50 59.49 13.21 22.89 4.74 31.39 50 76.41 95.26 31.39 86.79 22.89 50 59.49" />
									</svg>
								</div>
							</div>
							<div className="personanameandstatus_richPresenceContainer_21cNf">
								<div className="personanameandstatus_gameName_qvibF personanameandstatus_richPresenceLabel_3Q6g1 no-drag">
									{getCurrentLocation()}
								</div>
								{richPresenceEnabled ? (
									<div className="personanameandstatus_richPresenceLabel_3Q6g1 no-drag">
										{placeName}
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</Fade>
		</div>
	);
};
