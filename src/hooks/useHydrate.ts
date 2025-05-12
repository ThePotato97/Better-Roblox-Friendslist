import { useAtom } from "jotai";
import {
  friendsHydratedAtom,
  placesHydratedAtom,
  presenceHydratedAtom,
  profilesHydratedAtom,
  thumbnailsHydratedAtom,
} from "../atoms";

export function useHydrateAtoms() {
  const [, hydratePlaces] = useAtom(placesHydratedAtom);
  const [, hydrateFriends] = useAtom(friendsHydratedAtom);
  const [, hydrateThumbnails] = useAtom(thumbnailsHydratedAtom);
  const [, hydrateProfiles] = useAtom(profilesHydratedAtom);
  const [, hydratePresence] = useAtom(presenceHydratedAtom);
  useEffect(() => {
    const run = async () => {
      try {
        await Promise.all([
          hydratePlaces(),
          hydrateFriends(),
          hydrateThumbnails(),
          hydrateProfiles(),
          hydratePresence(),
        ]);
      } catch (err) {
        console.error("Failed to hydrate atoms", err);
      }
    };
    run();
  }, [
    hydratePlaces,
    hydrateFriends,
    hydrateThumbnails,
    hydrateProfiles,
    hydratePresence,
  ]);
}
