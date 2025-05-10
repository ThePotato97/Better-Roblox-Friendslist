import { createSlice } from "@reduxjs/toolkit";
import { Friend } from "./friends-schema";

export type FriendsState = Readonly<Record<string, Friend | undefined>>;

const initialState: FriendsState = {};

export const friendsSlice = createSlice({
  name: "friends",
  initialState: initialState,
  reducers: {
    addFriend: (state, action) => {
      const { friend } = action.payload;
      return Object.assign(state, { [friend.id]: friend });
    },
  },
});
