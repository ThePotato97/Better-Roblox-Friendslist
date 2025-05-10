import { openDB, type IDBPDatabase, deleteDB } from "idb";
import { FriendsDB, type FriendsDBSchema } from "../FriendsDB";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

describe("IndexedDB tests", () => {
  let db: IDBPDatabase<FriendsDBSchema>;

  const friendsResponse = [
    {
      id: 83841284,
      hasVerifiedBadge: false,
    },
    {
      id: 51152661,
      hasVerifiedBadge: false,
    },
    {
      id: 859564378,
      hasVerifiedBadge: false,
    },
    {
      id: 16689252,
      hasVerifiedBadge: false,
    },
    {
      id: 374169534,
      hasVerifiedBadge: false,
    },
  ];

  beforeAll(async () => {
    // Make sure we start with a fresh database
    try {
      await deleteDB("friends");
    } catch (error) {
      console.log("No existing database to delete");
    }

    db = await FriendsDB();
  });

  afterEach(async () => {
    // Clear all data between tests
    const tx = db.transaction("friends", "readwrite");
    const store = tx.objectStore("friends");
    await store.clear();
    await tx.done;
  });

  afterAll(async () => {
    db.close();
    await deleteDB("friends");
  });

  it("should store and retrieve data from IndexedDB", async () => {
    // Create the expected data format that should be stored
    const expectedData = friendsResponse.map((friend) => ({
      userId: friend.id,
      isVerified: friend.hasVerifiedBadge,
      lastUpdated: expect.any(Number), // Since we can't know the exact timestamp
    }));

    // Start transaction and get store
    const tx = db.transaction("friends", "readwrite");
    const store = tx.objectStore("friends");

    // Store all friends data
    await Promise.all(
      friendsResponse.map((friend) =>
        store.put({
          userId: friend.id,
          isVerified: friend.hasVerifiedBadge,
          lastUpdated: Date.now(),
        }),
      ),
    );

    const test = await store.get(83841284);

    console.log(test);
    // Wait for transaction to complete
    await tx.done;

    // Start new transaction for reading
    const readTx = db.transaction("friends", "readonly");
    const readStore = readTx.objectStore("friends");

    // Get all data and verify
    const storedData = await readStore.getAll();
    console.log(storedData);
    expect(storedData).toEqual(expect.arrayContaining(expectedData));

    const firstFriend = await readStore.get(83841284);

    expect(firstFriend).toEqual(expect.objectContaining(expectedData[0]));

    // Wait for read transaction to complete
    await readTx.done;
  }); // Increased timeout to 15 seconds for safety
});
