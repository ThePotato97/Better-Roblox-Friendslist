import { atomFamily, selectAtom } from "jotai/utils";
import { profilesAtom } from "../profilesAtom";

export const profileDetailsFamily = atomFamily((userId: number | undefined) =>
  selectAtom(profilesAtom, (profiles) =>
    userId ? profiles[userId] : undefined,
  ),
);
