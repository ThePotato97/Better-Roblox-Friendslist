import { FriendsDB, FriendsDBSchemaLiteral } from "../database/FriendsDB";

type DatabaseNames = keyof FriendsDBSchemaLiteral;

export const pruneData = async <T extends DatabaseNames>(
  databaseName: T,
  TTL: number,
): Promise<FriendsDBSchemaLiteral[T]["value"][]> => {
  const db = await FriendsDB();
  const transaction = db.transaction(databaseName, "readwrite");
  const store = transaction.store;

  const cutoff = Date.now() - TTL;

  if (!store.indexNames.contains("by-lastUpdated")) {
    console.warn(
      `Store "${databaseName}" does not have a 'by-lastUpdated' index.`,
    );
    return await store.getAll(); // fallback: no pruning
  }

  const index = store.index("by-lastUpdated");
  const range = IDBKeyRange.upperBound(cutoff, true);

  for await (const cursor of index.iterate(range)) {
    cursor.delete();
  }

  await transaction.done;

  // Fetch and return the updated store content
  return await (await FriendsDB()).transaction(databaseName).store.getAll();
};
