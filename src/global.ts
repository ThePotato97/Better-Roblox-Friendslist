import { fetchServerDetailsResponse } from "./apis";

export enum PresenceTypes {
  OFFLINE = 0,
  ONLINE = 1,
  IN_GAME = 2,
  IN_STUDIO = 3,
  INVISIBLE = 4,
}

export enum JoinServerStatusCode {
  Retry = 0,
  ServerFound = 1,
  ServerDataLoaded = 2,
  ExperienceDisabled = 3,
  ServerUnavailable = 4,
  ServerUnavailableUnexpectedly = 5,
  ServerFull = 6,
  UNKNOWN_7 = 7,
  UNKNOWN_8 = 8,
  UNKNOWN_9 = 9,
  FollowedUserLeft = 10,
  ExperienceRestricted = 11,
  NoPermission = 12,
  ServerBusy = 13,
  HashExpired = 14,
  HashException = 15,
  PartyTooLarge = 16,
  HTTPError = 17,
  MalformedRequestBody = 18,
  ChannelMissmatch = 19,
  SetChannelInternalOnly = 20,
  UnauthorizedPrivacySettings = 21,
  InQueue = 22,
  UserBanned = 23,
}

export enum JoinMessage {
  PrivateServer = "User lacks access to join private server",
  ReservedServer = "User lacks permissions to join private server",
  RestrictedServer = "Unable to join Game",
  RestrictedGame = "Game's root place is not active.",
}

function isRestrictedServer(
  joinScript?: { gameId?: string },
  requestedGame?: { gameId?: string },
): boolean {
  return Boolean(
    joinScript?.gameId &&
      requestedGame?.gameId &&
      joinScript.gameId !== requestedGame.gameId,
  );
}

export enum JoinResultReason {
  OK,
  SERVER_ERROR,
  SERVER_FULL,
  UNAUTHORIZED_PRIVATE,
  UNAUTHORIZED_RESERVED,
  UNAUTHORIZED_GAME,
  UNAUTHORIZED_OTHER,
  USER_BANNED,
  CANT_JOIN,
  IN_RESTRICTED_SERVER,
  UNKNOWN,
}

export function getJoinStatusReason(
  joinData: fetchServerDetailsResponse,
): JoinResultReason {
  if (joinData.message?.match(/^Unable to join Game \d11$/)) {
    return JoinResultReason.SERVER_ERROR;
  }

  const status = joinData.status;

  switch (status) {
    case JoinServerStatusCode.ServerDataLoaded:
    case JoinServerStatusCode.ServerFound:
    case JoinServerStatusCode.Retry:
    case JoinServerStatusCode.ServerBusy:
      return JoinResultReason.OK;

    case JoinServerStatusCode.NoPermission:
      switch (joinData.message) {
        case JoinMessage.PrivateServer:
          return JoinResultReason.UNAUTHORIZED_PRIVATE;
        case JoinMessage.RestrictedGame:
          return JoinResultReason.UNAUTHORIZED_GAME;
        case JoinMessage.ReservedServer:
          return JoinResultReason.UNAUTHORIZED_RESERVED;
        default:
          return JoinResultReason.UNAUTHORIZED_OTHER;
      }

    case JoinServerStatusCode.InQueue:
    case JoinServerStatusCode.ServerFull:
      return JoinResultReason.SERVER_FULL;

    case JoinServerStatusCode.UserBanned:
      return JoinResultReason.USER_BANNED;

    default:
      if (joinData.statusData?.creatorExperienceBan) {
        return JoinResultReason.USER_BANNED;
      }
      return JoinResultReason.OK;
  }
}
