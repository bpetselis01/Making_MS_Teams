import { getData, setData } from './dataStore';
import HTTPError from 'http-errors';
import {
  addNotification,
  addUserMessageStatistic,
  addWorkspaceMessageStatistic,
  checkIfInChannel,
  checkIfInChannelOwners,
  checkIfInDm,
  checkIfSent,
  checkInMessage,
  checkUserInDm,
  checkUserIsDmOwner,
  checkUserIsGlobalOwner,
  checkValidChannelId,
  checkValidDmId,
  checkValidMessageId,
  generateUniqueMessageId,
  getHandleString,
  getMessage,
  removeWorkspaceMessageStatistic
} from './other';

export interface returnMessageSend {
  messageId: number;
}

export function messageSendV2(authUserId: number | string, channelId: number, message: string) {
  const data = getData();

  // Test invalid token
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid token');
  }

  // Test length
  if (message.length === 0 || message.length > 1000) {
    throw HTTPError(400, 'Invalid length');
  }

  // Test valid channel Id
  if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid Channel Id');
  }

  // Test if in channel
  if (!checkIfInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'User is not in channel');
  }

  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      const messageId = generateUniqueMessageId();
      channel.messages.push({
        messageId: messageId,
        uId: authUserId,
        message: message,
        timeSent: Math.floor((new Date()).getTime() / 1000),
        isPinned: false,
        reacts: []
      });
      setData(data);
      const handlestr = getHandleString(authUserId);

      // Check if anyone is tagged
      console.log(message);
      console.log(channel.allMembers);
      for (const user of channel.allMembers) {
        if (checkInMessage('@' + user.handleStr, message)) {
          const notification = {
            channelId: channelId,
            dmId: -1,
            notificationMessage: handlestr + ' tagged you in ' + channel.name + ': ' + message.slice(0, 20),
          };
          addNotification(user.uId, notification);
        }
      }
      addUserMessageStatistic(authUserId);
      addWorkspaceMessageStatistic();
      return { messageId: messageId };
    }
  }
  throw HTTPError(400, 'Invalid ChannelId');
}

export function messageEditV2(authUserId: number | string, messageId: number, newMessageText: string) {
  const data = getData();

  // Test invalid token
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid token');
  }

  // Test length
  if (newMessageText.length > 1000) {
    throw HTTPError(400, 'Invalid length');
  }

  for (const channel in data.channels) {
    for (let i = 0; i < data.channels[channel].messages.length; i++) {
      if (messageId === data.channels[channel].messages[i].messageId) {
        if (!checkIfInChannel(authUserId, data.channels[channel].channelId)) {
          throw HTTPError(403, 'user is not in channel');
        }
        const userSentMessage = (data.channels[channel].messages[i].uId === authUserId);
        const userIsChannelOwner = checkIfInChannelOwners(authUserId, data.channels[channel].channelId);
        const userIsGlobalOwner = checkUserIsGlobalOwner(authUserId);
        if (!(userSentMessage || userIsChannelOwner || userIsGlobalOwner)) {
          throw HTTPError(403, 'user is not authorised to remove message');
        }
        if (newMessageText === '') {
          data.channels[channel].messages.splice(i, 1);
        } else {
          const newmessage = {
            isPinned: false,
            reacts: [],
            messageId: messageId,
            uId: data.channels[channel].messages[i].uId,
            message: newMessageText,
            timeSent: data.channels[channel].messages[i].timeSent,
          };
          data.channels[channel].messages.splice(i, 1, newmessage);
        }
        setData(data);
        return {};
      }
    }
  }
  for (const dm in data.dms) {
    for (let j = 0; j < data.dms[dm].messages.length; j++) {
      if (messageId === data.dms[dm].messages[j].messageId) {
        if (!checkUserInDm(authUserId, data.dms[dm].dmId)) {
          throw HTTPError(403, 'user is not in dm');
        }
        const userSentMessage = (data.dms[dm].messages[j].uId === authUserId);
        const userIsDmOwner = checkUserIsDmOwner(authUserId, data.dms[dm].dmId);
        if (!(userSentMessage || userIsDmOwner)) {
          throw HTTPError(403, 'user is not authorised to remove message');
        }
        if (newMessageText === '') {
          data.dms[dm].messages.splice(j, 1);
        } else {
          const newMessage = {
            isPinned: false,
            reacts: [],
            messageId: messageId,
            uId: data.dms[dm].messages[j].uId,
            message: newMessageText,
            timeSent: data.dms[dm].messages[j].timeSent,
          };
          data.dms[dm].messages.splice(j, 1, newMessage);
        }
        setData(data);
        return {};
      }
    }
  }
  throw HTTPError(400, 'Invalid messageId');
}

export function messageRemoveV2(authUserId: number | string, messageId: number) {
  const data = getData();
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid token');
  }

  if (checkIfSent(messageId, authUserId) === false) {
    console.log(1);
    throw HTTPError(400, 'Message not sent');
  }
  console.log(2);

  for (let i = 0; i < data.channels.length; i++) {
    for (let j = 0; j < data.channels[i].messages.length; j++) {
      if (messageId === data.channels[i].messages[j].messageId) {
        if (!checkIfInChannel(authUserId, data.channels[i].channelId)) {
          throw HTTPError(403, 'user is not in channel');
        }
        const userSentMessage = (data.channels[i].messages[j].uId === authUserId);
        const userIsChannelOwner = checkIfInChannelOwners(authUserId, data.channels[i].channelId);
        const userIsGlobalOwner = checkUserIsGlobalOwner(authUserId);
        if (!(userSentMessage || userIsChannelOwner || userIsGlobalOwner)) {
          throw HTTPError(403, 'user is not authorised to remove message');
        }
        data.channels[i].messages.splice(j, 1);
        setData(data);
        removeWorkspaceMessageStatistic();
        return {};
      }
    }
  }
  for (let i = 0; i < data.dms.length; i++) {
    for (let j = 0; j < data.dms[i].messages.length; j++) {
      if (messageId === data.dms[i].messages[j].messageId) {
        if (!checkUserInDm(authUserId, data.dms[i].dmId)) {
          throw HTTPError(403, 'user is not in dm');
        }
        const userSentMessage = (data.dms[i].messages[j].uId === authUserId);
        const userIsDmOwner = data.dms[i].creatorId === authUserId;
        if (!(userSentMessage || userIsDmOwner)) {
          throw HTTPError(403, 'user is not authorised to remove message');
        }

        data.dms[i].messages.splice(j, 1);
        setData(data);
        removeWorkspaceMessageStatistic();
        return {};
      }
    }
  }
  throw HTTPError(400, 'Invalid messageId');
}

export function messageSenddmV2(authUserId: number | string, dmId: number, message: string) {
  const data = getData();
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    console.log(5);
    throw HTTPError(403, 'Invalid token');
  }

  if (message.length === 0 || message.length > 1000) {
    console.log(4);
    throw HTTPError(400, 'Invalid length');
  }

  if (!checkValidDmId(dmId)) {
    console.log(3);
    throw HTTPError(400, 'Invalid dmId');
  }

  if (!checkUserInDm(authUserId, dmId)) {
    console.log(2);
    throw HTTPError(403, 'Invalid Member');
  }

  if (!Array.isArray(data.dms)) {
    console.log(1);
    throw HTTPError(400, 'Invalid dms Array');
  }
  console.log(6);
  for (let i = 0; i < data.dms.length; i++) {
    if (dmId === data.dms[i].dmId) {
      const messageId = generateUniqueMessageId();
      const newMessage = {
        messageId: messageId,
        uId: authUserId,
        message: message,
        timeSent: Math.floor((new Date()).getTime() / 1000),
        isPinned: false,
        reacts: []
      };

      data.dms[i].messages.push(newMessage);
      setData(data);

      // Check if anyone is tagged
      const handlestr = getHandleString(authUserId);
      for (const useruId of data.dms[i].uIds) {
        const userhandlestr = getHandleString(useruId);
        if (checkInMessage('@' + userhandlestr, message)) {
          const notification = {
            channelId: -1,
            dmId: dmId,
            notificationMessage: handlestr + ' tagged you in ' + data.dms[i].name + ': ' + message.slice(0, 20),
          };
          addNotification(useruId, notification);
        }
      }

      // Check if owner is tagged
      const creatorhandlestr = getHandleString(data.dms[i].creatorId);
      if (checkInMessage('@' + creatorhandlestr, message)) {
        const notification = {
          channelId: -1,
          dmId: dmId,
          notificationMessage: handlestr + ' tagged you in ' + data.dms[i].name + ': ' + message.slice(0, 20),
        };
        addNotification(data.dms[i].creatorId, notification);
      }
      addUserMessageStatistic(authUserId);
      addWorkspaceMessageStatistic();
      return { messageId };
    }
  }
  throw HTTPError(400, 'Invalid dmId');
}

export function messagePinV1(authUserId: number | string, messageId: number) {
  const data = getData();
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidMessageId(messageId)) {
    throw HTTPError(400, 'The message is not valid');
  }

  if (checkIfSent(messageId, authUserId) === false) {
    throw HTTPError(400, 'Message not sent');
  }

  for (const channel in data.channels) {
    for (let i = 0; i < data.channels[channel].messages.length; i++) {
      // checks if user is in channel
      if (messageId === data.channels[channel].messages[i].messageId) {
        if (!checkIfInChannel(authUserId, data.channels[channel].channelId)) {
          throw HTTPError(403, 'User not in channel');
        }
        // checks if message is already pinned
        if (data.channels[channel].messages[i].isPinned === true) {
          throw HTTPError(400, 'Message is already pinned');
        }
        // check if user has permissions
        const userSentMessage = data.channels[channel].messages[i].uId === authUserId;
        const userIsChannelOwner = checkIfInChannelOwners(authUserId, data.channels[channel].channelId);
        const userIsGlobalOwner = checkUserIsGlobalOwner(authUserId);
        if (!(userSentMessage || userIsChannelOwner || userIsGlobalOwner)) {
          throw HTTPError(403, 'User does not have permissions');
        } else {
          data.channels[channel].messages[i] = {
            messageId: messageId,
            uId: data.channels[channel].messages[i].uId,
            message: data.channels[channel].messages[i].message,
            timeSent: data.channels[channel].messages[i].timeSent,
            isPinned: true,
            reacts: []
          };
        }
        setData(data);
        return {};
      }
    }
  }
  for (const dm in data.dms) {
    for (let i = 0; i < data.dms[dm].messages.length; i++) {
      // checks if user is in dm
      if (messageId === data.dms[dm].messages[i].messageId) {
        if (!checkIfInDm(authUserId, data.dms[dm].dmId)) {
          throw HTTPError(403, 'User not in dm');
        }
        // checks if message is already pinned
        if (data.dms[dm].messages[i].isPinned === true) {
          throw HTTPError(400, 'Message is already pinned');
        }
        // check if user has permissions
        const userSentMessage = data.dms[dm].messages[i].uId === authUserId;
        // const userIsDmOwner = data.dms[i].creatorId === authUserId;
        const userIsDmOwner = data.dms[dm].creatorId === authUserId;
        const userIsGlobalOwner = checkUserIsGlobalOwner(authUserId);
        if (!(userSentMessage || userIsDmOwner || userIsGlobalOwner)) {
          throw HTTPError(403, 'User does not have permissions');
        } else {
          data.dms[dm].messages[i] = {
            messageId: messageId,
            uId: data.dms[dm].messages[i].uId,
            message: data.dms[dm].messages[i].message,
            timeSent: data.dms[dm].messages[i].timeSent,
            isPinned: true,
            reacts: []
          };
        }
        setData(data);
        return {};
      }
    }
  }
}

export function messageUnpinV1(authUserId: number | string, messageId: number) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidMessageId(messageId)) {
    throw HTTPError(400, 'The message is not valid');
  }

  if (checkIfSent(messageId, authUserId) === false) {
    throw HTTPError(400, 'Message not sent');
  }

  for (const channel in data.channels) {
    for (let i = 0; i < data.channels[channel].messages.length; i++) {
      // checks if user is in channel
      if (messageId === data.channels[channel].messages[i].messageId) {
        if (!checkIfInChannel(authUserId, data.channels[channel].channelId)) {
          throw HTTPError(403, 'User not in channel');
        }
        // checks if message is already unpinned
        if (data.channels[channel].messages[i].isPinned === false) {
          throw HTTPError(400, 'User is already unpinned');
        }
        // check if user has permissions
        const userSentMessage = data.channels[channel].messages[i].uId === authUserId;
        const userIsChannelOwner = checkIfInChannelOwners(authUserId, data.channels[channel].channelId);
        const userIsGlobalOwner = checkUserIsGlobalOwner(authUserId);
        if (!(userSentMessage || userIsChannelOwner || userIsGlobalOwner)) {
          throw HTTPError(403, 'User does not have permissions');
        } else {
          data.channels[channel].messages[i] = {
            messageId: messageId,
            uId: data.channels[channel].messages[i].uId,
            message: data.channels[channel].messages[i].message,
            timeSent: data.channels[channel].messages[i].timeSent,
            isPinned: false,
            reacts: []
          };
        }
        setData(data);
        return {};
      }
    }
  }
  for (const dm in data.dms) {
    for (let i = 0; i < data.dms[dm].messages.length; i++) {
      // checks if user is in dm
      if (messageId === data.dms[dm].messages[i].messageId) {
        if (!checkIfInDm(authUserId, data.dms[dm].dmId)) {
          throw HTTPError(403, 'User not in dm');
        }
        // checks if message is already unpinned
        if (data.dms[dm].messages[i].isPinned === false) {
          throw HTTPError(400, 'User is already unpinned');
        }
        // check if user has permissions
        const userSentMessage = data.dms[dm].messages[i].uId === authUserId;
        const userIsDmOwner = data.dms[dm].creatorId === authUserId;
        // const userIsDmOwner = data.dms[i].creatorId === authUserId;
        const userIsGlobalOwner = checkUserIsGlobalOwner(authUserId);
        if (!(userSentMessage || userIsDmOwner || userIsGlobalOwner)) {
          throw HTTPError(403, 'User does not have permissions');
        } else {
          data.dms[dm].messages[i] = {
            messageId: messageId,
            uId: data.dms[dm].messages[i].uId,
            message: data.dms[dm].messages[i].message,
            timeSent: data.dms[dm].messages[i].timeSent,
            isPinned: false,
            reacts: []
          };
        }
        setData(data);
        return {};
      }
    }
  }
}

export function messageSendlaterV1(authUserId: number | string, channelId: number, message: string, timeSent: number) {
  const data = getData();

  // Test invalid token
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  // Test length
  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'Message is too long or too short');
  }

  // Test valid channel Id
  if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid channel Id');
  }

  // Test if in channel
  if (!checkIfInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'User is not in channel');
  }

  // checks if time is in past
  if (timeSent < Math.floor((new Date()).getTime() / 1000)) {
    throw HTTPError(400, 'Time is in the past');
  }

  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      const messageId = generateUniqueMessageId();
      channel.messages.push({
        messageId: messageId,
        uId: authUserId,
        message: message,
        timeSent: timeSent,
        isPinned: false,
        reacts: []
      });
      setData(data);
      return { messageId: messageId };
    }
  }
}

export function messageSendlaterdmV1(authUserId: number | string, dmId: number, message: string, timeSent: number) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (message.length === 0 || message.length > 1000) {
    throw HTTPError(400, 'Message is too long or too short');
  }

  if (!checkValidDmId(dmId)) {
    throw HTTPError(400, 'Invalid dm Id');
  }

  if (!checkUserInDm(authUserId, dmId)) {
    throw HTTPError(403, 'User is not in dm');
  }

  if (!Array.isArray(data.dms)) {
    return { error: 'error' };
  }

  if (timeSent < Math.floor((new Date()).getTime() / 1000)) {
    throw HTTPError(400, 'Time is in the past');
  }

  for (let i = 0; i < data.dms.length; i++) {
    if (dmId === data.dms[i].dmId) {
      const messageId = generateUniqueMessageId();
      const newMessage = {
        messageId: messageId,
        uId: authUserId,
        message: message,
        timeSent: timeSent,
        isPinned: false,
        reacts: []
      };

      data.dms[i].messages.push(newMessage);
      setData(data);
      return { messageId };
    }
  }
}

export function messageShareV1(authUserId: string | number, ogMessageId: number, message: string, channelId: number, dmId: number) {
  if (message === undefined) {
    message = '';
  }

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    console.log(7);
    throw HTTPError(403, 'Invalid Token');
  }

  if (message.length > 1000) {
    console.log(8);
    throw HTTPError(400, 'Message is longer than 400 characters');
  }

  if (!checkValidDmId(dmId) && dmId !== -1) {
    console.log(9);
    throw HTTPError(400, 'Invalid dm Id');
  }

  if (channelId === -1 && dmId === -1) {
    console.log(10);
    throw HTTPError(400, 'Both channelId and dmId are -1');
  }

  if (channelId !== -1 && dmId !== -1) {
    console.log(11);
    throw HTTPError(400, 'Neither channelId or dmId are -1');
  }

  if (!checkValidChannelId(channelId) && channelId !== -1) {
    console.log(12);
    throw HTTPError(400, 'Invalid channel Id');
  }

  if (!checkUserInDm(authUserId, dmId) && dmId !== -1) {
    console.log(13);
    throw HTTPError(403, 'User is not in dm');
  }

  if (!checkIfInChannel(authUserId, channelId) && channelId !== -1) {
    console.log(14);
    throw HTTPError(403, 'User is not in channel');
  }

  if (!checkValidMessageId(ogMessageId)) {
    throw HTTPError(400, 'The message is not valid');
  }

  if (channelId !== -1) {
    const copiedMessage = getMessage(ogMessageId);
    const sharedMessageId = messageSendV2(authUserId, channelId, copiedMessage.message + message).messageId;
    return { sharedMessageId };
  }

  if (dmId !== -1) {
    const copiedMessage = getMessage(ogMessageId);
    const sharedMessageId = messageSenddmV2(authUserId, dmId, copiedMessage.message + message).messageId;
    return { sharedMessageId };
  }

  throw HTTPError(400);
}

export function messageReactV1(authUserId: string | number, messageId: number, reactId: number) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (reactId !== 1) {
    throw HTTPError(400, 'Invalid react Id');
  }

  if (!checkValidMessageId(messageId)) {
    throw HTTPError(400, 'The message is not valid');
  }

  if (checkIfSent(messageId, authUserId) === false) {
    throw HTTPError(400, 'Message not sent');
  }

  // Check that user is part of respective channel or dm
  let check = 0;
  for (const dm of data.dms) {
    if (dm.uIds.includes(authUserId) || authUserId === dm.creatorId) {
      for (const message of dm.messages) {
        if (message.messageId === messageId) {
          check = 1;
        }
      }
    }
  }
  for (const channel of data.channels) {
    if (checkIfInChannel(authUserId, channel.channelId)) {
      for (const message of channel.messages) {
        if (message.messageId === messageId) {
          check = 1;
        }
      }
    }
  }

  if (check === 0) {
    throw HTTPError(400, 'User is not in channel or dm');
  }

  // Check if already reacted
  const copiedMessage = getMessage(messageId);
  for (const react of copiedMessage.reacts) {
    if (react.reactId === reactId) {
      if (react.uIds.includes(authUserId)) {
        throw HTTPError(400, 'User already reacted');
      }
    }
  }

  for (const dm of data.dms) {
    if (dm.uIds.includes(authUserId) || authUserId === dm.creatorId) {
      for (const message of dm.messages) {
        if (message.messageId === messageId) {
          for (const react of message.reacts) {
            if (react.reactId === reactId) {
              react.uIds.push(authUserId);
              react.isThisUserReacted = true;
              const handlestr = getHandleString(authUserId);
              const notification = {
                channelId: -1,
                dmId: dm.dmId,
                notificationMessage: handlestr + 'reacted to your message in' + dm.name,
              };
              setData(data);
              addNotification(message.uId, notification);
              return;
            }
          }
          message.reacts.push(
            {
              reactId: reactId,
              uIds: [authUserId],
              isThisUserReacted: true,
            }
          );
          const handlestr = getHandleString(authUserId);
          const notification = {
            channelId: -1,
            dmId: dm.dmId,
            notificationMessage: handlestr + ' reacted to your message in ' + dm.name,
          };
          setData(data);
          addNotification(message.uId, notification);
          return;
        }
      }
    }
  }

  for (const channel of data.channels) {
    if (checkIfInChannel(authUserId, channel.channelId)) {
      for (const message of channel.messages) {
        if (message.messageId === messageId) {
          for (const react of message.reacts) {
            if (react.reactId === reactId) {
              react.uIds.push(authUserId);
              const handlestr = getHandleString(authUserId);
              const notification = {
                channelId: channel.channelId,
                dmId: -1,
                notificationMessage: handlestr + ' reacted to your message in ' + channel.name,
              };
              setData(data);
              addNotification(message.uId, notification);
              return {};
            }
          }
          message.reacts.push(
            {
              reactId: reactId,
              uIds: [authUserId],
              isThisUserReacted: true,
            }
          );
          const handlestr = getHandleString(authUserId);
          const notification = {
            channelId: channel.channelId,
            dmId: -1,
            notificationMessage: handlestr + ' reacted to your message in ' + channel.name,
          };
          setData(data);
          addNotification(message.uId, notification);
          return {};
        }
      }
    }
  }

  throw HTTPError(400);
}

export function messageUnreactV1(authUserId: string | number, messageId: number, reactId: number) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (reactId !== 1) {
    throw HTTPError(400, 'Invalid react Id');
  }

  if (!checkValidMessageId(messageId)) {
    throw HTTPError(400, 'The message is not valid');
  }

  if (checkIfSent(messageId, authUserId) === false) {
    throw HTTPError(400, 'Message not sent');
  }

  // Check that user is part of respective channel or dm
  let check = 0;
  for (const dm of data.dms) {
    if (dm.uIds.includes(authUserId) || authUserId === dm.creatorId) {
      for (const message of dm.messages) {
        if (message.messageId === messageId) {
          check = 1;
        }
      }
    }
  }
  for (const channel of data.channels) {
    if (checkIfInChannel(authUserId, channel.channelId)) {
      for (const message of channel.messages) {
        if (message.messageId === messageId) {
          check = 1;
        }
      }
    }
  }
  if (check === 0) {
    throw HTTPError(400, 'User is not in channel or dm');
  }

  const copiedMessage = getMessage(messageId);
  for (const react of copiedMessage.reacts) {
    if (react.reactId === reactId) {
      if (!(react.uIds.includes(authUserId))) {
        throw HTTPError(400, 'User already reacted');
      }
    }
  }

  for (const dm of data.dms) {
    if (dm.uIds.includes(authUserId) || authUserId === dm.creatorId) {
      for (const message of dm.messages) {
        if (message.messageId === messageId) {
          for (const react of message.reacts) {
            if (react.uIds.includes(authUserId)) {
              const index = react.uIds.indexOf(authUserId);
              react.uIds.splice(index, 1);
              react.isThisUserReacted = false;
              setData(data);
              return;
            }
          }
        }
      }
    }
  }

  for (const channel of data.channels) {
    if (checkIfInChannel(authUserId, channel.channelId)) {
      for (const message of channel.messages) {
        if (message.messageId === messageId) {
          for (const react in message.reacts) {
            if (message.reacts[react].uIds.includes(authUserId)) {
              const index = message.reacts[react].uIds.indexOf(authUserId);
              message.reacts[react].uIds.splice(index, 1);
              if (message.reacts[react].uIds.length === 0) {
                message.reacts.splice(react, 1);
              }
              setData(data);
              message.reacts[react].isThisUserReacted = false;
              return {};
            }
          }
        }
      }
    }
  }

  throw HTTPError(400);
}
