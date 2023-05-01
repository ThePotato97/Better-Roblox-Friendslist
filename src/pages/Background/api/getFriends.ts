export const getFriends = function (id: number) {
  return new Promise((resolve, reject) => {
    fetch(`https://friends.roblox.com/v1/users/${id}/friends?userSort=StatusFrequents`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
      method: "GET",
    })
      .then((response) => {
        response.json().then((data) => {
          resolve(data.data);
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
};