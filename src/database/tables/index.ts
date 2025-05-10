import BaseDexie from "dexie";
import { friendsSchema, type FriendsTable } from "./friends";
import { placesSchema, type PlacesTable } from "./places";
import { presenceSchema, type PresenceTable } from "./presence";

type DexieTables = FriendsTable & PlacesTable & PresenceTable;
export type Dexie<T = DexieTables> = BaseDexie & T;

export const db = new BaseDexie("friendsDB") as Dexie;
const schema = Object.assign({}, friendsSchema, placesSchema, presenceSchema);
db.version(1).stores(schema);
