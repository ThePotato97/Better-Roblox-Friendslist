import { FriendList } from "@/src/ContentScript/App";
import { useHydrateAtoms } from "@/src/hooks/useHydrate";

interface MountProps {
  framed: boolean;
}

function Mount(props: MountProps) {
  useHydrateAtoms();

  return (
    <>
      <FriendList framed={props.framed} />
    </>
  );
}

export default Mount;
