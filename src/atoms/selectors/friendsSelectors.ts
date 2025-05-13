import { isEqual } from "lodash";
import { friendsAtom } from "..";
import { selectAtom } from "jotai/utils";

export const friendIdsSelector = selectAtom(
  friendsAtom,
  (friends) => Array.from(friends.keys()).sort((a, b) => a - b),
  isEqual,
);
