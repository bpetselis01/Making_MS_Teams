import HTTPError from 'http-errors';
import { channelMessages, channels, dm, getData } from './dataStore';
import { checkInMessage, tokenFinder } from './other';

export const searchV1 = (token: string, queryStr: string): { messages: channelMessages[] } => {
  const data = getData();
  if (tokenFinder(token) === 'Invalid token') {
    throw HTTPError(403, 'Invalid Token');
  }
  if (queryStr.length > 1000 || queryStr.length < 1) {
    throw HTTPError(400, 'Invalid query string length');
  }

  const userId: number | string = tokenFinder(token) as number;

  let messages: channelMessages[] = [];
  for (const channel of data.channels) {
    const allMemberIds = [];
    for (const member of channel.allMembers) {
      allMemberIds.push(member.uId);
    }
    console.log(channel);
    if (allMemberIds.includes(userId)) {
      messages = messages.concat(searchMessagesChannel(channel, queryStr).newArray);
    }
  }

  for (const dm of data.dms) {
    if (dm.uIds.includes(userId) || userId === dm.creatorId) {
      messages = messages.concat(searchMessagesDms(dm, queryStr).newArray);
    }
  }
  console.log(messages);
  return { messages };
};

const searchMessagesChannel = (channel: channels, queryStr: string): { newArray: channelMessages[] } => {
  let newArray: channelMessages[] = [];
  for (const message of channel.messages) {
    if (checkInMessage(queryStr, message.message)) {
      newArray = newArray.concat(message);
    }
  }
  return { newArray };
};

const searchMessagesDms = (dm: dm, queryStr: string): { newArray: channelMessages[] } => {
  let newArray: channelMessages[] = [];
  for (const message of dm.messages) {
    if (checkInMessage(queryStr, message.message)) {
      newArray = newArray.concat(message);
    }
  }
  return { newArray };
};
