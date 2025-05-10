import { useState, useEffect, useContext } from "react";

import { createPortal } from "react-dom";

import { usePopper } from "react-popper";
import { ThumbnailContext } from "../Context/Thumbnails";
import { getThumbnailRequestId } from "@/src/database/FriendsDB";
import { useAtomValue } from "jotai";
import { thumbnailsAtom } from "@/src/atoms";

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

const cacheConcurrent = {};
const getPlacePlaying = (universeId) => {
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

const cacheVotes = {};
const getPlaceVotes = (universeId) => {
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
						resolve(percentage);
					}
				})
				.catch((err) => {
					reject(err);
				}),
		);
	});
};

export const GamePopper = ({
	isInGroup,
	builder,
	universeId,
	description,
	placeId,
}) => {
	const [votes, setVotes] = useState("???");
	const [playing, setPlaying] = useState("???");
	const [showPopper, setPopperState] = useState(false);
	const [referenceElement, setReferenceElement] = useState(null);
	const [popperElement, setPopperElement] = useState(null);
	const [rootElement, setRootElement] = useState<HTMLElement>();

	const thumbnails = useAtomValue(thumbnailsAtom);

	useEffect(() => {
		const root = document
			.getElementById("friend-list-container-shadow")
			?.shadowRoot?.getElementById("friend-list-container");
		if (!root) return;
		setRootElement(root);
	}, []);

	const { styles, attributes } = usePopper(referenceElement, popperElement, {
		placement: "left",
		modifiers: [
			{
				name: "offset",
				options: {
					offset: [0, 20],
				},
			},
		],
	});

	const handleMouseEnter = () => {
		setPopperState(true);
		getPlaceVotes(universeId).then((votes) => {
			setVotes(votes);
		});
		getPlacePlaying(universeId).then((visits) => {
			setPlaying(visits);
		});
	};

	const handleMouseLeave = () => {
		setPopperState(false);
	};
	const placeIcon =
		thumbnails[getThumbnailRequestId(placeId, "PlaceIcon", "150x150")];
	const placeThumbnail =
		thumbnails[getThumbnailRequestId(placeId, "GameThumbnail", "768x432")];
	return (
		<>
			{isInGroup ? (
				<div ref={setReferenceElement}>
					<img
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}
						className="groupIcon"
						src={placeIcon}
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
					<img className="gameIcon" src={placeIcon} alt="" />
				</div>
			)}
			{showPopper && rootElement
				? createPortal(
						<div
							ref={setPopperElement}
							style={{ ...styles.popper, zIndex: 9999 }}
							{...attributes.popper}
						>
							<div
								className="game-popper-container"
								style={{
									overflow: "hidden",
									height: "390px",
									width: "390px",
									background: "#2C2C2C",
									borderRadius: "5px",
								}}
							>
								<div
									className="game-popper-header"
									style={{ height: "217px", width: "390px" }}
								>
									<div
										style={{
											height: "217px",
											width: "390px",
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
											top: "165px",
											left: "10px",
										}}
									>
										{`By ${builder}`}
									</div>
									<div
										style={{ position: "absolute", top: "190px", left: "5px" }}
									>
										<span className="icon-popper icon-vote-popper" />
										<span className="count-label-popper">{`${votes || "??"}%`}</span>
										<span className="icon-popper icon-playing-popper" />
										<span className="count-label-popper">
											{playing || "???"}
										</span>
									</div>
								</div>

								<div className="icon-container-popper">
									<div
										className="icon-container-popper icon-background-popper"
										style={{ backgroundImage: `url(${placeIcon})` }}
									/>
									<div
										className="icon-container-popper icon-foreground-popper"
										style={{ backgroundImage: `url(${placeIcon})` }}
									/>
								</div>
								<div
									className="game-popper-footer"
									style={{ height: "60px", width: "390px" }}
								>
									<div>
										<pre
											style={{
												color: "#C5C5C5",
												overflow: "hidden",
												padding: "10px",
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
};
