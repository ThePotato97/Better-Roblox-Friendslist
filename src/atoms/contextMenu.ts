import { atom } from "jotai";

export const contextMenuAtom = atom<{
	mouseX: number;
	mouseY: number;
	userId: number;
	placeId: number;
	gameId: string;
	rootPlaceId: number;
	purchaseRequired: boolean;
	placePrice: number;
	isPresencePrivate: boolean;
} | null>(null);
