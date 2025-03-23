import { channelMembers, getData, setData } from './dataStore';
import HTTPError from 'http-errors';
import { checkIfInChannel, checkValidChannelId, getUserDetails } from './other';
// import { messageSendV2 } from './message';

export const standupStartV1 = (authUserId: number | string, channelId: number, length: number) => {
  const data = getData();
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid token');
  } else if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid channel');
  } else if (!checkIfInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'Channel is valid, however user is not member of channel');
  } else if (length < 0) {
    throw HTTPError(400, 'Standup length cannot be negative');
  } else if (standupActiveV1(authUserId, channelId).isActive) {
    throw HTTPError(400, 'Another standup is already active on this channel');
  }

  const timeFinish = Math.floor((new Date()).getTime() / 1000) + length;
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      channel.standupActive = true;
      channel.standupFinishTime = timeFinish;
      setData(data);
    }
  }
  // setTimeout(() => {
  //   const data = getData();
  //   for (const channel of data.channels) {
  //     if (channel.channelId === channelId) {
  //       channel.standupActive = false;
  //       const packagedMessage = channel.standup.join('\n');
  //       channel.standup = [];
  //       setData(data);
  //       console.log(packagedMessage);
  //       messageSendV2(authUserId, channelId, packagedMessage);
  //     }
  //   }
  // }, length * 1000);

  // Message May be passing in undefined
  return { timeFinish };
};

export const standupActiveV1 = (authUserId: number | string, channelId: number) => {
  const data = getData();
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid token');
  } else if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid channel');
  } else if (!checkIfInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'Channel is valid, however user is not member of channel');
  }

  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      return {
        isActive: channel.standupActive,
        timeFinish: channel.standupFinishTime,
      };
    }
  }
};

export const standupSendV1 = (authUserId: number | string, channelId: number, message: string) => {
  const data = getData();
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid token');
  } else if (!checkValidChannelId(channelId)) {
    throw HTTPError(400, 'Invalid channel');
  } else if (!checkIfInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'Channel is valid, however user is not member of channel');
  } else if (message.length > 1000) {
    throw HTTPError(400, 'Message length cannot exceed 1000 characters');
  } else if (!standupActiveV1(authUserId, channelId).isActive) {
    throw HTTPError(400, 'No standup active in channel');
  }

  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      const userDetails = getUserDetails(authUserId) as channelMembers;
      const handleStr = userDetails.handleStr;
      const bufferMessage = `${handleStr}: ${message}`;
      channel.standup.push(bufferMessage);
      setData(data);
    }
  }
  return {};
};
