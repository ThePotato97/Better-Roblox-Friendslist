const headers = new Headers({
  Accept: "application/json",
  "Content-Type": "application/json",
  "user-agent": "Roblox/WinInet",
});

const gameInfo = async (placeIdInfo, guid) => {
  return new Promise((resolve) => {
    fetch("https://gamejoin.roblox.com/v1/join-game-instance", {
      method: "POST",
      credentials: "include",
      headers: headers,
      body: JSON.stringify({
        gameId: guid,
        gameJoinAttemptId: guid,
        placeId: placeIdInfo,
        browserTrackerId: 0,
        isTeleport: false,
      }),
    }).then(async (res) => {
      res.json().then((data) => resolve(data));
      if (res.status === 0) {
        return resolve(gameInfo(placeIdInfo, guid));
      }
    });
  });
};

gameInfo(7235355730, "19afcdfa-c77c-4c44-b45b-93b3e8bd2fc3").then((res) => console.log(res));
