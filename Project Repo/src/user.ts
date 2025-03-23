import { checkValidUserId, totalNumberChannels, totalNumberDMs, totalNumberMessages } from './other';
import { getData, setData } from './dataStore';
import validator from 'validator';
import HTTPError from 'http-errors';

/**
 *
 * @param authUserId
 * @param uId
 * @returns {{error: string}|{user: {nameLast: *, uId: *, nameFirst: *, handleStr: *, email: *}}}
 */
export function userProfileV1(authUserId: number | string, uId: number) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (checkValidUserId(uId) && checkValidUserId(authUserId)) {
    for (const user of data.users) {
      if (uId === user.uId) {
        return {
          user:
            {
              uId: user.uId,
              nameFirst: user.nameFirst,
              nameLast: user.nameLast,
              email: user.email,
              handleStr: user.handleStr,
            }
        };
      }
    }
  } else {
    throw HTTPError(400, 'Invalid User ID');
  }
}

export function userProfileSetNameV1(authUserId: number | string, nameFirst: string, nameLast: string) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (authUserId === undefined || nameFirst.length === 0 || nameLast.length === 0) {
    throw HTTPError(400, 'Missing Parameters');
  }

  // parseInt(authUserId);

  if (nameFirst.length > 50 || nameFirst.length < 1) {
    throw HTTPError(400, 'First Name Length');
  }

  // check last name is between 1 and 50 characters
  if (nameLast.length > 50 || nameLast.length < 1) {
    throw HTTPError(400, 'Last Name Length');
  }

  for (const user of data.users) {
    if (user.uId === authUserId) {
      user.nameFirst = nameFirst;
      user.nameLast = nameLast;
    }
  }

  setData(data);

  return {};
}

export function userProfileSetEmailV1(authUserId: number | string, email: string) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (authUserId === undefined || email.length === 0) {
    throw HTTPError(400, 'Missing Inputs');
  }

  // parseInt(authUserId);

  if (validator.isEmail(email) === false) {
    throw HTTPError(400, 'Missing Inputs');
  }

  for (const user of data.users) {
    if (user.email === email) {
      throw HTTPError(400, 'Duplicate Email');
    }
  }

  for (const user of data.users) {
    if (user.uId === authUserId) {
      user.email = email;
    }
  }

  setData(data);

  return {};
}

export function userProfileSetHandleV1(authUserId: number | string, handleStr: string) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (authUserId === undefined || handleStr.length === 0) {
    throw HTTPError(400, 'Missing Inputs');
  }

  // parseInt(authUserId);

  if (handleStr.length > 20 || handleStr.length < 3) {
    throw HTTPError(400, 'HandleStr Length Invalid');
  }

  for (const user of data.users) {
    if (user.handleStr === handleStr) {
      throw HTTPError(400, 'Duplicate Handle');
    }
  }

  if (/^[A-Za-z0-9]*$/.test(handleStr) === false) {
    throw HTTPError(400, 'Non-Alphanumeric Handle');
  }

  for (const user of data.users) {
    if (user.uId === authUserId) {
      user.handleStr = handleStr;
    }
  }

  setData(data);

  return {};
}

// export function userProfileUploadPhotoV1(authUserId: number | string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) {

//   const data = getData();

//   if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
//     throw HTTPError(403, "Invalid Token");
//   }

//   checkValidImage(imgUrl);

//   return {};
// }

export function userStatsV1(authUserId: number | string) {
  const data = getData();
  let userStats;
  // channelsJoined tracks channelInvite, channelJoin, channelLeaveV2, and channelsCreate (Can go Up and Down)
  // dmsJoined tracks dmCreate, dmLeave, dmRemove (Can go Up and Down)
  // messagesSent tracks messageSend, messageSendDm (Can ONLY go Up)

  for (const user of data.users) {
    if (user.uId === authUserId) {
      let userInvolvementRate = (user.channelsJoined[user.channelsJoined.length - 1].numChannelsJoined +
          user.dmsJoined[user.dmsJoined.length - 1].numDmsJoined +
          user.messagesSent[user.messagesSent.length - 1].numMessagesSent) /
        (totalNumberChannels() + totalNumberDMs() + totalNumberMessages());

      if (userInvolvementRate > 1) {
        userInvolvementRate = 1;
      }

      userStats = {
        channelsJoined: user.channelsJoined,
        dmsJoined: user.dmsJoined,
        messagesSent: user.messagesSent,
        involvementRate: userInvolvementRate,
      };
    }
  }

  return { userStats: userStats };
}
