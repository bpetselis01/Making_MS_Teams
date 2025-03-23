import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';
import { requestAuthRegisterV3 } from './auth.test';
import { requestChannelsCreateV2 } from './channels.test';
import { requestChannelInviteV2, requestChannelJoinV2, requestChannelLeave } from './channel.test';
import { requestDmCreateV2, requestDmLeaveV1, requestDmRemoveV1 } from './dm.test';
import {
  requestMessageEditV2,
  requestMessageRemoveV2,
  requestMessageSenddmV2,
  requestMessageSendV2
} from './message.test';
import { returnauthLoginV1 } from './auth';

const SERVER_URL = `${url}:${port}`;

export interface channelsExist {
  numChannelsExist: number;
  timeStamp: number;
}

export interface dmsExist {
  numDmsExist: number;
  timeStamp: number;
}

export interface messagesExist {
  numMessagesExist: number;
  timeStamp: number;
}

export interface workspaceStats {
  channelsExist: channelsExist[];
  dmsExist: dmsExist[];
  messagesExist: messagesExist[];
  utilizationRate: number;
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

export function requestUsersAllV1(token: string) {
  return requestHelper('GET', '/users/all/v2', { token });
}

export function requestUsersStatsV1(token: string) {
  return requestHelper('GET', '/users/stats/v1', { token });
}

describe('/users/all/v2 Tests', () => {
  let user1: returnauthLoginV1;
  beforeEach(() => {
    // clearing datastore before test
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    requestAuthRegisterV3('lil.baby@gmail.com', 'ThIsisMyPass3', 'Lil', 'Baby');
  });

  test('Fail Case - Invalid token', () => {
    expect(requestUsersAllV1(user1.token + 'Invalid')).toStrictEqual(403);
  });

  test('Success Case - Valid output', () => {
    expect(requestUsersAllV1(user1.token)).toStrictEqual({
      users: [

        {
          uId: 1,
          email: 'validemail@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith'
        },

        {
          uId: 2,
          email: 'phil.foden@gmail.com',
          nameFirst: 'Phil',
          nameLast: 'Foden',
          handleStr: 'philfoden'
        },

        {
          uId: 3,
          email: 'lil.baby@gmail.com',
          nameFirst: 'Lil',
          nameLast: 'Baby',
          handleStr: 'lilbaby'
        }

      ]
    });
  });
});

describe('Testing Correct Outputs (users/stats/v1)', () => {
  let user: returnauthLoginV1;
  let user1: returnauthLoginV1;
  let user2: returnauthLoginV1;
  let channel;
  let channel1;
  let channel1a;
  let channel2;
  let channel3;
  let dm;
  let dm1;
  let dm2;
  let message;
  let message1;
  let dmMessage;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    user1 = requestAuthRegisterV3('anothervalidemail@gmail.com', 'thisIsMyPass1', 'Big', 'Poppa');
    user2 = requestAuthRegisterV3('shmick.mick@gmail.com', 'ThIsisMyPass3', 'Shmick', 'Mick');
    requestAuthRegisterV3('mick.shtick@gmail.com', 'ThIsisMyPass4', 'Mick', 'Shtick');
    requestAuthRegisterV3('mega.lodong@gmail.com', 'ThIsisMyPass5', 'Mega', 'Lodong');
    channel = requestChannelsCreateV2(user.token, 'HaydenChannel1', true); // Channel 1, +U1
    channel1 = requestChannelsCreateV2(user.token, 'HaydenChannel2', true); // Channel 2, +U1
    channel1a = requestChannelsCreateV2(user.token, 'HaydenChannel3', true); // Channel 3, +U1
    channel2 = requestChannelsCreateV2(user1.token, 'AnotherChannel1', true); // Channel 4, +U2
    channel3 = requestChannelsCreateV2(user1.token, 'AnotherChannel2', true); // Channel 5, +U2
    requestChannelInviteV2(user1.token, channel3.channelId, user.authUserId); // Channel 5, +U1
    requestChannelJoinV2(user.token, channel2.channelId); // Channel 4, +U1
    requestChannelLeave(user.token, channel2.channelId); // Channel 4, -U1
    requestChannelLeave(user.token, channel3.channelId); // Channel 5, -U1
    requestChannelInviteV2(user.token, channel1.channelId, user2.authUserId); // Channel 5, +U1
    requestChannelInviteV2(user.token, channel1a.channelId, user2.authUserId); // Channel 5, +U1
    dm = requestDmCreateV2(user.token, [user1.authUserId, user2.authUserId]); // DM 1, +U1
    dm1 = requestDmCreateV2(user.token, [user2.authUserId]); // DM 2, +U1
    dm2 = requestDmCreateV2(user.token, [user1.authUserId]); // DM 3, +U1
    requestDmLeaveV1(user.token, dm1.dmId); // DM 2, -U1
    requestDmLeaveV1(user1.token, dm2.dmId); // DM 2, -U1
    message = requestMessageSendV2(user.token, channel.channelId, 'All other branches wish they could be as cool as Seb Branch'); // Message 1, +U1
    message1 = requestMessageSendV2(user.token, channel.channelId, 'All other branches'); // Message 2, +U1
    requestMessageEditV2(user.token, message1.messageId, 'This a new Channel messsage 1');
    dmMessage = requestMessageSenddmV2(user.token, dm.dmId, 'This is my message 2'); // Message 3, +U1
    requestMessageEditV2(user.token, dmMessage.messageId, 'This a new DM messsage 1');
    requestMessageRemoveV2(user.token, message.messageId); // Message 4, +U1
    requestDmRemoveV1(user.token, dm.dmId);
  });

  // If I'm getting a specific user's details, shouldn't I have a uId parameter?
  test('Success Case', () => {
    expect(requestUsersStatsV1(user.token)).toStrictEqual({
      workspaceStats:
        {
          channelsExist: expect.any(Array),
          dmsExist: expect.any(Array),
          messagesExist: expect.any(Array),
          utilizationRate: expect.any(Number),
        }
    });
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
