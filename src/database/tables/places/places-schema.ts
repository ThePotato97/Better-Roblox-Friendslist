import type { Table } from "dexie";

export interface Place {
  placeId: number;
  rootPlaceId: number;
  name: string;
  description: string;
  thumbnail: string;
  lastUpdated: number;
}

export interface PlacesTable {
  places: Table<Place>;
}

export const placesSchema = {
  places: "placeId, rootPlaceId, name, description, thumbnail, lastUpdated",
};
