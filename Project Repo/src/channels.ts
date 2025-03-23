import { channels, getData, setData } from './dataStore';
import {
  addUserChannelStatistic,
  addWorkspaceChannelStatistic,
  checkValidChannelId,
  checkValidUserId,
  getUserDetails
} from './other';
import HTTPError from 'http-errors';

// Interfaces:
interface user {
  uId: number,
  nameFirst: string,
  nameLast: string;
  email: string,
  handleStr?: string,
  password?: string
}

export interface returnChannelCreate {
  channelId: number;
}

// interface error {error: string}
//
// Creates a channel with a name and public/private status from a give user

/**
 *
 * @param authUserId
 * @param name
 * @param isPublic
 * @returns {{error: string}|{channelId: number}}
 */

export function channelsCreateV1(authUserId: number | string, name: string, isPublic: boolean) {
  if (name.length < 1 || name.length > 20) {
    throw HTTPError(400, 'Invalid Name For Channel');
  }

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  // Return an error if uId does not exist
  if (!checkValidUserId(authUserId)) {
    throw HTTPError(400, 'Invalid uId');
  }

  let index = 1;
  let channelId = 1;

  while (true) {
    if (checkValidChannelId(index)) {
      index++;
    } else {
      channelId = index;
      break;
    }
  }

  // Creates a channel id and a new channel with the given details
  // const channelId = data.channels.length + 1;

  const user = getUserDetails(authUserId) as user;
  const data = getData();

  const newChannel: channels = {
    channelId: channelId,
    name: name,
    isPublic: isPublic,
    standupActive: false,
    standupFinishTime: null,
    standup: [],
    messages: [],
    ownerMembers: [{
      uId: authUserId,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      email: user.email,
      handleStr: user.handleStr,
    }],
    allMembers: [{
      uId: authUserId,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      email: user.email,
      handleStr: user.handleStr,
    }],
  };

  // pushes the new channel to the end of the channel array
  data.channels.push(newChannel);
  setData(data);
  addWorkspaceChannelStatistic();
  addUserChannelStatistic(authUserId as number);

  return { channelId };
}

// Lists all the channels in the channel array
/**
 *
 * @param authUserId
 * @returns {{error: string}|{channels: *}}
 */
export function channelsListAllV3(authUserId: number | string) {
  const data = getData();

  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidUserId(authUserId)) {
    throw HTTPError(400, 'Invalid uId');
  }

  // Creates a new array of channels out of the array that the user belongs to
  const channels = [];
  for (const channel of data.channels) {
    channels.push(
      {
        channelId: channel.channelId,
        name: channel.name
      }
    );
  }

  for (const channel of data.channels) {
    for (const message of channel.messages) {
      for (const react of message.reacts) {
        react.isThisUserReacted = !!react.uIds.includes(authUserId);
      }
    }
  }

  return { channels };
}

// Lists all the channels in which the authorised user belongs to
/**
 *
 * @param authUserId
 * @returns {{error: string}|{channels: *[]}}
 */

export function channelsListV3(authUserId: number | string) {
  const data = getData();
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidUserId(authUserId)) {
    throw HTTPError(400, 'Invalid uId');
  }

  // Creates a new array of channels out of the array that the user belongs to
  const channels = [];
  for (const channel of data.channels) {
    for (const user of channel.allMembers) {
      if (user.uId === authUserId) {
        channels.push(
          {
            channelId: channel.channelId,
            name: channel.name
          }
        );
      }
    }
  }

  for (const channel of data.channels) {
    for (const message of channel.messages) {
      for (const react of message.reacts) {
        react.isThisUserReacted = !!react.uIds.includes(authUserId);
      }
    }
  }

  return { channels };
}
