import { channelMembers, dm, getData, setData } from './dataStore';
import {
  addNotification,
  addUserDmStatistic,
  addWorkspaceDmStatistic,
  checkUserInDm,
  checkUserIsDmOwner,
  checkValidDmId,
  checkValidUserId,
  generateUniqueDmId,
  getHandleString,
  getUserDetails,
  removeUserDmStatistic,
  removeWorkspaceDmStatistic,
  removeWorkspaceMessageStatistic
} from './other';
import HTTPError from 'http-errors';

export interface returnDmCreate {
  dmId: number;
}

/**
 *
 * @param authUserId
 * @param uIds
 */
export function dmCreateV2(authUserId: number | string, uIds: Array<number>) {
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidUserId(authUserId)) {
    throw HTTPError(400, 'Invalid authUserId');
  }
  for (const uId of uIds) {
    if (!checkValidUserId(uId)) {
      throw HTTPError(400, 'Invalid uId');
    }
  }
  if (new Set(uIds).size !== uIds.length) {
    throw HTTPError(400, 'Duplicate uIds');
  }

  const allHandles = [];
  const creatorUserDetails = getUserDetails(authUserId) as channelMembers;
  allHandles.push(creatorUserDetails.handleStr);
  for (const uId of uIds) {
    const userDetails = getUserDetails(uId) as channelMembers;
    allHandles.push(userDetails.handleStr);
  }
  allHandles.sort();
  const dmName = allHandles.join(', ');
  const dmId = generateUniqueDmId();
  const dm: dm = {
    dmId: dmId,
    creatorId: authUserId,
    uIds: uIds,
    name: dmName,
    messages: [],
  };

  // Send notifications
  for (const uId of dm.uIds) {
    const handlestr = getHandleString(authUserId);

    const notification = {
      channelId: -1,
      dmId: dm.dmId,
      notificationMessage: handlestr + ' added you to ' + dm.name,
    };
    addNotification(uId, notification);
  }

  const data = getData();
  data.dms.push(dm);
  setData(data);

  addUserDmStatistic(authUserId as number);
  for (const uId of uIds) {
    addUserDmStatistic(uId as number);
  }
  addWorkspaceDmStatistic();

  return { dmId };
}

export function dmListV2(authUserId: number | string) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  const dms = [];
  for (const dm of data.dms) {
    if (dm.creatorId === authUserId) {
      dms.push(
        {
          dmId: dm.dmId,
          name: dm.name
        });
    } else {
      for (const uId of dm.uIds) {
        if (uId === authUserId) {
          dms.push(
            {
              dmId: dm.dmId,
              name: dm.name,
            });
        }
      }
    }
  }
  return { dms };
}

export function dmRemoveV2(authUserId: number | string, dmId: number) {
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }
  if (!checkValidDmId(dmId)) {
    throw HTTPError(400, 'Invalid dmId');
  }
  if (!checkUserInDm(authUserId, dmId)) {
    throw HTTPError(403, 'User no longer in DM');
  }

  if (!checkUserIsDmOwner(authUserId, dmId)) {
    throw HTTPError(403, 'Not DM Creator');
  }

  const data = getData();

  let tempStore;

  for (let dmIndex = 0; dmIndex < data.dms.length; dmIndex++) {
    if (data.dms[dmIndex].dmId === dmId) {
      tempStore = data.dms[dmIndex];
      data.dms.splice(dmIndex, 1);
    }
  }

  setData(data);

  if (tempStore.dmId === dmId) {
    for (const message of tempStore.messages) {
      removeWorkspaceMessageStatistic();
      if (message === undefined) {
        return 0;
      }
    }
  }

  for (const user of data.users) {
    removeUserDmStatistic(user.uId);
  }

  removeWorkspaceDmStatistic();

  return {};
}

export function dmDetailsV2(authUserId: number | string, dmId: number) {
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }
  if (!checkValidDmId(dmId)) {
    throw HTTPError(400, 'Invalid dmId');
  }
  if (!checkUserInDm(authUserId, dmId)) {
    throw HTTPError(403, 'User not found');
  }
  const data = getData();
  for (const dm of data.dms) {
    if (dm.dmId === dmId) {
      const members = [];
      if (dm.creatorId !== undefined) {
        members.push(getUserDetails(dm.creatorId));
      }
      for (const uId of dm.uIds) {
        members.push(getUserDetails(uId));
      }
      return {
        name: dm.name,
        members: members,
      };
    }
  }
  return { error: 'error3' };
}

export function dmLeaveV2(authUserId: number | string, dmId: number) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidDmId(dmId)) {
    throw HTTPError(400, 'Invalid dmId');
  }

  if (!checkUserInDm(authUserId, dmId)) {
    throw HTTPError(403, 'User not in Dm');
  }

  for (const dm of data.dms) {
    if (dm.dmId === dmId) {
      if (authUserId === dm.creatorId) {
        dm.creatorId = undefined;
        setData(data);
        removeUserDmStatistic(authUserId as number);
        return {};
      }
      let i = 0;
      for (const uId of dm.uIds) {
        if (uId === authUserId) {
          dm.uIds.splice(i, 1);
        } else {
          i++;
        }
      }
      dm.uIds.splice(i, 1);
    }
  }
  setData(data);
  removeUserDmStatistic(authUserId as number);
  return {};
}

export function dmMessagesV2(authUserId: number | string, dmId: number, start: number) {
  const data = getData();
  console.log(data.dms);
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidDmId(dmId)) {
    throw HTTPError(400, 'Invalid dmId');
  }

  if (!checkValidUserId(authUserId)) {
    throw HTTPError(400, 'Invalid User');
  }

  const dm: dm = data.dms.find(objProp => objProp.dmId === dmId);

  // if (typeof(dm.messages.length) === 'undefined') {
  //   return {error: 'No Messages Found'};
  // }

  if (start > dm.messages.length) {
    throw HTTPError(400, 'Start point non existent');
  }

  let isMember = false;
  for (const uId of dm.uIds) {
    if (uId === authUserId) {
      isMember = true;
      break;
    }
  }
  if (dm.creatorId === authUserId) {
    isMember = true;
  }
  if (!isMember) {
    throw HTTPError(403, 'Not member of dm');
  }

  let end = start + 50;
  let messages;
  if (end >= dm.messages.length) {
    end = -1;
    messages = dm.messages.slice(start, dm.messages.length);
  } else {
    messages = dm.messages.slice(start, end);
  }

  return {
    messages: messages,
    start: start,
    end: end,
  };
}
