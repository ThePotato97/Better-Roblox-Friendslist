import { fetchApiSplit } from 'rozod';
import { getV1gamesmultigetPlaceDetails } from 'rozod/lib/endpoints/gamesv1'
import { z } from 'zod';

type gameMultiGetResponse = z.infer<typeof getV1gamesmultigetPlaceDetails['response']>;

const placeDetailsCache = new Map<number, gameMultiGetResponse[0]>();


export const multiGetPlaceDetails = async (ids: number[]): Promise<typeof placeDetailsCache> => {
    const newIds = ids.filter((id) => !placeDetailsCache.has(id));
    const responses = await fetchApiSplit(getV1gamesmultigetPlaceDetails, { placeIds: newIds }, { placeIds: 60 });
    responses.flat().forEach((response) => {
      const {placeId} = response
      placeDetailsCache.set(placeId, response);
    })
    return placeDetailsCache;
};