import { DBSchema, openDB } from "idb";


enum userPresenceType {
    Offline= 0,
    Online= 1,
    InGame= 2,
    InStudio = 3,
    Invisible = 4,
}

interface Friend {
  userId: number;
  isVerified: boolean;
  username: string;
  thumbnail: string;
  lastUpdated: number;
}

interface Presence {
    userId: number;
    userPresenceType: userPresenceType;
    placeId: number;
    rootPlaceId: number;
    gameId: number;
    universeId: number;
    lastOnline: number;
    lastUpdated: number;
}

interface Place {
    placeId: number;
    rootPlaceId: number;
    name: string;
    description: string;
    thumbnail: string;
    lastUpdated: number;
}



interface FriendsDB extends DBSchema {
    friends: {
        key: string;
        value: Friend;
        indexes: {
            "by-username": string;
            "by-lastUpdated": number;
        }
    },
    presences: {
        key: string;
        value: Presence;
        indexes: {
            "by-status": userPresenceType;
            "by-gameId": number;
            "by-universeId": number;
            "by-lastUpdated": number;
        }
    }
    places: {
        key: string;
        value: Place;
        indexes: {
            "by-lastUpdated": number;
        }
    }
}

export const FriendsDB = openDB<FriendsDB>("friends", 1, {
  upgrade(db) {
    db.createObjectStore("friends", {
      keyPath: "id",
    });
    db.createObjectStore("presences", {
      keyPath: "id",
    });
    db.createObjectStore("places", {
      keyPath: "id",
    });
  },
});