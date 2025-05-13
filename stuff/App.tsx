import { FriendList } from "@/src/ContentScript/App";
import { useHydrateAtoms } from "@/src/hooks/useHydrate";

function Mount() {
  useHydrateAtoms();

  return (
    <>
      <FriendList />
    </>
  );
}

export default Mount;
