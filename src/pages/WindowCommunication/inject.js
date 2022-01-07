// Page script
window.addEventListener('RecieveContent', (evt) => {
  if (evt.detail && evt.detail.action === "joinGame") {
    const { gameId, placeId, rootPlaceId } = evt.detail;
    if (placeId && gameId && (rootPlaceId ? placeId === rootPlaceId : true)) {
      window.Roblox.GameLauncher.joinGameInstance(placeId, gameId);
    } else if (placeId) {
      const targetPlaceId = rootPlaceId || placeId;
      window.Roblox.GameLauncher.joinMultiplayerGame(targetPlaceId);
    }
  }
});
