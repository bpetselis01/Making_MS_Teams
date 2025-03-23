import { requestAuthRegisterV3 } from './auth.test';
import {
  requestMessageReactV1,
  requestMessageSenddmV2,
  requestMessageSendV2,
  requestMessageUnreactV1
} from './message.test';
import { requestChannelInviteV2, requestChannelJoinV2 } from './channel.test';
import { requestChannelsCreateV2 } from './channels.test';
import { requestDmCreateV2, requestDmRemoveV1 } from './dm.test';
import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;

interface user {
  token: string;
  authUserId: number;
}

interface channelReturn {
  channelId: number;
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

export function requestnotificationsGetV1(token: string) {
  return requestHelper('GET', '/notifications/get/v1', { token });
}

describe('Tests for notificationsGet', () => {
  let user1: user;
  let user2: user;
  let channel1: channelReturn;
  let channel2: channelReturn;
  let newmessage: string;
  let newmessageId: number;
  let dmIdNew: number;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'thisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('branch@gmail.com', 'thisIsMyPass2', 'Seb', 'Branch');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
    channel2 = requestChannelsCreateV2(user1.token, 'Second Channel', true);
    requestChannelJoinV2(user2.token, channel1.channelId);
    dmIdNew = requestDmCreateV2(user1.token, [user2.authUserId]).dmId;
    newmessage = 'All other branches wish they could be as cool as @sebbranch';
  });

  test('Fail-Case: Invalid Token', () => {
    expect(requestnotificationsGetV1('userToken is invalid')).toStrictEqual(403);
  });

  test('Success Case - Tagged and added to channel', () => {
    newmessageId = requestMessageSendV2(user1.token, channel1.channelId, newmessage);
    requestChannelInviteV2(user1.token, channel2.channelId, user2.authUserId);
    requestMessageSenddmV2(user1.token, dmIdNew, newmessage);
    requestDmRemoveV1(user1.token, dmIdNew);
    expect(requestnotificationsGetV1(user2.token)).toStrictEqual({
      notifications: [
        {
          channelId: -1,
          dmId: dmIdNew,
          notificationMessage: 'haydensmith tagged you in haydensmith, sebbranch: All other branches w',
        },
        {
          channelId: channel2.channelId,
          dmId: -1,
          notificationMessage: 'haydensmith added you to Second Channel',
        },
        {
          channelId: channel1.channelId,
          dmId: -1,
          notificationMessage: 'haydensmith tagged you in First Channel: All other branches w',
        },
        {
          channelId: -1,
          dmId: 0,
          notificationMessage: 'haydensmith added you to haydensmith, sebbranch'
        }
      ],
    });
  });

  test('Success Case - Message Reacted to', () => {
    newmessageId = requestMessageSendV2(user1.token, channel1.channelId, newmessage).messageId;
    requestMessageReactV1(user2.token, newmessageId, 1);
    requestMessageUnreactV1(user2.token, channel1.channelId, 1);
    expect(requestnotificationsGetV1(user1.token)).toStrictEqual({
      notifications: [
        {
          channelId: channel1.channelId,
          dmId: -1,
          notificationMessage: 'sebbranch reacted to your message in First Channel',
        },
      ],
    });
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
