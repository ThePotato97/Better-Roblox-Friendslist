// Page script
declare global {
  {
  }
}
type Window = {
  Roblox: {
    GameLauncher: {
      joinGameInstance: (placeId: number, gameId: string) => void;
      joinMultiplayerGame: (placeId: number) => void;
    };
  };
};

type JoinGameInterface = {
  action: "joinGame";
  rootPlaceId: number;
  placeId: number;
  gameId: number;
  userId: number;
};

type ReceiveContentEvent = {
  detail: JoinGameInterface;
} & CustomEvent;

window.addEventListener("RecieveContent", (evt: ReceiveContentEvent) => {
  console.log("joining recieved", evt.detail);
  if (evt.detail && evt.detail.action === "joinGame") {
    const { gameId, placeId, rootPlaceId } = evt.detail;
    if (placeId && gameId) {
      window.Roblox.GameLauncher.joinGameInstance(placeId, gameId);
    } else if (placeId) {
      const targetPlaceId = rootPlaceId || placeId;
      window.Roblox.GameLauncher.joinMultiplayerGame(targetPlaceId);
    }
  }
});

