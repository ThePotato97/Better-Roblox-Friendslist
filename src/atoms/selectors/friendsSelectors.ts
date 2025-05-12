import { isEqual } from "lodash";
import { friendsAtom } from "..";
import { selectAtom } from "jotai/utils";

export const friendIdsSelector = selectAtom(
  friendsAtom,
  (friends) =>
    friends.map((f) => f.userId).sort((a, b) => Number(a) - Number(b)),
  isEqual,
);
