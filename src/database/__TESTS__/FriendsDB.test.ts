import { openDB,IDBPDatabase  } from 'idb';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('IndexedDB tests', () => {
  let db: IDBPDatabase<any>;

  beforeAll(async () => {
    db = await openDB('my-database', 1, {
      upgrade(db) {
        db.createObjectStore('my-store');
      },
    });
  });

  it('should store and retrieve data from IndexedDB', async () => {
    const store = db.transaction('my-store', 'readwrite').objectStore('my-store');
    await store.put('test-value', 'test-key');
    const value = await store.get('test-key');
    expect(value).toBe('test-value');
  });

  afterAll(async () => {
    await db.close();
  });
});
