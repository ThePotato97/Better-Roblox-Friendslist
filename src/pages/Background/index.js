let friendsList = [];
let friendsCache;

let places = {};

const getFriends = function (id) {
  if (friendsCache && friendsCache.length > 0) {
    return Promise.resolve(friendsCache);
  }
  return new Promise((resolve, reject) => {
    fetch(`https://friends.roblox.com/v1/users/${id}/friends?userSort=StatusFrequents`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
    }).then((response) => {
      response.json().then((data) => {
        friendsCache = data.data;
        resolve(data.data);
      });
    }).catch((err) => {
      reject(err);
    });
  });
};

const getThumbnails = function (data) {
  return new Promise((resolve) => {
    fetch('https://thumbnails.roblox.com/v1/batch', {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      method: 'POST',
    }).then((response) => {
      response.json().then((data) => {
        if (data.errors) {
          resolve([]);
        } else {
          resolve(data.data);
        }
      });
    });
  });
};

const sliceIntoChunks = function (arr, chunkSize) {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
};

const getAllThumbnails = function (data) {
  const chunks = sliceIntoChunks(data, 1);
  return Promise.all(
    chunks.map((chunk) => {
      return getThumbnails(chunk);
    })
  );
};
let multiGetPlaceDetailsCache = {};

const multiGetPlaceDetails = function (ids) {
  let cache = [];
  let idsToResolve = [];
  for (let i = 0; i < ids.length; i++) {
    let id = ids[i];
    if (multiGetPlaceDetailsCache[id]) {
      cache.push(multiGetPlaceDetailsCache[id]);
    } else {
      idsToResolve.push(id);
    }
  }
  if (idsToResolve.length === 0) {
    return Promise.resolve(cache);
  }
  return new Promise((resolve) => {
    fetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${idsToResolve.join('&placeIds=')}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
    }).then((response) => {
      response.json().then((data) => {
        for (let i = 0; i < data.length; i++) {
          multiGetPlaceDetailsCache[data[i].placeId] = data[i];
        }
        if (cache.length > 0) {
          data.push(cache);
        }
        resolve(data);
      });
    });
  });
};



const getPresence = function (friends) {
  const ids = friends.map((friend) => friend.id);
  const request = JSON.stringify({
    userIds: ids,
  });
  return new Promise((resolve, reject) => {
    fetch(`https://presence.roblox.com/v1/presence/users/`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: request,
      method: 'POST',
    }).then((response) => {
      response.json().then((data) => {
        resolve(data.userPresences);
      }).catch((err) => {
        reject(err);
      });
    });
  });
};
let iconCache = {};

const getPlaceIcons = function (ids) {
  return new Promise((resolve) => {
    let request = [];
    let cache = [];

    ids.forEach((id) => {
      const cached = iconCache[id];
      if (cached) {
        cache.push({
          targetId: id,
          type: 'PlaceIcon',
          imageUrl: cached,
        });
      } else {
        request.push({
          format: 'jpeg',
          requestId: `${id}:GameIcon:150x150:jpeg:regular`,
          targetId: id,
          size: '150x150',
          token: '',
          type: 'PlaceIcon',
        });
      }
    });
    if (request.length > 0) {
      getAllThumbnails(request).then((data) => {
        data = data.flat();
        if (data) {
          for (let i = 0; i < data.length; i++) {
            iconCache[data[i].targetId] = data[i].imageUrl;
          }
          if (cache.length > 0) {
            data.push(cache);
          }
          resolve(data);
        }
      });
    } else {
      resolve(cache);
    }
  });
};
let userId;

const getUserId = async () => {
  if (userId) {
    return Promise.resolve(userId);
  }
  try {
    return await new Promise((resolve, reject) => {
      fetch('https://www.roblox.com/my/account/json', {
        method: 'GET',
        credentials: 'include',
      }).then((response) => {
        try {
          response.json().then((data) => {
            userId = data.UserId;
            resolve(data.UserId);
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (err) {
    console.error(`getUserId failed ${err}`);
  }
};

const getPlaceIds = function (friends) {
  return new Promise((resolve) => {
    friends.forEach(friend => {
      if (friend.placeId && !places[friend.placeId]) {
        places[friend.placeId] = {};
      }
      if (friend.rootPlaceId && !places[friend.rootPlaceId]) {
        places[friend.rootPlaceId] = {};
      }
    });
    resolve(places);
  });
};

const getMissingValues = (array, targetKey) => {
  return new Promise((resolve) => {
    let missing = [];
    for (const [key, value] of Object.entries(array)) {
      if (!value[targetKey]) {
        missing.push(key);
      }
    }
    resolve(missing);
  });
};

const getFriendInfo = async () => {
  const userId = await getUserId();
  const friends = await getFriends(userId);
  if (friends?.length === 0) {
    return Promise.resolve([]);
  }
  const presence = await getPresence(friends);
  await getPlaceIds(presence);
  const placesInfoNeeded = await getMissingValues(places, 'name');
  const placeDetails = await multiGetPlaceDetails(placesInfoNeeded);
  const iconsNeeded = await getMissingValues(places, 'icon');
  const placeIcons = await getPlaceIcons(iconsNeeded);
  
  const presenceIdKeys = {};

  for (let i = 0; i < presence.length; i++) {
    presenceIdKeys[presence[i].userId] = presence[i];
  }

  for await (const info of placeDetails) {
    if (info.placeId && info.name !== undefined) {
      places[info.placeId].name = info.name;
      places[info.placeId].price = info.price;
      places[info.placeId].universeId = info.universeId;
      places[info.placeId].reasonProhibited = info.reasonProhibited;
      places[info.placeId].builder = info.builder;
      places[info.placeId].description = info.description;
      places[info.placeId].isPlayable = info.isPlayable;
    }
  }
  for await (const icon of placeIcons.flat()) {
    if (icon.targetId && icon.imageUrl || icon.state === "Blocked") {
      if (icon.state === "Blocked") { 
        console.log("Blocked", icon);
      }
      places[icon.targetId].icon = icon.imageUrl;
    }
  }
  return {
    placeDetails: places,
    presence: presenceIdKeys,
    friends: friends,
  };
};

let openPorts = (function () {
  let index = 0;
  let ports = {};
  let op = {
    getPorts: function () {
      let result = {};
      for (let id in ports) {
        result[id] = ports[id];
      }
      return result;
    },
    getPortsArray: function () {
      let result = [];
      for (let id in ports) {
        result.push(ports[id]);
      }
      return result;
    },
    get: function (id) {
      return ports[id];
    },
    add: function (port) {
      let id = index;

      ports[id] = port;
      port.onDisconnect.addListener(() => {
        op.remove(id);
      });

      index++;
      return id;
    },
    remove: function (id) {
      delete ports[id];
    },
    messageAll: function (message) {
      for (let id in ports) {
        ports[id].postMessage(message);
      }
    },
  };
  return op;
})();

getFriendInfo().then((friends) => {
  friendsList = friends;

});

setInterval(() => {
  getFriendInfo().then((friends) => {
    friendsList = friends;
    openPorts.messageAll(friends);
  });
}, 10000);

chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === 'update');
  port.onMessage.addListener(() => {
    port.postMessage(friendsList);
  });
  openPorts.add(port);
});
