import cache from "webext-storage-cache/legacy.js";

export const batchGetCache = async (ids: string[]) => {
  return (
    await Promise.all(ids.map((id) => ({ id, data: cache.get(id) })))
  ).map(({ id, data }) => ({ id, data }));
};

export interface TimeDescriptor {
  readonly days?: number;
  readonly hours?: number;
  readonly minutes?: number;
  readonly seconds?: number;
  readonly milliseconds?: number;
  readonly microseconds?: number;
  readonly nanoseconds?: number;
}
type nameGenerator = (id: number) => string;
export const batchSetCache = async <T>(
  datas: Record<string, T>[] | string[],
  ids: string[],
  time: TimeDescriptor,
) => {
  return await Promise.all(
    datas.map((data, i) => cache.set(ids[i], data, time)),
  );
};

export const batchHasFilterCache = async (
  ids: number[],
  nameGenerator: nameGenerator,
): Promise<any[]> => {
  const isCached = await Promise.all(
    ids.map((id) => cache.has(nameGenerator(id))),
  );
  return ids.filter((a, i) => isCached[i] !== true);
};
