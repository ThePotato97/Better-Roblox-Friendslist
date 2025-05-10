import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";



import { FriendList } from "@/src/ContentScript/App";

function Mount() {

  return (
    <>
      <FriendList />
    </>
  );
}

export default Mount;
