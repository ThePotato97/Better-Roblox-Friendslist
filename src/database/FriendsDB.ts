import { DBSchema, openDB } from "idb";
import { ThumbnailType } from "../apis";
import { time } from "../helpers/timeHelper";

export enum PresenceType {
  Offline = 0,
  Online = 1,
  InGame = 2,
  InStudio = 3,
  Invisible = 4,
}

export interface Friend {
  userId: number;
  lastUpdated: number;
}

export interface Presence {
  userPresenceType: PresenceType;
  placeId: number;
  rootPlaceId: number;
  gameId: string;
  lastOnline?: number;
  universeId: number;
  userId: number;
  lastUpdated: number;
}

export interface Profiles {
  userId: number;
  displayName: string;
  combinedName: string;
  username: string;
  lastUpdated: number;
}

export interface Place {
  builder: string;
  builderId: number;
  hasVerifiedBadge: boolean;
  imageToken: string;
  price: number;
  placeId: number;
  isPlayable: boolean;
  sourceDescription: string;
  sourceName: string;
  reasonProhibited: string;
  name: string;
  description: string;
  universeId: number;
  universeRootPlaceId: number;
  lastUpdated: number;
}

export interface Thumbnail {
  requestId: ThumbnailRequestId;
  type: ThumbnailType;
  imageUrl: string;
  blocked: boolean;
  lastUpdated: number;
}

export type ThumbnailRequestId = `${number}:${ThumbnailType}:${string}`;

export function getThumbnailRequestId(
  id: number,
  thumbnailType: ThumbnailType,
  size: string,
): ThumbnailRequestId {
  return `${id}:${thumbnailType}:${size}`;
}

export const ttlConfig = {
  friends: {
    refresh: time.minutes(5),
    prune: time.minutes(10),
  },
  presences: {
    refresh: time.seconds(30),
    prune: time.days(1),
  },
  places: {
    refresh: time.hours(1),
    prune: time.days(1),
  },
  thumbnails: {
    refresh: time.minutes(1),
    prune: time.days(1),
  },
  profiles: {
    refresh: time.hours(1),
    prune: time.days(1),
  },
} satisfies Record<
  keyof FriendsDBSchemaLiteral,
  {
    refresh: number;
    prune: number;
  }
>;

export interface FriendsDBSchemaLiteral {
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
      "by-status": PresenceType;
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
  thumbnails: {
    key: ThumbnailRequestId;
    value: Thumbnail;
    indexes: {
      "by-lastUpdated": number;
      "by-type": ThumbnailType;
    };
  };
  profiles: {
    key: number;
    value: Profiles;
    indexes: {
      "by-lastUpdated": number;
    };
  };
}

export interface FriendsDBSchema extends FriendsDBSchemaLiteral, DBSchema {}

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

      // Thumbnails store
      const thumbnailsStore = db.createObjectStore("thumbnails", {
        keyPath: "requestId",
      });
      thumbnailsStore.createIndex("by-lastUpdated", "lastUpdated");
      thumbnailsStore.createIndex("by-type", "type");

      // Profiles store
      const profilesStore = db.createObjectStore("profiles", {
        keyPath: "userId",
      });
      profilesStore.createIndex("by-lastUpdated", "lastUpdated");
    },
  });
};
