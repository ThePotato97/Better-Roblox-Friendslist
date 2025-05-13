import { fetchApi } from "rozod";
import { getUsersAuthenticated } from "rozod/lib/endpoints/usersv1";

export const fetchUserInfo = async () => {
  const response = await fetchApi(getUsersAuthenticated);

  return response;
};
