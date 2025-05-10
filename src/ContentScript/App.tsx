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

interface IGroup {
	name: string;
	placeId?: number;
	indexName: string;
	friends: friendItem[];
	isGroup?: boolean;
	gameGroups?: boolean;
	defaultGroupState: boolean;
	extraClasses: string;
	disableAvatarGameIcons?: boolean;
}

const getGroups = async (friendInfo: FriendInfo | undefined) => {
	if (!friendInfo) return [];
	const groupStates = {} || (await chrome.storage.local.get("groupStates"));
	const { presence, friends } = friendInfo;
	if (!friends || !presence) return [];
	const rootPlaceIds = friends.map((f) => presence[f.id].rootPlaceId);

	const duplicates = rootPlaceIds.filter(
		(id, index) => rootPlaceIds.indexOf(id) !== index && id !== null,
	);
	const sortedFriendsList = friends.sort(sortFriendsAlphabet);
	const newGroups: IGroup[] = [
		{
			name: "In Game",
			indexName: "ingame",
			friends: sortedFriendsList
				.filter((f) => {
					const userPresence = presence[f.id];
					return (
						userPresence.userPresenceType === PresenceTypes.IN_GAME &&
						!duplicates.includes(userPresence.rootPlaceId)
					);
				})
				.sort((a: friendItem, b: friendItem) => {
					const { placeId: aPlace, gameId: aGameId } = presence[a.id] ?? {};
					const { placeId: bPlace, gameId: bGameId } = presence[b.id] ?? {};

					// const aServerDetails = serverDetails[aGameId];
					// const bServerDetails = 0
					// const aStatus = aServerDetails?.status;
					// const bStatus = bServerDetails?.status;

					const aIsJoinable =
						true ||
						aStatus === JoinStatusCodes.OK ||
						aStatus === JoinStatusCodes.SERVER_FULL;
					const bIsJoinable =
						true ||
						bStatus === JoinStatusCodes.OK ||
						bStatus === JoinStatusCodes.SERVER_FULL;

					if (aIsJoinable && !bIsJoinable) {
						return -1;
					} else if (!aIsJoinable && bIsJoinable) {
						return 1;
					} else if (aPlace && !bPlace) {
						return -1;
					} else if (!aPlace && bPlace) {
						return 1;
					} else {
						return 0;
					}
				}),
			defaultGroupState: groupStates.ingame ?? true,
			extraClasses: "gameGroup OtherGamesGroup",
		},
		{
			name: "In Studio",
			indexName: "studio",
			friends: sortedFriendsList.filter((f) => {
				const userPresence = presence[f.id];
				return userPresence.userPresenceType === PresenceTypes.IN_STUDIO;
			}),
			defaultGroupState: groupStates.studio ?? true,
			extraClasses: "gameGroup OtherGamesGroup",
		},
		{
			name: "Online",
			indexName: "online",
			friends: sortedFriendsList.filter((f) => {
				const userPresence = presence[f.id];
				return userPresence.userPresenceType === PresenceTypes.ONLINE;
			}),
			defaultGroupState: groupStates.online ?? true,
			extraClasses: "onlineFriends",
		},
		{
			name: "Offline",
			indexName: "offline",
			friends: sortedFriendsList
				.filter((f) => {
					const userPresence = presence[f.id];
					return userPresence.userPresenceType === PresenceTypes.OFFLINE;
				})
				.sort((a, b) => {
					const userPresenceA = presence[a.id];
					const userPresenceB = presence[b.id];
					const aDate = new Date(userPresenceA.lastOnline);
					const bDate = new Date(userPresenceB.lastOnline);
					return bDate.getTime() - aDate.getTime();
				}),
			defaultGroupState: groupStates.offline ?? true,
			extraClasses: "offlineFriends",
		},
	];
	const groupedFriends = Object.entries(
		sortedFriendsList
			.filter((f) => {
				const userPresence = presence[f.id];
				return duplicates.includes(userPresence.rootPlaceId);
			})
			.reduce(
				(acc, f) => {
					const userPresence = presence[f.id];
					acc[userPresence.rootPlaceId] = acc[userPresence.rootPlaceId] || [];
					acc[userPresence.rootPlaceId].push(f);
					return acc;
				},
				{} as Record<number, friendItem[]>,
			),
	).map(([placeId, group]) => {
		return {
			placeId: placeId,
			friends: group.sort((a, b) => {
				const userPresenceA = presence[a.id];
				const userPresenceB = presence[b.id];
				const aGameId = userPresenceA.gameId;
				const bGameId = userPresenceB.gameId;
				return aGameId === bGameId ? 0 : -1;
			}),
			gameGroups: !0,
			disableAvatarGameIcons: !0,
			defaultGroupState: !0,
			extraClasses: "gameGroup",
		};
	});
	newGroups.unshift(...groupedFriends);
	return newGroups;
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

const getPlaces = (
	presence: Exclude<FriendInfo["presence"], null>,
): Set<number> => {
	return Object.values(presence).reduce((acc, currPresence) => {
		if (currPresence.placeId) {
			acc.add(currPresence.placeId);
		}
		if (currPresence.rootPlaceId) {
			acc.add(currPresence.rootPlaceId);
		}
		return acc;
	}, new Set<number>());
};

interface FriendGroup {
	friends: getUsersUseridFriendsResponse["data"][0][];
	isGameGroup: boolean;
	id: number;
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

	// 1) initial + polling for friends & presence
	useEffect(() => {
		async function reload() {
			const userInfo = await fetchUserInfo();
			const friendList = await fetchFriends(userInfo.id);
			const presList = await fetchPresence(
				friendList.map((f) => f.userId),
				userInfo.id,
			);

			updateFriendsBatch(friendList);
			updatePresenceBatch(presList);
		}
		reload();
		const handle = setInterval(reload, 5_000);
		return () => clearInterval(handle);
	}, []);

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
						left: 0,
						width: "400px",
						zIndex: 999,
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
											{friends.map((friend) => {
												const friendPresence = presence[friend.userId] ?? {};
												const placeDetail =
													placeDetails?.[friendPresence.placeId] || {};
												const rootPlaceDetail =
													placeDetails?.[friendPresence.rootPlaceId] ?? {};
												return (
													<FriendsListItem
														key={friend.userId}
														userId={friend.userId}
														username={friend.username}
														displayName={friend.displayName}
														isInGroup={isGameGroup}
														groupPosition={0}
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
