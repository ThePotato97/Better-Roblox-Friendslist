let cache = [];
let lastUpdated = new Date();
let friendsList = [];
let groupsCache = {
  online: [],
  offline: [],
  ingame: [],
  studio: [],
  gameGroups: [],
};
let friendsCache;



const getFriends = function (id) {
  if (friendsCache && friendsCache.length > 0) {
    return Promise.resolve(friendsCache.slice(0));
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
    });
  });
};

const getThumbnails = function (data) {
  console.log('thumbnail data:', data);
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
  const chunks = sliceIntoChunks(data, 5);
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
  return new Promise((resolve, reject) => {
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

let multiGetUniversePlayabilityCache = {};

multiGetUniversePlayability = function (ids) {
  let cache = [];
  let idsToResolve = [];
  for (let i = 0; i < ids.length; i++) {
    let id = ids[i];
    if (multiGetUniversePlayabilityCache[id]) {
      cache.push(multiGetUniversePlayabilityCache[id]);
    } else {
      idsToResolve.push(id);
    }
  }
  if (idsToResolve.length === 0) {
    return Promise.resolve(cache);
  }
  return new Promise((resolve, reject) => {
    fetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${idsToResolve.join(',')}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
    }).then((response) => {
      response.json().then((data) => {
        for (let i = 0; i < data.length; i++) {
          if (data[i].playabilityStatus === 'Playable') {
            multiGetUniversePlayabilityCache[data[i].placeId] = data[i];
          }
        }
        if (cache.length > 0) {
          data.push(cache);
        }
        resolve(data);
      });
    });
  });
};

const mergePlaceThumbnailsWithFriends = function (friends, thumbnails) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < thumbnails.length; i++) {
      for (let j = 0; j < friends.length; j++) {
        if (thumbnails[i].targetId === friends[j].placeId) {
          friends[j].placeIcon = thumbnails[i].imageUrl;
        }
      }
    }
    resolve(friends);
  });
};

const mergePresenceWithFriends = function (friends, presence) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < friends.length; i++) {
      for (let j = 0; j < presence.length; j++) {
        if (friends[i].id === presence[j].userId) {
          for (const [key, value] of Object.entries(presence[j])) {
            friends[i][key] = value;
          }
        }
      }
    }
    resolve(friends);
  });
};

const uniq = function (a) {
  let seen = {};
  return a.filter((item) => {
    return Object.prototype.hasOwnProperty.call(seen, item) || (seen[item] = true);
  });
};

getRootPlaceIds = function (friends) {
  return new Promise((resolve, reject) => {
    let ids = [];
    for (let i = 0; i < friends.length; i++) {
      if (friends[i].rootPlaceId && friends[i].rootPlaceId !== friends[i].placeId) {
        ids.push(friends[i].rootPlaceId);
      }
    }
    resolve(uniq(ids));
  });
};

const getPlaceIds = function (friends) {
  return new Promise((resolve, reject) => {
    let ids = [];
    for (let i = 0; i < friends.length; i++) {
      if (friends[i].placeId) {
        ids.push(friends[i].placeId);
      }
    }
    resolve(uniq(ids));
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
      });
    });
  });
};
let iconCache;

const getPlaceIcons = function (ids) {
  return new Promise((resolve, reject) => {
    let request = [];
    let cache = [];

    for (let i = 0; i < ids.length; i++) {
      const cached = iconCache && iconCache[ids[i]];
      if (cached) {
        cache.push({
          targetId: ids[i],
          type: 'PlaceIcon',
          imageUrl: cached,
        });
      } else {
        request.push({
          format: 'jpeg',
          requestId: `${ids[i]}:GameIcon:50x50:jpeg:regular`,
          targetId: ids[i],
          size: '50x50',
          token: '',
          type: 'PlaceIcon',
        });
      }
    }
    if (request.length > 0) {
      getAllThumbnails(request).then((data) => {
        data = data.flat();
        if (data) {
          for (let i = 0; i < data.length; i++) {
            iconCache = iconCache || [];
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

const getUserId = async function () {
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

const mergePlayabilityWithFriends = function (friends, playability, rootPlace) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < friends.length; i++) {
      for (let j = 0; j < playability.length; j++) {
        const info = playability[j];
        if (friends[i].placeId === info.placeId || (rootPlace && friends[i].rootPlaceId === info.placeId)) {
          if (rootPlace) {
            friends[i].placePrice = info.price;
            friends[i].rootPlaceName = info.name;
          } else {
            friends[i].reasonProhibited = info.reasonProhibited;
            friends[i].isPlayable = info.isPlayable;
            friends[i].placeName = info.name;
            friends[i].placePrice = info.price;
          }
        }
        if (rootPlace && !friends[i].rootPlaceId) {
          friends[i].rootPlaceName = undefined;
        }
      }
    }
    resolve(friends);
  });
};

const getDuplicateGames = function (friends) {
  return new Promise((resolve, reject) => {
    let placeIds = {};
    for (let i = 0; i < friends.length; i++) {
      const placeId = friends[i].rootPlaceId || friends[i].placeId;
      if (placeId) {
        placeIds[placeId] = (placeIds[placeId] || 0) + 1;
      }
    }
    console.log('placeIds', placeIds);
    let duplicates = [];
    for (const [placeId, amount] of Object.entries(placeIds)) {
      if (amount > 1) {
        duplicates.push(placeId);
      }
    }
    resolve(duplicates);
  });
};
const getDuplicatePlaceDetails = (duplicates) => {
  return new Promise((resolve, reject) => {
    let placeDetails = [];
    if (duplicates.length > 0) {
      for (let i = 0; i < duplicates.length; i++) {
        placeDetails.push({
          placeId: Number(duplicates[i]),
          friends: [],
        });
      }
      getPlaceIcons(duplicates).then((icons) => {
        for (let i = 0; i < icons.length; i++) {
          for (let j = 0; j < placeDetails.length; j++) {
            if (Number(icons[i].targetId) === Number(placeDetails[j].placeId)) {
              placeDetails[j].icon = icons[i].imageUrl;
            }
          }
        }
      });
      multiGetPlaceDetails(duplicates).then((info) => {
        for (let i = 0; i < info.length; i++) {
          for (let j = 0; j < placeDetails.length; j++) {
            if (Number(info[i].placeId) === Number(placeDetails[j].placeId)) {
              placeDetails[j].name = info[i].name;
            }
          }
        }
      });
      resolve(placeDetails);
    }
    resolve(placeDetails);
  });
};

const getFriendInfo = async function () {
  const userId = await getUserId();
  const friends = await getFriends(userId);
  if (friends.length === 0) {
    reject([]);
    return;
  }
  const presence = await getPresence(friends);

  const processedPresence = await presence
    .filter((presence) => null !== presence.placeId)
    .map((presence) => presence.placeId);

  const placeIcons = await getPlaceIcons(processedPresence);

  console.log('Resolved Thumbnails: ', placeIcons);

  await mergePresenceWithFriends(friends, presence);
  const placeIds = await getPlaceIds(friends);
  const placeDetails = await multiGetPlaceDetails(placeIds);
  await mergePlayabilityWithFriends(friends, placeDetails);
  const RootPlaces = await getRootPlaceIds(friends);
  console.log('rootPlaces', RootPlaces);
  const rootPlaceDetails = await multiGetPlaceDetails(RootPlaces);
  await mergePlayabilityWithFriends(friends, rootPlaceDetails, true);
  console.log('rootPlaceDetails', rootPlaceDetails);
  await mergePlaceThumbnailsWithFriends(friends, placeIcons);
  const commonGames = await getDuplicateGames(friends);
  const duplicatePlaceDetails = await getDuplicatePlaceDetails(commonGames);
  console.log('commonGames', duplicatePlaceDetails);
  console.log('finished');
  console.log('Friends', friends);
  return {
    friends: friends,
    gameGroups: duplicatePlaceDetails,
  };
};

const PresenceTypes = {
  0: {
    status: 'offline',
  },
  1: {
    status: 'online',
  },
  2: {
    status: 'ingame',
  },
  3: {
    status: 'studio',
  },
};

/* function update(friends) {
    return new Promise((resolve, reject) => {
        console.log('Promising')
        let placeIds = []
        let tempGroups = {
            online: [],
            offline: [],
            ingame: [],
            studio: [],
        }
        for (let i = 0; i < friends.length; i++) {
            if (friends[i].placeId === null) {
                return
            }
            placeIds[friends[i].placeId] =
                placeIds[friends[i].placeId] || []
            placeIds[friends[i].placeId].push(friends[i])
        }
        console.log('GameIds', placeIds)
        let duplicates = []
        for (const [key, value] of Object.entries(placeIds)) {
            if (value.length > 1) {
                duplicates.push(value)
            }
        }
        console.log('Duplicates', duplicates)
 
        resolve(tempGroups)
    })
}
 */



const handleMessage = function (request, sender, sendResponse) {
  console.log('Received message from the content script:', request);
  if (request.type === 'getGroups') {
    sendResponse(groups);
  }
  sendResponse('Unknown type');
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




const shuffle = function (array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex],
    ];
  }

  return array;
};

getFriendInfo().then((friends) => {
  friendsList = friends;

});

/* setInterval(() => {
  openPorts.messageAll(groupsTest);
}, 10000);
 
chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === 'update');
  port.onMessage.addListener((msg) => {
    port.postMessage(groupsTest);
  });
  openPorts.add(port);
});
 */

setInterval(() => {
  getFriendInfo().then((friends) => {
    friendsList = friends;
    openPorts.messageAll(friends);
  });
}, 10000);

chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === 'update');
  port.onMessage.addListener((msg) => {
    port.postMessage(friendsList);
  });
  openPorts.add(port);
});
