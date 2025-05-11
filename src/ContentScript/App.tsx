import React, { useState, useEffect, useMemo, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import {
	FriendsList,
	FriendsListItem,
	FriendsGroup,
} from "./Components/index.ts";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Collapse,
	Paper,
	Slide,
	Typography,
} from "@mui/material";
import extensionIcon from "../48.png";
import { FriendInfo } from "pages/Background";
import { JoinStatusCodes, PresenceTypes } from "../global.ts";
import {
	fetchFriends,
	fetchPlaceDetails,
	fetchThumbnails,
	fetchPresence,
	getUsersUseridFriendsResponse,
	gameMultiGetResponse,
} from "../apis/index.ts";
import { ThumbnailContext } from "./Context/Thumbnails.ts";
import { fetchUserInfo } from "../apis/fetchCurrentUserInfo.ts";
import FriendsListItemMenu from "./Components/FriendsListItemMenu.tsx";
import { useAtomValue, useSetAtom } from "jotai";
import { presenceAtom, updatePresenceBatch } from "../atoms/presenceAtom.ts";
import { placesAtom, updatePlacesBatch } from "../atoms/placesAtom.ts";
import {
	friendsAtom,
	groupsAtom,
	thumbnailsAtom,
	updateFriendsBatch,
	updateThumbnailsBatch,
} from "../atoms/index.ts";
import { getMissingThumbnails } from "../atoms/thumbnailsSelectors.ts";
import { getMissingPlacesDetails } from "../atoms/placeSelectors.ts";
import { getMissingPresence } from "../atoms/presenceSelector.ts";
import { useThumbnailStream } from "../hooks/useThumbnailStream.ts";

type friendItem = FriendInfo["friends"][0];

const sortFriendsAlphabet = (a: friendItem, b: friendItem) => {
	if (a.name < b.name) {
		return -1;
	}
	if (a.name > b.name) {
		return 1;
	}
	return 0;
};

const groupInfo: Record<
	number,
	{
		name: string;
		defaultGroupState: boolean;
		extraClasses: string;
		priority: number;
	}
> = {
	[PresenceTypes.IN_GAME]: {
		name: "In Game",
		defaultGroupState: true,
		extraClasses: "gameGroup OtherGamesGroup",
		priority: 0,
	},
	[PresenceTypes.IN_STUDIO]: {
		name: "In Studio",
		defaultGroupState: true,
		extraClasses: "gameGroup OtherGamesGroup",
		priority: 2,
	},
	[PresenceTypes.ONLINE]: {
		name: "Online",
		defaultGroupState: true,
		extraClasses: "onlineFriends",
		priority: 4,
	},
	[PresenceTypes.OFFLINE]: {
		name: "Offline",
		defaultGroupState: false,
		extraClasses: "offlineFriends",
		priority: 5,
	},
	[PresenceTypes.INVISIBLE]: {
		name: "Invisible",
		defaultGroupState: false,
		extraClasses: "offlineFriends",
		priority: 99,
	},
};

function getGroupPosition(total: number, position: number) {
	if (position === 0) {
		return "firstInGroup";
	}
	if (position === total - 1) {
		return "lastInGroup";
	}
	return "inGroup";
}

export const FriendList = () => {
	const friends = useAtomValue(friendsAtom);
	const presence = useAtomValue(presenceAtom);
	const placeDetails = useAtomValue(placesAtom);
	const thumbnails = useAtomValue(thumbnailsAtom);
	const groups = useAtomValue(groupsAtom);

	const [isListVisible, setListVisible] = useState<boolean>(
		JSON.parse(sessionStorage.getItem("showFriendsList") ?? "true"),
	);
	const [isExtensionActive, setExtensionActive] = useState<boolean>(
		true ||
			JSON.parse(sessionStorage.getItem("showFriendsExtension") ?? "true"),
	);

	// 1) initial + polling for friends
	useEffect(() => {
		async function reload() {
			const userInfo = await fetchUserInfo();

			await fetchFriends(109176680, (friends) => {
				updateFriendsBatch(friends);
			});
		}
		reload();
		const handle = setInterval(reload, 20_000);
		return () => clearInterval(handle);
	}, []);

	// fetch presence
	useEffect(() => {
		const updatePresence = async () => {
			const missingPresence = getMissingPresence(
				Object.values(friends).map((f) => f.userId),
			);
			if (missingPresence.length > 0) {
				fetchPresence(missingPresence, (newPresence) => {
					updatePresenceBatch(newPresence);
				});
			}
		};
		updatePresence();
	}, [friends]);

	useThumbnailStream(
		friends.map((f) => f.userId),
		"AvatarHeadShot",
		"150x150",
	);
	const placeIds = Object.values(placeDetails).map((p) => p.placeId);
	useThumbnailStream(placeIds, "GameThumbnail", "768x432");
	useThumbnailStream(placeIds, "PlaceIcon", "150x150");

	// fetch headshots
	useEffect(() => {
		const updateThumbnails = async () => {
			const missingThumbnails = getMissingThumbnails(
				friends.map((f) => f.userId),
				"AvatarHeadShot",
				"150x150",
			);
			if (missingThumbnails.length > 0) {
				const newThumbnails = await fetchThumbnails(
					missingThumbnails,
					"AvatarHeadShot",
					"150x150",
				);
				updateThumbnailsBatch(newThumbnails);
			}
		};
		updateThumbnails();
	}, [friends]);

	// fetch place icons
	useEffect(() => {
		const updatePlaces = async () => {
			const missingIcons = getMissingThumbnails(
				Object.values(placeDetails).map((p) => p.placeId),
				"PlaceIcon",
				"150x150",
			);
			if (missingIcons.length > 0) {
				const newIcons = await fetchThumbnails(
					missingIcons,
					"PlaceIcon",
					"150x150",
				);
				updateThumbnailsBatch(newIcons);
			}
		};
		updatePlaces();
	}, [placeDetails]);

	// fetch place thumbnails
	useEffect(() => {
		const updatePlaces = async () => {
			const missingIcons = getMissingThumbnails(
				Object.values(placeDetails).map((p) => p.placeId),
				"GameThumbnail",
				"768x432",
			);
			if (missingIcons.length > 0) {
				const newIcons = await fetchThumbnails(
					missingIcons,
					"GameThumbnail",
					"768x432",
				);
				updateThumbnailsBatch(newIcons);
			}
		};
		updatePlaces();
	}, [placeDetails]);

	// fetch place details
	useEffect(() => {
		const updatePlaces = async () => {
			const places = getMissingPlacesDetails(
				Object.values(presence).map((p) => p.placeId),
			);
			if (places.length > 0) {
				const placeDetails = await fetchPlaceDetails(places);
				updatePlacesBatch(placeDetails);
			}
			const rootplaces = getMissingPlacesDetails(places.map((p) => p));
			if (rootplaces.length > 0) {
				const rootPlaceDetails = await fetchPlaceDetails(rootplaces);
				updatePlacesBatch(rootPlaceDetails);
			}
		};
		updatePlaces();
	}, [presence]);

	useEffect(() => {
		const friendsListElement = document.querySelector(
			"#chat-container",
		)! as HTMLElement;
		if (friendsListElement) {
			friendsListElement.style.display = isExtensionActive ? "none" : "block";
		}
	}, [isListVisible]);

	// useEffect(() => {
	//   const getFriendsList = async () => {
	//     const userId = document.querySelector('meta[name=\'user-data\']')?.getAttribute('data-userid')
	//     if (!userId) {
	//       return;
	//     }
	//     const friendInfo = await getFriendInfo(userId);
	//     setPresence(friendInfo.presence);
	//     setPlaceDetails(friendInfo.placeDetails);
	//     setGroups(await getGroups(friendInfo));
	//   }
	//   const interval = setInterval(() => {
	//     console.log("Updated!");
	//     getFriendsList();
	//   }, 1000);
	//   return () => {
	//     clearInterval(interval);
	//   }
	// }, []);

	const handleToggleFriendsList = () => {
		setListVisible(!isListVisible);
		sessionStorage.setItem("showFriendsList", JSON.stringify(!isListVisible));
	};

	const handleToggleExtension = () => {
		const friendsListElement = document.querySelector("#chat-container")!;
		setExtensionActive(!isExtensionActive);
		sessionStorage.setItem(
			"showFriendsExtension",
			JSON.stringify(!isExtensionActive),
		);
		if (friendsListElement) {
			friendsListElement.style.display = !isExtensionActive ? "none" : "block";
		}
	};

	return (
		<>
			<FriendsListItemMenu />
			<Slide in={isExtensionActive} direction={"up"} appear>
				<Paper
					sx={{
						userSelect: "none",
						position: "fixed",
						bottom: 0,
						right: 0,
						width: "400px",
						zIndex: 1299,
						display: "flex",
						flexDirection: "column-reverse", // <-- yes, this stays here
						pointerEvents: "auto",
					}}
				>
					<Button
						disableRipple
						onClick={handleToggleFriendsList}
						sx={{
							width: "100%",
						}}
					>
						<div>Friends List</div>
					</Button>
					<Collapse unmountOnExit in={isListVisible}>
						<FriendsList>
							{presence !== null &&
								groups.length > 0 &&
								groups.map(({ id, friends, isGameGroup }) => {
									return (
										<FriendsGroup
											key={id}
											groupSize={friends.length}
											placeDetails={isGameGroup ? placeDetails?.[id] || {} : {}}
											groupName={isGameGroup ? undefined : groupInfo[id]?.name}
											placeId={isGameGroup ? id : undefined}
											defaultGroupState={groupInfo[id]?.defaultGroupState}
											extraClasses={groupInfo[id]?.extraClasses || "gameGroup"}
										>
											{friends.map((friend, index) => {
												const groupPosition = getGroupPosition(
													friends.length,
													index,
												);
												const friendPresence = presence[friend.userId] ?? {};
												return (
													<FriendsListItem
														key={friend.userId}
														userId={friend.userId}
														username={friend.username}
														displayName={friend.displayName}
														isInGroup={isGameGroup}
														groupPosition={groupPosition}
													/>
												);
											})}
										</FriendsGroup>
									);
								})}
						</FriendsList>
					</Collapse>
				</Paper>
			</Slide>

			{document.querySelector("#navbar-stream")
				? ReactDOM.createPortal(
						<li
							id="navbar-settings"
							className="cursor-pointer navbar-icon-item"
						>
							<span
								id="settings-icon"
								className="nav-settings-icon rbx-menu-item"
								onClick={handleToggleExtension}
								style={{
									width: "28px",
									height: "28px",
									marginTop: "5px",
									marginLeft: "6px",
									display: "block",
								}}
							>
								<span
									className="roblox-popover-close"
									id="nav-settings"
									style={{
										backgroundImage: `url(${extensionIcon})`,
										cursor: "pointer",
										filter: !isExtensionActive ? "grayscale(100%)" : "none",
										backgroundRepeat: "no-repeat",
										backgroundSize: "cover",
										width: "100%",
										height: "100%",
										display: "inline-block",
									}}
								/>
								<span className="notification-red notification nav-setting-highlight hidden">
									0
								</span>
							</span>
						</li>,
						document.querySelector("#navbar-stream").parentElement,
					)
				: null}
		</>
	);
};
