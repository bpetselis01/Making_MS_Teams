import { getData, setData, userDetails } from './dataStore';
import { findLastLog, userHasBeenRemoved } from './other';
import HTTPError from 'http-errors';

/**
 *
 * @param authUserId
 * @returns {{error: string}|{users: *}}
 */
export const usersAllV1 = (authUserId: number | string): { error: string } | { users: userDetails[] } => {
  const data = getData();

  // If invalid token
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  const allUsers: userDetails[] = [];
  for (const user of data.users) {
    if (!userHasBeenRemoved(user.uId)) {
      allUsers.push(
        {
          uId: user.uId,
          email: user.email,
          nameFirst: user.nameFirst,
          nameLast: user.nameLast,
          handleStr: user.handleStr,
          profileImgUrl: user.profileImgUrl
        }
      );
    }
  }

  return { users: allUsers };
};

export function usersStatsV1(authUserId: number | string) {
  const data = getData();
  // channelsExist tracks channelsCreate (Can go Up)
  // dmsExist tracks dmCreate, dmRemove (Can go Up and Down)
  // messagesExist tracks messageSend, messageSendDm, messageRemove, dmRemove (Can go Up and Down)

  let count = 0;
  let userCount = 0;
  for (const user of data.users) {
    if (findLastLog(user.uId)) {
      count++;
    }
    userCount++;
  }

  const utilizationRate = count / userCount;
  data.statistics.utilizationRate = utilizationRate;
  setData(data);

  return { workspaceStats: data.statistics };
}
