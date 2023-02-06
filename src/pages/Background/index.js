let friendsList = [];
let thumbnailCache = new Map();

let places = {};

const getFriends = function (id) {
  return new Promise((resolve, reject) => {
    fetch(`https://friends.roblox.com/v1/users/${id}/friends?userSort=StatusFrequents`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
    }).then((response) => {
      response.json().then((data) => {
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
  const chunks = sliceIntoChunks(data, 60);
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
  for (const element of ids) {
    let id = element;
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
        for (const element of data) {
          multiGetPlaceDetailsCache[element.placeId] = element;
        }
        if (cache.length > 0) {
          data.push(cache);
        }
        resolve(data);
      });
    });
  });
};



const getPresence = function (friends, url) {
  const ids = friends.map((friend) => friend.id);
  const request = JSON.stringify({
    userIds: ids,
  });
  return new Promise((resolve, reject) => {
    fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: request,
      method: 'POST',
    }).then((response) => {
      response.json().then((data) => {
        resolve(data);
      }).catch((err) => {
        reject(err);
      });
    });
  });
};

const fetchThumbnails = function (ids, thumbnailType, size) {
  return new Promise((resolve) => {
    let request = [];
    let cache = [];

    ids.forEach((id) => {
      const cached = thumbnailCache.get(id);
      if (cached) {
        cache.push({
          targetId: id,
          type: thumbnailType,
          imageUrl: cached,
        });
      } else {
        request.push({
          format: 'png',
          requestId: `${id}:GameIcon:150x150:jpeg:regular`,
          targetId: id,
          size: size,
          token: '',
          type: thumbnailType,
        });
      }
    });
    if (request.length > 0) {
      getAllThumbnails(request).then((data) => {
        data = data.flat();
        if (data) {
          for (const element of data) {
            thumbnailCache.set(element.targetId, element.imageUrl);
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
  const presence = await getPresence(friends, "https://presence.roblox.com/v1/presence/users");
  const lastOnline = await getPresence(friends, "https://presence.roblox.com/v1/presence/last-online");
  await getPlaceIds(presence.userPresences);
  const placesInfoNeeded = await getMissingValues(places, 'name');
  const placeDetails = await multiGetPlaceDetails(placesInfoNeeded);
  const iconsNeeded = await getMissingValues(places, 'icon');
  const placeIcons = await fetchThumbnails(iconsNeeded, 'PlaceIcon', "150x150");
  const friendIcons = await fetchThumbnails(friends.map((friend) => friend.id), 'AvatarHeadShot', "150x150");
  const thumbnailsNeeded = await getMissingValues(places, 'thumbnail');
  const gameThumbnails = await fetchThumbnails(thumbnailsNeeded, 'GameThumbnail', "768x432");
 

  const lastOnlineMap = new Map();
  for (const element of lastOnline.lastOnlineTimestamps) {
    lastOnlineMap.set(element.userId, element.lastOnline);
  }
  const presenceIdKeys = {};

  for (const element of presence.userPresences) {
    presenceIdKeys[element.userId] = element;
    const lastOnline = lastOnlineMap.get(element.userId);
    if (lastOnline) {
      presenceIdKeys[element.userId].lastOnline = lastOnlineMap.get(element.userId);
    }
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
  const friendIconMap = new Map();
  for await (const icon of friendIcons.flat()) {
    if (icon.targetId && icon.imageUrl || icon.state === "Blocked") {
      if (icon.state === "Blocked") { 
        console.log("Blocked", icon);
      }
      friendIconMap.set(icon.targetId, icon.imageUrl);
    }
  }
  for (const friend of friends) {
    if (friendIconMap.has(friend.id)) {
      friend.avatar = friendIconMap.get(friend.id);
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
  for await (const icon of gameThumbnails.flat()) {
    if (icon.targetId && icon.imageUrl || icon.state === "Blocked") {
      if (icon.state === "Blocked") {
        console.log("Blocked", icon);
      }
      places[icon.targetId].thumbnail = icon.imageUrl;
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
  openPorts.messageAll(friends);
});

setInterval(() => {
  const ports = openPorts.getPorts();
  if (!ports || Object.keys(ports).length === 0) return;
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
