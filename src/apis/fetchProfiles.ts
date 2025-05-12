import { z } from "zod";
import { endpoint, fetchApi } from "rozod";

const profilesEndPoint = endpoint({
  method: "POST",
  path: "user-profile-api/v1/user/profiles/get-profiles",
  baseUrl: "https://apis.roblox.com/",
  body: z.object({
    fields: z.array(
      z.union([z.literal("names.combinedName"), z.literal("names.username")]),
    ),
    userIds: z.array(z.number()),
  }),
  response: z.object({
    profileDetails: z.array(
      z.object({
        userId: z.number(),
        names: z.object({
          combinedName: z.string(),
          username: z.string(),
        }),
      }),
    ),
  }),
});

export const fetchProfiles = async (userIds: number[]) => {
  const response = await fetchApi(profilesEndPoint, {
    body: {
      fields: ["names.combinedName", "names.username"],
      userIds,
    },
  });

  return response.profileDetails.map(({ userId, names }) => ({
    userId,
    displayName: names.combinedName,
    combinedName: names.combinedName,
    username: names.username,
  }));
};
