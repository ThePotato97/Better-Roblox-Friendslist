import { DBSchema, IDBPDatabase, openDB } from "idb";

enum userPresenceType {
	Offline = 0,
	Online = 1,
	InGame = 2,
	InStudio = 3,
	Invisible = 4,
}

export interface Friend {
	userId: number;
	isVerified?: boolean;
	username: string;
	displayName?: string;
	thumbnail?: string;
	lastUpdated: number;
}

export interface Presence {
	userId: number;
	userPresenceType: userPresenceType;
	placeId: number;
	rootPlaceId: number;
	gameId: number;
	universeId: number;
	lastOnline: number;
	lastUpdated: number;
}

export interface Place {
	placeId: number;
	rootPlaceId: number;
	name: string;
	description: string;
	thumbnail: string;
	lastUpdated: number;
}

export interface FriendsDBSchema extends DBSchema {
	friends: {
		key: number;
		value: Friend;
		indexes: {
			"by-userId": string;
			"by-lastUpdated": number;
		};
	};
	presences: {
		key: number;
		value: Presence;
		indexes: {
			"by-status": userPresenceType;
			"by-gameId": number;
			"by-universeId": number;
			"by-lastUpdated": number;
		};
	};
	places: {
		key: number;
		value: Place;
		indexes: {
			"by-lastUpdated": number;
		};
	};
}

export const FriendsDB = async () => {
	return openDB<FriendsDBSchema>("friends", 1, {
		upgrade(db) {
			// Friends store
			const friendsStore = db.createObjectStore("friends", {
				keyPath: "userId",
			});
			friendsStore.createIndex("by-userId", "userId");
			friendsStore.createIndex("by-lastUpdated", "lastUpdated");

			// Presences store
			const presencesStore = db.createObjectStore("presences", {
				keyPath: "userId",
			});
			presencesStore.createIndex("by-status", "userPresenceType");
			presencesStore.createIndex("by-gameId", "gameId");
			presencesStore.createIndex("by-universeId", "universeId");
			presencesStore.createIndex("by-lastUpdated", "lastUpdated");

			// Places store
			const placesStore = db.createObjectStore("places", {
				keyPath: "placeId",
			});
			placesStore.createIndex("by-lastUpdated", "lastUpdated");
		},
	});
};
