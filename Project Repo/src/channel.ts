import { channelMembers, getData, setData } from './dataStore';
import {
  addNotification,
  addUserChannelStatistic,
  checkIfInChannel,
  checkIfInChannelOwners,
  checkValidChannelId,
  checkValidUserId,
  getHandleString,
  getUserDetails,
  removeUserChannelStatistic,
  tokenFinder
} from './other';
import HTTPError from 'http-errors';

interface user {
  uId: number,
  nameFirst: string,
  nameLast: string;
  email: string,
  handleStr: string,
  password?: string
}

/**
 *
 * @param authUserId
 * @param channelId
 * @param uId
 * @returns {{error: string}|{}}
 */
export function channelInviteV3(authUserId: number | string, channelId: number, uId: number) {
  // Check that none of the inputs are empty
  if (authUserId === undefined || channelId === undefined || uId === undefined) {
    throw HTTPError(400, 'Invalid Inputs');
  }

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid Channel');
  }
  // Check if user exists
  if (checkValidUserId(uId) !== true) {
    throw HTTPError(400, 'Invalid uId');
  }

  // Check user already in channel
  if (checkIfInChannel(uId, channelId)) {
    throw HTTPError(400, 'Already a Member');
  }

  // Check if authUserId is not in channel
  if (!checkIfInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'authUserId is not in channel');
  }

  const data = getData();
  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      const userDetails = getUserDetails(uId) as channelMembers;
      channel.allMembers.push(userDetails);
      setData(data);
      // Send notification
      const handlestr = getHandleString(authUserId);

      const notification = {
        channelId: channelId,
        dmId: -1,
        notificationMessage: handlestr + ' added you to ' + channel.name,
      };
      addNotification(uId, notification);
    }
  }
  addUserChannelStatistic(uId as number);

  return {};
}

/**
 *
 * @param authUserId
 * @param channelId
 * @param start
 * @returns {{error: string}|{start, messages: T[], end: *}}
 */
export function channelMessagesV3(authUserId: number | string, channelId: number, start: number) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid ChannelId');
  }

  if (!checkValidUserId(authUserId)) {
    throw HTTPError(400, 'Invalid uId');
  }

  const channel = data.channels.find(objProp => objProp.channelId === channelId);

  if (start > channel.messages.length) {
    throw HTTPError(400, 'Start must be smaller than length');
  }

  let isMember = false;
  for (const member of channel.allMembers) {
    if (member.uId === authUserId) {
      isMember = true;
      break;
    }
  }
  if (!isMember) {
    throw HTTPError(403, 'Not a Member of the Channel');
  }

  console.log(data.channels[0].messages);
  for (const channel of data.channels) {
    for (const message of channel.messages) {
      for (const react of message.reacts) {
        if (react.uIds.includes(authUserId)) {
          react.isThisUserReacted = true;
        } else {
          react.isThisUserReacted = false;
        }
      }
    }
  }

  let end = start + 50;
  let messages;
  if (end >= channel.messages.length) {
    end = -1;
    messages = channel.messages.slice(start, channel.messages.length);
  } else {
    messages = channel.messages.slice(start, end);
  }

  return {
    messages: messages,
    start: start,
    end: end,
  };
}

/**
 *
 * @param authUserId
 * @param channelId
 * @returns {{error: string}|{allMembers: ([{nameLast: string, uId: *, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: *, nameFirst: string, handleStr: string, email: string},{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string},{nameLast: string, uId: *, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string},{nameLast: string, uId: *, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string}]|[]|*), ownerMembers: ([{nameLast: string, uId: *, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: *, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string}]|[{nameLast: string, uId: number, nameFirst: string, handleStr: string, email: string}]|[]|*), name, isPublic: (boolean|*)}}
 */
export function channelDetailsV3(authUserId: number | string, channelId: number) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  // rejects uIds that cannot be found
  if (data.users.find(objProp => objProp.uId === authUserId) === undefined) {
    throw HTTPError(400, 'Invalid uId');
  }

  const objProp = data.channels.find(objProper => objProper.channelId === channelId);

  if (objProp === undefined) {
    throw HTTPError(400, 'Invalid ChannelId');
  }

  // find matching uId in data.channels.owner/allMembers
  if ((objProp.ownerMembers.find(ownerProp => ownerProp.uId === authUserId)) !== undefined ||
    (objProp.allMembers.find(allProp => allProp.uId === authUserId)) !== undefined) {
    return {
      name: objProp.name,
      isPublic: objProp.isPublic,
      ownerMembers: objProp.ownerMembers,
      allMembers: objProp.allMembers
    };
  } else {
    throw HTTPError(403, 'Not member of this channel');
  }
}

/**
 *
 * @param authUserId
 * @param channelId
 * @returns {{error: string}|{}}
 */
export function channelJoinV3(authUserId: number | string, channelId: number) {
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (checkValidUserId(authUserId) !== true) {
    throw HTTPError(400, 'Invalid uId');
  }

  if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid ChannelId');
  }

  const data = getData();
  const objProp = data.channels.find(objProp => objProp.channelId === channelId);

  // find matching uId in data.channels.owner/allMembers
  if ((objProp.ownerMembers.find(ownerProp => ownerProp.uId === authUserId)) !== undefined ||
    (objProp.allMembers.find(allProp => allProp.uId === authUserId)) !== undefined) {
    throw HTTPError(400, 'Already member of channel');
  }

  if ((objProp.isPublic !== true)) {
    // You are the Global Owner, you can be added allMembers
    if (authUserId === 1) {
      // Unfiltered user information should be pushed, I think it should be up to channelDetailsV3 to hide the user information
      objProp.allMembers.push(getUserDetails(authUserId) as channelMembers);
      // User Channel Statistic
    } else {
      throw HTTPError(403, 'Trying to join private channel');
    }
  } else {
    // Unfiltered user information should be pushed, I think it should be up to channelDetailsV3 to hide the user information
    objProp.allMembers.push(getUserDetails(authUserId) as channelMembers);
    // User Channel Statistic
  }

  setData(data);
  addUserChannelStatistic(authUserId as number);
  return {};
}

// Iteration 2 functions
export function channelLeaveV2(token: string, channelId: number) {
  // test whether valid token
  const userId: number | string = tokenFinder(token);
  if (userId === 'Invalid token' || typeof (userId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  // check for invalid channelid
  if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid ChannelId');
  }

  // Check that user is part of the channel
  if (!checkIfInChannel(userId, channelId)) {
    throw HTTPError(403, 'User is not part of the channel');
  }

  const data = getData();
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      let i = 0;
      for (const ownerMember of channel.ownerMembers) {
        if (ownerMember.uId === userId) {
          channel.ownerMembers.splice(i, 1);
        } else {
          i++;
        }
      }
      i = 0;
      for (const allMember of channel.allMembers) {
        if (allMember.uId === userId) {
          channel.allMembers.splice(i, 1);
        } else {
          i++;
        }
      }
    }
  }
  setData(data);
  removeUserChannelStatistic(userId as number);
  return {};
}

export function channelAddownerV2(token: string, channelId: number, uId: number) {
  const data = getData();
  // test whether valid token
  const userId: number | string = tokenFinder(token);
  if (userId === 'Invalid token' || typeof (userId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  // check for invalid channelid
  if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid channel Id');
  }

  // check for invalid user id
  if (!checkValidUserId(uId)) {
    throw HTTPError(400, 'Invalid user Id');
  }
  // Check that user is not already an owner member
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      for (const ownerMembers of channel.ownerMembers) {
        if (ownerMembers.uId === uId) {
          throw HTTPError(400, 'User already an owner member');
        } else if (!checkIfInChannel(uId, channelId)) { // Check that user is part of the channel
          throw HTTPError(400, 'user not in channel');
        }
      }
    }
  }

  // Check that authorised user has permissions
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      let check = 0;
      for (const ownermembers of channel.ownerMembers) {
        if (ownermembers.uId === userId) {
          check = 1;
        }
      }
      if (check === 0) {
        throw HTTPError(403, 'Authorised user does not have permissions');
      }
    }
  }

  // Add user to owner members
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      const newOwner: user = getUserDetails(uId) as user;
      channel.ownerMembers.push(newOwner);
    }
  }
  setData(data);
  return {};
}

export function channelRemoveOwnerV2(token: string, channelId: number, uId: number) {
  const data = getData();
  // test whether valid token
  const userId: number | string = tokenFinder(token);
  if (userId === 'Invalid token' || typeof (userId) === 'string') {
    throw HTTPError(403, 'Invalid token');
  }

  // check for invalid channelid
  if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid ChannelId');
  }

  // check for invalid user id
  if (!checkValidUserId(uId)) {
    throw HTTPError(400, 'Invalid uId');
  }

  // Check that user is not the only owner member
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      if (channel.ownerMembers.length === 1) {
        throw HTTPError(400, 'Only One Owner Member');
      }
    }
  }

  // Check that authorised user has permissions
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      let check = 0;
      for (const ownermembers of channel.ownerMembers) {
        if (ownermembers.uId === userId) {
          check = 1;
        }
      }
      if (check === 0) {
        throw HTTPError(403, 'Authorised user does not have permissions');
      }
    }
  }

  if (!checkIfInChannelOwners(uId, channelId)) {
    throw HTTPError(400, 'User is not an owner member');
  }
  let i = 0;
  // Check that user to be removed is an owner member
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      for (const ownermembers of channel.ownerMembers) {
        if (ownermembers.uId === uId) {
          break;
        }
        i++;
      }
    }
  }

  // Remove user from owner members.
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      channel.ownerMembers.splice(i, 1);
    }
  }
  setData(data);
  return {};
}
