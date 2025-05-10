import type { Table } from "dexie";

enum userPresenceType {
  Offline = 0,
  Online = 1,
  InGame = 2,
  InStudio = 3,
  Invisible = 4,
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

export interface PresenceTable {
  presence: Table<Presence>;
}

export const presenceSchema = {
  Presence:
    "userId, userPresenceType, placeId, rootPlaceId, gameId, universeId, lastOnline, lastUpdated",
};
