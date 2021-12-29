// Page script
window.addEventListener('RecieveContent', (evt) => {
  if (evt.detail && evt.detail.action === "joinGame") {
    const { gameId, placeId, userId } = evt.detail;
    if (placeId && gameId) {
      window.Roblox.GameLauncher.joinGameInstance(placeId, gameId);
    } else if (placeId) {
      window.Roblox.GameLauncher.joinGameInstance(placeId);
    }
  }
});
