import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';
import { requestAuthRegisterV3 } from './auth.test';
import { requestChannelsCreateV2 } from './channels.test';
import { requestChannelAddOwnerV2, requestChannelJoinV2, requestChannelMessagesV2 } from './channel.test';
import { requestDmCreateV2, requestDmMessagesV2 } from './dm.test';

const SERVER_URL = `${url}:${port}`;

interface user {
  token: string;
  authUserId: number;
}

interface channelReturn {
  channelId: number;
}

interface messageReturn {
  messageId: number;
}

interface dmReturn {
  dmId: number;
}

function requestHelper(method: HttpVerb, path: string, payload: any) {
  let qs = {};
  let json = {};
  const headers = { token: payload.token };
  delete payload.token;

  if (['GET', 'DELETE'].includes(method)) {
    qs = payload;
  } else {
    // PUT/POST
    json = payload;
  }
  const res = request(method, SERVER_URL + path, {
    qs,
    json,
    headers
  });

  if (res.isError()) {
    return res.statusCode;
  } else {
    return JSON.parse(res.getBody() as string);
  }

  // return res.isError() ? res.statusCode : JSON.parse(res.getBody('utf-8'));
}

export function requestMessageEditV2(token: string, messageId: number, message: string) {
  return requestHelper('PUT', '/message/edit/v2', {
    token,
    messageId,
    message
  });
}

export function requestMessageRemoveV2(token: string, messageId: number) {
  return requestHelper('DELETE', '/message/remove/v2', {
    token,
    messageId
  });
}

export function requestMessageSendV2(token: string, channelId: number, message: string) {
  return requestHelper('POST', '/message/send/v2', {
    token,
    channelId,
    message
  });
}

export function requestMessageSenddmV2(token: string, dmId: number, message: string) {
  return requestHelper('POST', '/message/senddm/v2', {
    token,
    dmId,
    message
  });
}

export function requestMessageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number) {
  return requestHelper('POST', '/message/share/v1', {
    token,
    ogMessageId,
    message,
    channelId,
    dmId
  });
}

export function requestMessageReactV1(token: string, messageId: number, reactId: number) {
  return requestHelper('POST', '/message/react/v1', {
    token,
    messageId,
    reactId
  });
}

export function requestMessageUnreactV1(token: string, messageId: number, reactId: number) {
  return requestHelper('POST', '/message/unreact/v1', {
    token,
    messageId,
    reactId
  });
}

export function requestMessagePinV1(token: string, messageId: number) {
  return requestHelper('POST', '/message/pin/v1', {
    token,
    messageId
  });
}

export function requestMessageUnpinV1(token: string, messageId: number) {
  return requestHelper('POST', '/message/unpin/v1', {
    token,
    messageId
  });
}

export function requestMessageSendlaterV1(token: string, channelId: number, message: string, timeSent: number) {
  return requestHelper('POST', '/message/sendlater/v1', {
    token,
    channelId,
    message,
    timeSent
  });
}

export function requestMessageSendlaterdmV1(token: string, dmId: number, message: string, timeSent: number) {
  return requestHelper('POST', '/message/sendlaterdm/v1', {
    token,
    dmId,
    message,
    timeSent
  });
}

describe('/message/remove/v1 Tests (channel messages)', () => {
  let user1: user;
  let channel1: channelReturn;
  let message1: messageReturn;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
    message1 = requestMessageSendV2(user1.token, channel1.channelId, 'This is my message');
  });

  test('Fail Case - Invalid token', () => {
    expect(requestMessageRemoveV2(user1.token + 'invalid', message1.messageId)).toStrictEqual(403);
  });

  test('Fail Case - Invalid messageId', () => {
    expect(requestMessageRemoveV2(user1.token, message1.messageId + 1)).toStrictEqual(400);
  });

  test('Fail Case - Channel member deleting other users message', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    requestChannelJoinV2(user2.token, channel1.channelId);
    expect(requestMessageRemoveV2(user2.token, message1.messageId)).toStrictEqual(403);
  });

  test('Fail Case - Non-channel member deleting other users message', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    expect(requestMessageRemoveV2(user2.token, message1.messageId)).toStrictEqual(403);
  });

  test('Fail Case - Global owner deleting other users message from channel they are not in', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const channel2 = requestChannelsCreateV2(user2.token, 'Second Channel', true);
    const message2 = requestMessageSendV2(user2.token, channel2.channelId, 'This is my message 2');
    expect(requestMessageRemoveV2(user1.token, message2.messageId)).toStrictEqual(403);
  });

  test('Success Case - Message deleted by sender', () => {
    requestMessageRemoveV2(user1.token, message1.messageId);
    expect(requestChannelMessagesV2(user1.token, channel1.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [],
      start: 0,
    });
  });

  test('Success Case - Message deleted by global owner who is member of channel', () => {
    const user2 = requestAuthRegisterV3('validemail@gmail1.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const channel2 = requestChannelsCreateV2(user2.token, 'Second Channel', true);
    const message2 = requestMessageSendV2(user2.token, channel2.channelId, 'This is my message 2');
    requestChannelJoinV2(user1.token, channel2.channelId);
    requestMessageRemoveV2(user1.token, message2.messageId);
    expect(requestChannelMessagesV2(user1.token, channel2.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [],
      start: 0,
    });
  });

  test('Success Case - Message deleted by non global owner who is owner member of channel', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    requestChannelJoinV2(user2.token, channel1.channelId);
    requestChannelAddOwnerV2(user1.token, channel1.channelId, user2.authUserId);
    requestMessageRemoveV2(user2.token, message1.messageId);
    expect(requestChannelMessagesV2(user1.token, channel1.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [],
      start: 0,
    });
  });
});

describe('/message/remove/v1 Tests (dm messages)', () => {
  let user1: user;
  let dm1: dmReturn;
  let message1: messageReturn;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    dm1 = requestDmCreateV2(user1.token, []);
    message1 = requestMessageSenddmV2(user1.token, dm1.dmId, 'This is my message');
  });

  test('Fail Case - Invalid token', () => {
    expect(requestMessageRemoveV2(user1.token + 'invalid', message1.messageId)).toStrictEqual(403);
  });

  test('Fail Case - Invalid messageId', () => {
    expect(requestMessageRemoveV2(user1.token, message1.messageId + 1)).toStrictEqual(400);
  });

  test('Fail Case - Dm member deleting other users message', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const dm2 = requestDmCreateV2(user2.token, [user1.authUserId]);
    const message2 = requestMessageSenddmV2(user2.token, dm2.dmId, 'This is my message 2');
    expect(requestMessageRemoveV2(user1.token, message2.messageId)).toStrictEqual(403);
  });

  test('Fail Case - Non-dm member deleting other users message', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    expect(requestMessageRemoveV2(user2.token, message1.messageId)).toStrictEqual(403);
  });

  test('Fail Case - Global owner deleting other users message from dm they are not in', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const dm2 = requestDmCreateV2(user2.token, []);
    const message2 = requestMessageSenddmV2(user2.token, dm2.dmId, 'This is my message 2');
    expect(requestMessageRemoveV2(user1.token, message2.messageId)).toStrictEqual(403);
  });

  test('Success Case - Message deleted by sender', () => {
    requestMessageRemoveV2(user1.token, message1.messageId);
    expect(requestDmMessagesV2(user1.token, dm1.dmId, 0)).toStrictEqual({
      end: -1,
      messages: [],
      start: 0,
    });
  });

  test('Success Case - Message deleted by dm owner', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const dm2 = requestDmCreateV2(user2.token, [user1.authUserId]);
    const message2 = requestMessageSenddmV2(user1.token, dm2.dmId, 'This is my message 2');
    requestMessageRemoveV2(user2.token, message2.messageId);
    expect(requestDmMessagesV2(user1.token, dm2.dmId, 0)).toStrictEqual({
      end: -1,
      messages: [],
      start: 0,
    });
  });
});

describe('/message/edit/v1 Tests (messages in channels)', () => {
  let user1: user;
  let channel1: channelReturn;
  let message1: messageReturn;
  let newmessage: string;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
    message1 = requestMessageSendV2(user1.token, channel1.channelId, 'This is my message');
    newmessage = 'All other branches wish they could be as cool as Seb Branch';
  });

  test('Fail Case - Invalid token', () => {
    expect(requestMessageEditV2(user1.token + 'invalid', message1.messageId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Invalid messageId', () => {
    expect(requestMessageEditV2(user1.token, message1.messageId + 1, newmessage)).toStrictEqual(400);
  });

  test('Fail Case - Channel member changing other users message', () => {
    const user2 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const channel2 = requestChannelsCreateV2(user2.token, 'Second Channel', true);
    requestMessageSendV2(user2.token, channel2.channelId, 'This is my message 2');
    requestChannelJoinV2(user2.token, channel1.channelId);
    expect(requestMessageEditV2(user2.token, message1.messageId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Non-channel member changing other users message', () => {
    const user2 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const channel2 = requestChannelsCreateV2(user2.token, 'Second Channel', true);
    requestMessageSendV2(user2.token, channel2.channelId, 'This is my message 2');
    expect(requestMessageEditV2(user2.token, message1.messageId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Global owner changing other users message from channel they are not in', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const channel2 = requestChannelsCreateV2(user2.token, 'Second Channel', true);
    const message2 = requestMessageSendV2(user2.token, channel2.channelId, 'This is my message 2');
    expect(requestMessageEditV2(user1.token, message2.messageId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Message Length Exceeds 1000 Characters', () => {
    const longstring = 'i'.repeat(1001);
    expect(requestMessageEditV2(user1.token, message1.messageId, longstring)).toStrictEqual(400);
  });

  test('Success Case - Message Edited', () => {
    requestMessageEditV2(user1.token, message1.messageId, newmessage);
    const timeSent = Math.floor((new Date()).getTime() / 1000);
    const channelMessages = requestChannelMessagesV2(user1.token, channel1.channelId, 0);
    expect(channelMessages).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          messageId: message1.messageId,
          uId: user1.authUserId,
          message: newmessage,
          timeSent: expect.any(Number),
        }
      ],
      start: 0,
    });
    expect(channelMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent - 3);
    expect(channelMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent + 3);
  });

  test('Success Case - Message edited with empty string', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const channel2 = requestChannelsCreateV2(user2.token, 'Second Channel', true);
    const message2 = requestMessageSendV2(user2.token, channel2.channelId, 'This is my message 2');
    requestChannelJoinV2(user1.token, channel2.channelId);
    requestMessageEditV2(user1.token, message2.messageId, '');
    expect(requestChannelMessagesV2(user1.token, channel2.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [],
      start: 0,
    });
  });

  test('Success Case - Message edited by non global owner who is owner member of channel', () => {
    const timeSent = Math.floor((new Date()).getTime() / 1000);
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    requestChannelJoinV2(user2.token, channel1.channelId);
    requestChannelAddOwnerV2(user1.token, channel1.channelId, user2.authUserId);
    requestMessageEditV2(user2.token, message1.messageId, newmessage);
    const channelMessages = requestChannelMessagesV2(user1.token, channel1.channelId, 0);
    expect(channelMessages).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          messageId: message1.messageId,
          uId: user1.authUserId,
          message: newmessage,
          timeSent: expect.any(Number),
        }
      ],
      start: 0,
    });
    expect(channelMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent - 3);
    expect(channelMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent + 3);
  });
});

describe('/message/edit/v1 Tests (messages in dms)', () => {
  let user1: user;
  let dm1: dmReturn;
  let message1: messageReturn;
  let newmessage: string;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    dm1 = requestDmCreateV2(user1.token, []);
    message1 = requestMessageSenddmV2(user1.token, dm1.dmId, 'This is my message');
    newmessage = 'All other branches wish they could be as cool as Seb Branch';
  });

  test('Fail Case - Invalid token', () => {
    expect(requestMessageEditV2(user1.token + 'invalid', message1.messageId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Invalid messageId', () => {
    expect(requestMessageEditV2(user1.token, message1.messageId + 1, newmessage)).toStrictEqual(400);
  });

  test('Fail Case - Dm member changing other users message', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const dm2 = requestDmCreateV2(user2.token, [user1.authUserId]);
    const message2 = requestMessageSenddmV2(user2.token, dm2.dmId, 'This is my message 2');
    expect(requestMessageEditV2(user1.token, message2.messageId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Non-dm member changing other users message', () => {
    const user2 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    expect(requestMessageEditV2(user2.token, message1.messageId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Global owner changing other users message from dm they are not in', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const dm2 = requestDmCreateV2(user2.token, []);
    const message2 = requestMessageSenddmV2(user2.token, dm2.dmId, 'This is my message 2');
    expect(requestMessageEditV2(user1.token, message2.messageId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Message Length Exceeds 1000 Characters', () => {
    const longstring = 'i'.repeat(1001);
    expect(requestMessageEditV2(user1.token, message1.messageId, longstring)).toStrictEqual(400);
  });

  test('Success Case - Message Edited', () => {
    requestMessageEditV2(user1.token, message1.messageId, newmessage);
    const timeSent = Math.floor((new Date()).getTime() / 1000);
    const dmMessages = requestDmMessagesV2(user1.token, dm1.dmId, 0);
    expect(dmMessages).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          messageId: message1.messageId,
          uId: user1.authUserId,
          message: newmessage,
          timeSent: expect.any(Number),
        }
      ],
      start: 0,
    });
    expect(dmMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent - 3);
    expect(dmMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent + 3);
  });

  test('Success Case - Message edited with empty string', () => {
    requestMessageEditV2(user1.token, message1.messageId, '');
    expect(requestDmMessagesV2(user1.token, dm1.dmId, 0)).toStrictEqual({
      end: -1,
      messages: [],
      start: 0,
    });
  });

  test('Success Case - Message sent by other user edited by creator of dm', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const dm2 = requestDmCreateV2(user1.token, [user2.authUserId]);
    const timeSent = Math.floor((new Date()).getTime() / 1000);
    const message2 = requestMessageSenddmV2(user2.token, dm2.dmId, 'This is my message 2');
    requestMessageEditV2(user1.token, message2.messageId, newmessage);
    const dmMessages = requestDmMessagesV2(user1.token, dm2.dmId, 0);
    expect(dmMessages).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          messageId: message2.messageId,
          uId: user2.authUserId,
          message: newmessage,
          timeSent: expect.any(Number),
        }
      ],
      start: 0,
    });
    expect(dmMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent - 3);
    expect(dmMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent + 3);
  });
});

describe('/message/send/v1 Tests', () => {
  let user1: user;
  let channel1: channelReturn;
  let newmessage: string;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
    newmessage = 'All other branches wish they could be as cool as Seb Branch';
  });

  test('Fail Case - Invalid token', () => {
    expect(requestMessageSendV2(user1.token + 'invalid', channel1.channelId, newmessage)).toStrictEqual(403);
  });

  test('Fail Case - Invalid channelId', () => {
    expect(requestMessageSendV2(user1.token, channel1.channelId + 1, newmessage)).toStrictEqual(400);
  });

  test('Fail Case - Message Length Exceeds 1000 Characters', () => {
    const longstring = 'i'.repeat(1001);
    expect(requestMessageSendV2(user1.token, channel1.channelId, longstring)).toStrictEqual(400);
  });

  test('Fail Case - Message Length is less than 1 Character', () => {
    expect(requestMessageSendV2(user1.token, channel1.channelId, '')).toStrictEqual(400);
  });

  test('User is not a member of Channel', () => {
    const user3 = requestAuthRegisterV3('tim.cahill@gmail.com', 'ThisisMyPass3', 'Tim', 'Cahill');
    expect(requestMessageSendV2(user3.token, channel1.channelId, newmessage)).toStrictEqual(403);
  });

  test('Success Case - Message Sent', () => {
    const timeSent: number = Math.floor((new Date()).getTime() / 1000);
    const newmessageId = requestMessageSendV2(user1.token, channel1.channelId, newmessage);
    const channelMessages = requestChannelMessagesV2(user1.token, channel1.channelId, 0);
    expect(channelMessages).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          messageId: newmessageId.messageId,
          uId: user1.authUserId,
          message: newmessage,
          timeSent: expect.any(Number),
        }
      ],
      start: 0,
    });
    expect(channelMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent - 3);
    expect(channelMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent + 3);
  });
});

describe('/message/senddm/v1 Tests', () => {
  let user1: user;
  let user2: user;
  let dm: dmReturn;
  let message: string;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    dm = requestDmCreateV2(user1.token, [user2.authUserId]);
    message = 'Hello everyone';
  });

  test('Fail Case - Invalid token', () => {
    expect(requestMessageSenddmV2(user1.token + 'invalid', dm.dmId, message)).toStrictEqual(403);
  });

  test('Fail Case - Invalid dmId', () => {
    expect(requestMessageSenddmV2(user1.token, dm.dmId + 1, message)).toStrictEqual(400);
  });

  test('Fail Case - Message Length Exceeds 1000 Characters', () => {
    const longstring = 'i'.repeat(1001);
    expect(requestMessageSenddmV2(user1.token, dm.dmId, longstring)).toStrictEqual(400);
  });

  test('Fail Case - Message Length is less than 1 Character', () => {
    const shortstring = '';
    expect(requestMessageSendV2(user1.token, dm.dmId, shortstring)).toStrictEqual(400);
  });

  test('User is not a member of Dm', () => {
    const user3 = requestAuthRegisterV3('lil.baby@gmail.com', 'ThisisMyPass3', 'Lil', 'Baby');
    expect(requestMessageSenddmV2(user3.token, dm.dmId, message)).toStrictEqual(403);
  });

  test('Success Case - Message Sent', () => {
    const timeSent: number = Math.floor((new Date()).getTime() / 1000);
    const messageId = requestMessageSenddmV2(user1.token, dm.dmId, message);
    const dmMessages = requestDmMessagesV2(user1.token, dm.dmId, 0);
    expect(dmMessages).toStrictEqual({
      messages: [
        {
          isPinned: false,
          reacts: [],
          messageId: messageId.messageId,
          uId: user1.authUserId,
          message: message,
          timeSent: expect.any(Number),
        }
      ],
      start: 0,
      end: -1
    });
    expect(dmMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent - 3);
    expect(dmMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent + 3);
  });
});

// Iteration 3:

describe('/message/share/v1 Tests', () => {
  let user1: user;
  let user2: user;
  let channel1: channelReturn;
  let channel2: channelReturn;
  let newmessage: string;
  let newmessage2: string;
  let newmessageId: messageReturn;
  let newmessageId2: messageReturn;
  let additionalString: string;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
    channel2 = requestChannelsCreateV2(user1.token, 'Second Channel', true);
    newmessage = 'All other branches wish they could be as cool as Seb Branch';
    newmessage2 = 'Good day';
    newmessageId = requestMessageSendV2(user1.token, channel1.channelId, newmessage);
    newmessageId2 = requestMessageSendV2(user1.token, channel1.channelId, newmessage2);
    additionalString = 'Good day sir';
  });

  test('Fail Case - Invalid messageId', () => {
    expect(requestMessageShareV1(user1.token, newmessageId2.messageId + 1, additionalString, channel2.channelId, -1)).toStrictEqual(400);
  });

  test('Fail Case - Message Length Exceeds 1000 Characters', () => {
    const longstring = 'i'.repeat(1001);
    expect(requestMessageShareV1(user1.token, newmessageId2.messageId, longstring, channel2.channelId, -1)).toStrictEqual(400);
  });

  test('Fail Case - Invalid dmId', () => {
    expect(requestMessageShareV1(user1.token, newmessageId2.messageId, additionalString, channel2.channelId, 1)).toStrictEqual(400);
  });

  test('Fail Case - Invalid channelId', () => {
    expect(requestMessageShareV1(user1.token, newmessageId2.messageId, additionalString, channel2.channelId + 1, -1)).toStrictEqual(400);
  });

  test('Fail Case - Both channelId and dmId are -1', () => {
    expect(requestMessageShareV1(user1.token, newmessageId2.messageId, additionalString, -1, -1)).toStrictEqual(400);
  });

  test('Fail Case - Neither channelId and dmId are -1', () => {
    user2 = requestAuthRegisterV3('sebbranch@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    const dm = requestDmCreateV2(user1.token, [user2.authUserId]);
    expect(requestMessageShareV1(user1.token, newmessageId2.messageId, additionalString, channel2.channelId, dm.dmId)).toStrictEqual(400);
  });

  test('Fail Case - User not part of channel/dm', () => {
    user2 = requestAuthRegisterV3('sebbranch@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    expect(requestMessageShareV1(user2.token, newmessageId2.messageId, additionalString, channel2.channelId, -1)).toStrictEqual(403);
  });

  test('Success Case - Message shared', () => {
    user2 = requestAuthRegisterV3('sebbranch@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    requestChannelJoinV2(user2.token, channel1.channelId);
    requestChannelJoinV2(user2.token, channel2.channelId);
    const sharedMessageId2 = requestMessageShareV1(user2.token, newmessageId2.messageId, additionalString, channel2.channelId, -1).sharedMessageId;
    const sharedMessageId1 = requestMessageShareV1(user2.token, newmessageId.messageId, '', channel2.channelId, -1).sharedMessageId;
    expect(requestChannelMessagesV2(user1.token, channel2.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          messageId: sharedMessageId2,
          uId: user2.authUserId,
          message: newmessage2 + additionalString,
          timeSent: expect.any(Number),
          reacts: []
        },
        {
          isPinned: false,
          messageId: sharedMessageId1,
          uId: user2.authUserId,
          message: newmessage,
          timeSent: expect.any(Number),
          reacts: []
        }
      ],
      start: 0,
    });
  });
});

describe('/message/react/v1 Tests', () => {
  let user1: user;
  let user2: user;
  let channel1: channelReturn;
  let newmessage: string;
  let newmessage2: string;
  let newmessageId: messageReturn;
  let newmessageId2: messageReturn;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('bigpoppa@gmail.com', 'ThisIsMyPass2', 'Big', 'Poppa');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
    newmessage = 'All other branches wish they could be as cool as Seb Branch';
    newmessage2 = 'Good day';
    newmessageId = requestMessageSendV2(user1.token, channel1.channelId, newmessage);
    newmessageId2 = requestMessageSendV2(user1.token, channel1.channelId, newmessage2);
  });

  test('Fail Case - Invalid messageId', () => {
    expect(requestMessageReactV1(user1.token, newmessageId2.messageId + 1, 1)).toStrictEqual(400);
  });

  test('Fail Case - MessageId of message in channel user is not in', () => {
    expect(requestMessageReactV1(user2.token, newmessageId2.messageId, 1)).toStrictEqual(400);
  });

  test('Fail Case - Invalid reactId', () => {
    expect(requestMessageReactV1(user1.token, newmessageId2.messageId, 4)).toStrictEqual(400);
  });

  test('Fail Case - User already reacted', () => {
    requestMessageReactV1(user1.token, newmessageId2.messageId, 1);
    expect(requestMessageReactV1(user1.token, newmessageId2.messageId, 1)).toStrictEqual(400);
  });

  test('Success Case - Message Reacted', () => {
    requestChannelJoinV2(user2.token, channel1.channelId);
    requestMessageReactV1(user2.token, newmessageId2.messageId, 1);
    requestMessageReactV1(user1.token, newmessageId.messageId, 1);
    requestMessageReactV1(user2.token, newmessageId.messageId, 1);
    expect(requestChannelMessagesV2(user1.token, channel1.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          messageId: newmessageId.messageId,
          uId: user1.authUserId,
          message: newmessage,
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [user1.authUserId, user2.authUserId],
              isThisUserReacted: true,
            }
          ]
        },
        {
          isPinned: false,
          messageId: newmessageId2.messageId,
          uId: user1.authUserId,
          message: newmessage2,
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [user2.authUserId],
              isThisUserReacted: false,
            }
          ]
        }
      ],
      start: 0,
    });
  });
});

describe('/message/unreact/v1 Tests', () => {
  let user1: user;
  let user2: user;
  let channel1: channelReturn;
  let newmessage: string;
  let newmessage2: string;
  let newmessageId: messageReturn;
  let newmessageId2: messageReturn;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
    newmessage = 'All other branches wish they could be as cool as Seb Branch';
    newmessage2 = 'Good day';
    newmessageId = requestMessageSendV2(user1.token, channel1.channelId, newmessage);
    newmessageId2 = requestMessageSendV2(user1.token, channel1.channelId, newmessage2);
    requestMessageReactV1(user1.token, newmessageId2.messageId, 1);
  });

  test('Fail Case - Invalid messageId', () => {
    expect(requestMessageUnreactV1(user1.token, newmessageId2.messageId + 1, 1)).toStrictEqual(400);
  });

  test('Fail Case - User not part of channel', () => {
    user2 = requestAuthRegisterV3('sebbranch@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    expect(requestMessageReactV1(user2.token, newmessageId2.messageId, 1)).toStrictEqual(400);
  });

  test('Fail Case - User has not reacted', () => {
    user2 = requestAuthRegisterV3('sebbranch@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    requestChannelJoinV2(user2.token, channel1.channelId);
    expect(requestMessageUnreactV1(user2.token, newmessageId2.messageId, 1)).toStrictEqual(400);
  });

  test('Fail Case - Invalid reactId', () => {
    expect(requestMessageReactV1(user1.token, newmessageId2.messageId, 4)).toStrictEqual(400);
  });

  test('Success Case - Message unreacted', () => {
    user2 = requestAuthRegisterV3('sebbranch@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    requestChannelJoinV2(user2.token, channel1.channelId);
    requestMessageReactV1(user2.token, newmessageId2.messageId, 1);
    requestMessageUnreactV1(user1.token, newmessageId2.messageId, 1);
    requestMessageUnreactV1(user2.token, newmessageId2.messageId, 1);
    requestMessageReactV1(user2.token, newmessageId.messageId, 1);
    expect(requestChannelMessagesV2(user1.token, channel1.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          messageId: newmessageId.messageId,
          uId: user1.authUserId,
          message: newmessage,
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [user2.authUserId],
              isThisUserReacted: false,
            }
          ]
        },
        {
          isPinned: false,
          messageId: newmessageId2.messageId,
          uId: user1.authUserId,
          message: newmessage2,
          timeSent: expect.any(Number),
          reacts: []
        }
      ],
      start: 0,
    });
  });
});

describe('/message/pin/v1 Tests', () => {
  let user1: user;
  let user2: user;
  let newChannel: channelReturn;
  let newDm: dmReturn;
  let messageChannel: string;
  let messageDm: string;
  let messageId1: messageReturn;
  let messageId2: messageReturn;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('philfoden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    newChannel = requestChannelsCreateV2(user1.token, 'First Channel', true);
    newDm = requestDmCreateV2(user1.token, [user2.authUserId]);
    messageChannel = 'This is a message to the channel';
    messageDm = 'This is a message to the dm';
    messageId1 = requestMessageSendV2(user1.token, newChannel.channelId, messageChannel);
    messageId2 = requestMessageSenddmV2(user1.token, newDm.dmId, messageDm);
  });

  test('Fail case - Invalid messageId in channel', () => {
    expect(requestMessagePinV1(user1.token, messageId1.messageId + 100)).toStrictEqual(400);
  });

  test('Fail case - Invalid messageId in dm', () => {
    expect(requestMessagePinV1(user1.token, messageId2.messageId + 100)).toStrictEqual(400);
  });

  test('Fail case - Message is already pinned', () => {
    requestMessagePinV1(user1.token, messageId1.messageId);
    expect(requestMessagePinV1(user1.token, messageId1.messageId)).toStrictEqual(400);
  });

  // do I need to add tokens as an input for requestMessagePinV1?
  test('Fail case - User does not have permissions in channel', () => {
    expect(requestMessagePinV1(user2.token, messageId1.messageId)).toStrictEqual(403);
  });

  test('Fail case - User does not have permissions in dm', () => {
    expect(requestMessagePinV1(user2.token, messageId2.messageId)).toStrictEqual(403);
  });

  test('Success case - Pin channel message', () => {
    expect(requestChannelMessagesV2(user1.token, newChannel.channelId, 0)).toStrictEqual({
      end: -1,
      start: 0,
      messages: [
        {
          isPinned: false,
          message: 'This is a message to the channel',
          messageId: messageId1.messageId,
          reacts: [],
          timeSent: expect.any(Number),
          uId: user1.authUserId
        }
      ]
    });
    expect(requestMessagePinV1(user1.token, messageId1.messageId)).toStrictEqual({});
    expect(requestChannelMessagesV2(user1.token, newChannel.channelId, 0)).toStrictEqual({
      end: -1,
      start: 0,
      messages: [
        {
          isPinned: true,
          message: 'This is a message to the channel',
          messageId: messageId1.messageId,
          reacts: [],
          timeSent: expect.any(Number),
          uId: user1.authUserId
        }
      ]
    });
  });

  test('Success case - Pin dm message', () => {
    expect(requestDmMessagesV2(user1.token, newDm.dmId, 0)).toStrictEqual({
      end: -1,
      start: 0,
      messages: [
        {
          isPinned: false,
          message: 'This is a message to the dm',
          messageId: messageId2.messageId,
          reacts: [],
          timeSent: expect.any(Number),
          uId: user1.authUserId
        }
      ]
    });
    expect(requestMessagePinV1(user1.token, messageId2.messageId)).toStrictEqual({});
    expect(requestDmMessagesV2(user1.token, newDm.dmId, 0)).toStrictEqual({
      end: -1,
      start: 0,
      messages: [
        {
          isPinned: true,
          message: 'This is a message to the dm',
          messageId: messageId2.messageId,
          reacts: [],
          timeSent: expect.any(Number),
          uId: user1.authUserId
        }
      ]
    });
  });
});

describe('/message/unpin/v1 Tests', () => {
  let user1: user;
  let user2: user;
  let newChannel: channelReturn;
  let newDm: dmReturn;
  let messageChannel: string;
  let messageDm: string;
  let messageId1: messageReturn;
  let messageId2: messageReturn;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('philfoden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    newChannel = requestChannelsCreateV2(user1.token, 'First Channel', true);
    newDm = requestDmCreateV2(user1.token, [user2.authUserId]);
    messageChannel = 'This is a message to the channel';
    messageDm = 'This is a message to the dm';
    messageId1 = requestMessageSendV2(user1.token, newChannel.channelId, messageChannel);
    messageId2 = requestMessageSenddmV2(user1.token, newDm.dmId, messageDm);
  });

  test('Fail case - Invalid messageId in channel', () => {
    requestMessagePinV1(user1.token, messageId1.messageId);
    expect(requestMessageUnpinV1(user1.token, messageId1.messageId + 100)).toStrictEqual(400);
  });

  test('Fail case - Invalid messageId in dm', () => {
    requestMessagePinV1(user1.token, messageId2.messageId);
    expect(requestMessageUnpinV1(user1.token, messageId2.messageId + 100)).toStrictEqual(400);
  });

  test('Fail case - Message is already unpinned', () => {
    expect(requestMessageUnpinV1(user1.token, messageId1.messageId)).toStrictEqual(400);
  });

  test('Fail case - User does not have permissions in channel', () => {
    requestMessagePinV1(user1.token, messageId1.messageId);
    expect(requestMessageUnpinV1(user2.token, messageId1.messageId)).toStrictEqual(403);
  });

  test('Fail case - User does not have permissions in dm', () => {
    requestMessagePinV1(user1.token, messageId2.messageId);
    expect(requestMessageUnpinV1(user2.token, messageId2.messageId)).toStrictEqual(403);
  });

  test('Success case - Unpin channel message', () => {
    requestMessagePinV1(user1.token, messageId1.messageId);
    expect(requestChannelMessagesV2(user1.token, newChannel.channelId, 0)).toStrictEqual({
      end: -1,
      start: 0,
      messages: [
        {
          isPinned: true,
          message: 'This is a message to the channel',
          messageId: messageId1.messageId,
          reacts: [],
          timeSent: expect.any(Number),
          uId: user1.authUserId
        }
      ]
    });
    expect(requestMessageUnpinV1(user1.token, messageId1.messageId)).toStrictEqual({});
    expect(requestChannelMessagesV2(user1.token, newChannel.channelId, 0)).toStrictEqual({
      end: -1,
      start: 0,
      messages: [
        {
          isPinned: false,
          message: 'This is a message to the channel',
          messageId: messageId1.messageId,
          reacts: [],
          timeSent: expect.any(Number),
          uId: user1.authUserId
        }
      ]
    });
  });

  test('Success case - Unpin dm message', () => {
    expect(requestMessagePinV1(user1.token, messageId2.messageId)).toStrictEqual({});
    expect(requestDmMessagesV2(user1.token, newDm.dmId, 0)).toStrictEqual({
      end: -1,
      start: 0,
      messages: [
        {
          isPinned: true,
          message: 'This is a message to the dm',
          messageId: messageId2.messageId,
          reacts: [],
          timeSent: expect.any(Number),
          uId: user1.authUserId
        }
      ]
    });
    expect(requestMessageUnpinV1(user1.token, messageId2.messageId)).toStrictEqual({});
    expect(requestDmMessagesV2(user1.token, newDm.dmId, 0)).toStrictEqual({
      end: -1,
      start: 0,
      messages: [
        {
          isPinned: false,
          message: 'This is a message to the dm',
          messageId: messageId2.messageId,
          reacts: [],
          timeSent: expect.any(Number),
          uId: user1.authUserId
        }
      ]
    });
  });
});

// Add timeSent = (Math.floor((new Date()).getTime() / 1000) + 100 to replace all 100 occurences
describe('/message/sendlater/v1 Tests', () => {
  let user1: user;
  let user2: user;
  let newChannel: channelReturn;
  let message: string;
  let timeSent: number;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    newChannel = requestChannelsCreateV2(user1.token, 'This the channel', true);
    message = 'Hello everyone';
    timeSent = Math.floor((new Date()).getTime() / 1000) + 100;
  });

  test('Fail Case - Invalid token', () => {
    expect(requestMessageSendlaterV1(user1.token + 'invalid', newChannel.channelId, message, timeSent)).toStrictEqual(403);
  });

  test('Fail Case - Invalid channelId', () => {
    expect(requestMessageSendlaterV1(user1.token, newChannel.channelId + 1, message, timeSent)).toStrictEqual(400);
  });

  test('Fail Case - Message Length Exceeds 1000 Characters', () => {
    const longstring = 'i'.repeat(1001);
    expect(requestMessageSendlaterV1(user1.token, newChannel.channelId, longstring, timeSent)).toStrictEqual(400);
  });

  test('Fail Case - Message Length is less than 1 Character', () => {
    const shortstring = '';
    expect(requestMessageSendlaterV1(user1.token, newChannel.channelId, shortstring, timeSent)).toStrictEqual(400);
  });

  test('Fail Case - timeSent is in the past', () => {
    expect(requestMessageSendlaterV1(user1.token, newChannel.channelId, message, timeSent - 200)).toStrictEqual(400);
  });

  test('User is not a member of Channel', () => {
    expect(requestMessageSendlaterV1(user2.token, newChannel.channelId, message, timeSent)).toStrictEqual(403);
  });

  test('Success Case - Message Sent', () => {
    const newMessageId = requestMessageSendlaterV1(user1.token, newChannel.channelId, message, timeSent);
    const channelMessages = requestChannelMessagesV2(user1.token, newChannel.channelId, 0);
    expect(channelMessages).toStrictEqual({
      messages: [
        {
          isPinned: false,
          reacts: [],
          messageId: newMessageId.messageId,
          uId: user1.authUserId,
          message: message,
          timeSent: timeSent,
        }
      ],
      start: 0,
      end: -1
    });
  });
});

describe('/message/sendlaterdm/v1 Tests', () => {
  let user1: user;
  let user2: user;
  let newDm: dmReturn;
  let message: string;
  let timeSent: number;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    newDm = requestDmCreateV2(user1.token, [user2.authUserId]);
    message = 'Hello everyone';
    timeSent = Math.floor((new Date()).getTime() / 1000) + 100;
  });

  test('Fail Case - Invalid token', () => {
    expect(requestMessageSendlaterdmV1(user1.token + 'invalid', newDm.dmId, message, timeSent)).toStrictEqual(403);
  });

  test('Fail Case - Invalid dmId', () => {
    expect(requestMessageSendlaterdmV1(user1.token, newDm.dmId + 1, message, timeSent)).toStrictEqual(400);
  });

  test('Fail Case - Message Length Exceeds 1000 Characters', () => {
    const longstring = 'i'.repeat(1001);
    expect(requestMessageSendlaterdmV1(user1.token, newDm.dmId, longstring, timeSent)).toStrictEqual(400);
  });

  test('Fail Case - Message Length is less than 1 Character', () => {
    const shortstring = '';
    expect(requestMessageSendlaterdmV1(user1.token, newDm.dmId, shortstring, timeSent)).toStrictEqual(400);
  });

  test('Fail Case - timeSent is in the past', () => {
    expect(requestMessageSendlaterdmV1(user1.token, newDm.dmId, message, timeSent - 200)).toStrictEqual(400);
  });

  test('User is not a member of Dm', () => {
    const user3 = requestAuthRegisterV3('baby.keem@gmail.com', 'ThisIsMyPass3', 'Baby', 'Keem');
    expect(requestMessageSendlaterdmV1(user3.token, newDm.dmId, message, timeSent)).toStrictEqual(403);
  });

  test('Success Case - Message Sent', () => {
    const newMessageId = requestMessageSendlaterdmV1(user1.token, newDm.dmId, message, timeSent);
    const dmMessages = requestDmMessagesV2(user1.token, newDm.dmId, 0);
    expect(dmMessages).toStrictEqual({
      messages: [
        {
          isPinned: false,
          reacts: [],
          messageId: newMessageId.messageId,
          uId: user1.authUserId,
          message: message,
          timeSent: timeSent
        }
      ],
      start: 0,
      end: -1
    });
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
