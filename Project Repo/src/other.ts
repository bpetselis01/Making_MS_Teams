import { getData, setData } from './dataStore';
import console from 'console';

interface notification {
  channelId: number,
  dmId: number,
  notificationMessage: string,
}

export function clearV1() {
  setData({
    users: [],
    channels: [],
    dms: [],
    usernotifications: [],
    statistics: {
      channelsExist: [
        {
          numChannelsExist: 0,
          timeStamp: new Date().getTime(),
        },
      ],
      dmsExist: [
        {
          numDmsExist: 0,
          timeStamp: new Date().getTime(),
        },
      ],
      messagesExist: [
        {
          numMessagesExist: 0,
          timeStamp: new Date().getTime(),
        },
      ],
      utilizationRate: 0,
    },
  });
  return {};
}

export function checkValidUserId(uId: number) {
  const data = getData();
  for (const user of data.users) {
    if (user.uId === uId) {
      return true;
    }
  }
  return false;
}

export function checkValidChannelId(channelId: number) {
  const data = getData();
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      return true;
    }
  }
  return false;
}

export function generateUniqueMessageId() {
  const allMessageIds = [];
  const data = getData();
  for (const channel of data.channels) {
    for (const message of channel.messages) {
      allMessageIds.push(message.messageId);
    }
  }
  for (const dm of data.dms) {
    for (const message of dm.messages) {
      allMessageIds.push(message.messageId);
    }
  }
  let newMessageId = 0;
  while (allMessageIds.includes(newMessageId)) {
    newMessageId++;
  }
  return newMessageId;
}

/**
 *
 * @param uId
 * @param channelId
 * @returns {boolean}
 */

export function checkIfInChannel(uId: number, channelId: number) {
  const data = getData();
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      for (const user of channel.allMembers) {
        if (user.uId === uId) {
          return true;
        }
      }
    }
  }
  return false;
}

export function checkIfInChannelOwners(uId: number, channelId: number) {
  const data = getData();
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      for (const user of channel.ownerMembers) {
        if (user.uId === uId) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 *
 * @param uId
 * @returns {{error: string}|{nameLast: *, uId, password: *, nameFirst, handleStr: *, email}}
 */
export function getUserDetails(uId: number) {
  const data = getData();
  for (const user of data.users) {
    if (user.uId === uId) {
      return {
        uId: user.uId,
        nameFirst: user.nameFirst,
        nameLast: user.nameLast,
        email: user.email,
        handleStr: user.handleStr,
      };
    }
  }
  return { error: 'error' };
}

export function checkUserIsGlobalOwner(uId: number) {
  const data = getData();
  for (const user of data.users) {
    if (user.uId === uId) {
      return user.globalPermissionId === 1;
    }
  }
  return { error: 'error' };
}

export function checkOnlyGlobalOwner(uId: number) {
  const data = getData();

  let globalOwnerCount = 0;
  for (const user of data.users) {
    if (user.globalPermissionId === 1) {
      globalOwnerCount++;
    }
  }

  if (globalOwnerCount === 1) {
    for (const user of data.users) {
      if (user.uId === uId && user.globalPermissionId === 1) {
        return true;
      }
    }
  }

  return false;
}

export function generateUniqueUserId() {
  const data = getData();
  const allUserIds = [];
  for (const user of data.users) {
    allUserIds.push(user.uId);
  }
  let newUserId = 0;
  while (allUserIds.includes(newUserId)) {
    newUserId++;
  }
  return newUserId;
}

export function generateUniqueDmId() {
  const data = getData();
  const allDmIds = [];
  for (const dm of data.dms) {
    allDmIds.push(dm.dmId);
  }
  let newDmId = 0;
  while (allDmIds.includes(newDmId)) {
    newDmId++;
  }
  return newDmId;
}

export function checkUserInDm(authUserId: number, dmId: number) {
  const data = getData();

  for (const dm of data.dms) {
    if (dm.dmId === dmId) {
      if (dm.creatorId === authUserId) {
        return true;
      }
      if (dm.uIds.includes(authUserId)) {
        return true;
      }
    }
  }
  return false;
}

export function checkUserIsDmOwner(authUserId: number, dmId: number) {
  const data = getData();

  for (const dm of data.dms) {
    if (dm.dmId === dmId) {
      if (dm.creatorId === authUserId) {
        return true;
      }
    }
  }
  return false;
}

export function tokenGenerator() {
  const rand = function () {
    return Math.random().toString(36).substr(2);
  };

  const token = function () {
    return rand() + rand();
  };

  return token();
}

export function tokenFinder(token: string) {
  const data = getData();
  //
  for (const user of data.users) {
    if (user.sessions.includes(token)) {
      return user.uId;
    }
  }
  return 'Invalid token';
}

export function checkValidDmId(dmId: number) {
  const data = getData();
  for (const dm of data.dms) {
    if (dm.dmId === dmId) {
      return true;
    }
  }
  return false;
}

export function checkIfInDm(authUserId: number, dmId: number) {
  const data = getData();
  for (const dm of data.dms) {
    if (dm.dmId === dmId) {
      if (dm.creatorId === authUserId) {
        return true;
      }
      for (const uId of dm.uIds) {
        if (uId === authUserId) {
          return true;
        }
      }
    }
  }
  return false;
}

export function addNotification(uId: number, notification: notification) {
  const data = getData();
  // If user already has notifications then add to this existing array
  for (const usernotification of data.usernotifications) {
    if (usernotification.uId === uId) {
      console.log('1234');
      console.log(data.usernotifications[0]);
      usernotification.notifications.unshift(notification);
      console.log('abcd');
      console.log(data.usernotifications[0]);
      setData(data);
      return;
    }
  }

  // Otherwise create new usernotification object
  const usernotification = {
    uId: uId,
    notifications: [notification],
  };
  data.usernotifications.unshift(usernotification);
  setData(data);
}

export function checkInMessage(phrase: string, message: string) {
  const phrasel = phrase.toLowerCase();
  const messagel = message.toLowerCase();

  if (messagel.includes(phrasel)) {
    return true;
  } else {
    return false;
  }
}

export function getHandleString(authUserId: number) {
  const data = getData();
  for (const user of data.users) {
    if (user.uId === authUserId) {
      return user.handleStr;
    }
  }
}

// export function checkValidImage(imageUrl: string) {
//   var request = new XMLHttpRequest();
//   request.open("GET", imageUrl, true);
//   request.send();
//   request.onload = function() {
//     if (request.status !== 200) {
//       throw HTTPError(400, "Invalid Image URL");
//     }
//   }
//   return {};
// }

export function addUserChannelStatistic(uId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.uId === uId) {
      const statLength = user.channelsJoined.length;
      const lastLog = user.channelsJoined[statLength - 1].numChannelsJoined;

      const addChannelLog = {
        numChannelsJoined: lastLog + 1,
        timeStamp: new Date().getTime(),
      };

      user.channelsJoined.push(addChannelLog);
      setData(data);
    }
  }

  return data;
}

export function removeUserChannelStatistic(uId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.uId === uId) {
      const statLength = user.channelsJoined.length;
      const lastLog = user.channelsJoined[statLength - 1].numChannelsJoined;

      const addChannelLog = {
        numChannelsJoined: lastLog - 1,
        timeStamp: new Date().getTime(),
      };

      user.channelsJoined.push(addChannelLog);
      setData(data);
    }
  }

  return data;
}

export function addUserDmStatistic(uId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.uId === uId) {
      const statLength = user.dmsJoined.length;
      const lastLog = user.dmsJoined[statLength - 1].numDmsJoined;

      const addDmLog = {
        numDmsJoined: lastLog + 1,
        timeStamp: new Date().getTime(),
      };

      user.dmsJoined.push(addDmLog);
      setData(data);
    }
  }

  return data;
}

export function removeUserDmStatistic(uId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.uId === uId) {
      const statLength = user.dmsJoined.length;
      const lastLog = user.dmsJoined[statLength - 1].numDmsJoined;

      const addDmLog = {
        numDmsJoined: lastLog - 1,
        timeStamp: new Date().getTime(),
      };

      user.dmsJoined.push(addDmLog);
      setData(data);
    }
  }

  return data;
}

export function addUserMessageStatistic(uId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.uId === uId) {
      const statLength = user.messagesSent.length;
      const lastLog = user.messagesSent[statLength - 1].numMessagesSent;

      const addMessageLog = {
        numMessagesSent: lastLog + 1,
        timeStamp: new Date().getTime(),
      };

      user.messagesSent.push(addMessageLog);
      setData(data);
    }
  }

  return data;
}

export function removeUserMessageStatistic(uId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.uId === uId) {
      const statLength = user.messagesSent.length;
      const lastLog = user.messagesSent[statLength - 1].numMessagesSent;

      const addMessageLog = {
        numMessagesSent: lastLog - 1,
        timeStamp: new Date().getTime(),
      };

      user.messagesSent.push(addMessageLog);
      setData(data);
    }
  }

  return data;
}

export function totalNumberChannels() {
  const data = getData();

  let count = 0;
  for (const channel of data.channels) {
    if (channel === undefined) {
      return 0;
    }
    count++;
  }
  return count;
}

export function totalNumberDMs() {
  const data = getData();

  let count = 0;
  for (const dm of data.dms) {
    if (dm === undefined) {
      return 0;
    }
    count++;
  }
  return count;
}

export function totalNumberMessages() {
  const data = getData();

  let count = 0;
  for (const channel of data.channels) {
    for (const message of channel.messages) {
      if (message === undefined) {
        return 0;
      }
      count++;
    }
  }

  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (message === undefined) {
        return 0;
      }
      count++;
    }
  }

  return count;
}

export function addWorkspaceChannelStatistic() {
  const data = getData();

  const statLength = data.statistics.channelsExist.length;
  const lastLog = data.statistics.channelsExist[statLength - 1].numChannelsExist;

  const addChannelLog = {
    numChannelsExist: lastLog + 1,
    timeStamp: new Date().getTime(),
  };

  data.statistics.channelsExist.push(addChannelLog);
  setData(data);

  return data;
}

export function addWorkspaceDmStatistic() {
  const data = getData();

  const statLength = data.statistics.dmsExist.length;
  const lastLog = data.statistics.dmsExist[statLength - 1].numDmsExist;

  const addDmLog = {
    numDmsExist: lastLog + 1,
    timeStamp: new Date().getTime(),
  };

  data.statistics.dmsExist.push(addDmLog);
  setData(data);

  return data;
}

export function removeWorkspaceDmStatistic() {
  const data = getData();

  const statLength = data.statistics.dmsExist.length;
  const lastLog = data.statistics.dmsExist[statLength - 1].numDmsExist;

  const addDmLog = {
    numDmsExist: lastLog - 1,
    timeStamp: new Date().getTime(),
  };

  data.statistics.dmsExist.push(addDmLog);
  setData(data);

  return data;
}

export function addWorkspaceMessageStatistic() {
  const data = getData();

  const statLength = data.statistics.messagesExist.length;
  const lastLog = data.statistics.messagesExist[statLength - 1].numMessagesExist;

  const addDmLog = {
    numMessagesExist: lastLog + 1,
    timeStamp: new Date().getTime(),
  };

  data.statistics.messagesExist.push(addDmLog);
  setData(data);

  return data;
}

export function removeWorkspaceMessageStatistic() {
  const data = getData();

  const statLength = data.statistics.messagesExist.length;
  const lastLog = data.statistics.messagesExist[statLength - 1].numMessagesExist;

  const addDmLog = {
    numMessagesExist: lastLog - 1,
    timeStamp: new Date().getTime(),
  };

  data.statistics.messagesExist.push(addDmLog);
  setData(data);

  return data;
}

export function findLastLog(uId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.uId === uId) {
      const statLength = user.channelsJoined.length;
      const lastLog = user.channelsJoined[statLength - 1].numChannelsJoined;

      if (lastLog > 0) {
        return true;
      }
    }
  }

  for (const user of data.users) {
    if (user.uId === uId) {
      const statLength = user.dmsJoined.length;
      const lastLog = user.dmsJoined[statLength - 1].numDmsJoined;

      if (lastLog > 0) {
        return true;
      }
    }
  }

  return false;
}

export function removeUserProfile(uId: number) {
  const data = getData();

  // Editing User Profile
  for (const user of data.users) {
    if (user.uId === uId) {
      user.email = '';
      user.handleStr = '';
      user.nameFirst = 'Removed';
      user.nameLast = 'user';
    }
  }

  setData(data);
  return {};
}

export function userHasBeenRemoved(uId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.nameFirst === 'Removed' && user.nameLast === 'user' && user.uId === uId) {
      return true;
    }
  }

  return false;
}

export function removeUserFromAllChannels(uId: number) {
  const data = getData();
  for (const channel of data.channels) {
    for (const ownerMember of channel.ownerMembers) {
      if (ownerMember.uId === uId) {
        channel.ownerMembers.splice(channel.ownerMembers.indexOf(ownerMember), 1);
      }
    }
    for (const allMember of channel.allMembers) {
      if (allMember.uId === uId) {
        channel.allMembers.splice(channel.allMembers.indexOf(allMember), 1);
      }
    }
  }
  setData(data);
  return data;
}

export function removeUserFromAllDms(uId: number) {
  const data = getData();

  for (const dm of data.dms) {
    if (dm.creatorId === uId) {
      dm.creatorId = undefined;
      // Is this what is supposed to happen?
    } else {
      for (const userId of dm.uIds) {
        if (userId === uId) {
          dm.uIds.splice(dm.uIds.indexOf(uId), 1);
        }
      }
    }
  }

  setData(data);
  console.log(data.dms[0]);
  return data;
}

export function removeUserChannelMessages(uId: number) {
  const data = getData();

  for (const channel of data.channels) {
    for (const message of channel.messages) {
      if (message.uId === uId) {
        message.message = 'Removed user';
      }
    }
  }

  setData(data);
  return {};
}

export function removeUserDmMessages(uId: number) {
  const data = getData();

  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (message.uId === uId) {
        message.message = 'Removed user';
      }
    }
  }

  setData(data);
  return {};
}

export function changeGlobalPermissions(uId: number, permissionId: number) {
  const data = getData();

  for (const user of data.users) {
    if (user.uId === uId) {
      user.globalPermissionId = permissionId;
    }
  }

  setData(data);
  return {};
}

export function checkValidMessageId(messageId: number) {
  const data = getData();
  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (messageId === message.messageId) {
        return true;
      }
    }
  }

  for (const channel of data.channels) {
    for (const message of channel.messages) {
      if (messageId === message.messageId) {
        return true;
      }
    }
  }
  return false;
}

export function getMessage(messageId: number) {
  const data = getData();
  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (messageId === message.messageId) {
        return message;
      }
    }
  }

  for (const channel of data.channels) {
    for (const message of channel.messages) {
      if (messageId === message.messageId) {
        return message;
      }
    }
  }
}

export function checkIfSent(messageId: number, authUserId: number) {
  const data = getData();
  for (const channel in data.channels) {
    for (let i = 0; i < data.channels[channel].messages.length; i++) {
      if (messageId === data.channels[channel].messages[i].messageId) {
        console.log('hi');
        console.log(data.channels[channel]);
        if (Math.floor((new Date()).getTime() / 1000) >= data.channels[channel].messages[i].timeSent) {
          return true;
        }
      }
    }
  }

  for (const dm in data.dms) {
    for (let i = 0; i < data.dms[dm].messages.length; i++) {
      if (messageId === data.dms[dm].messages[i].messageId) {
        if (Math.floor((new Date()).getTime() / 1000) >= data.dms[dm].messages[i].timeSent) {
          return true;
        }
      }
    }
  }
  return false;
}
