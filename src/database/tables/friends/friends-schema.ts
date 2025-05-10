import type { Table } from "dexie";

export interface Friend {
  userId: number;
  isVerified: boolean;
  username?: string;
  thumbnail?: string;
  lastUpdated: number;
}

export interface FriendsTable {
  friends: Table<Friend>;
}

export const friendsSchema = {
  friends: "userId, isVerified, username, thumbnail, lastUpdated",
};
