import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";

import { FriendList } from "@/src/ContentScript/App";
import { useHydrateAtoms } from "@/src/hooks/useHydrate";
import { useAtomsDevtools } from "jotai-devtools";
import { getDefaultStore } from "jotai";

const store = getDefaultStore();

function Mount() {
  useHydrateAtoms();

  return (
    <>
      <FriendList />
    </>
  );
}

export default Mount;
