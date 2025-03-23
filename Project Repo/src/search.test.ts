import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';
import { requestAuthRegisterV3 } from './auth.test';
import { requestMessageSenddmV2, requestMessageSendV2 } from './message.test';
import { requestChannelInviteV2, requestChannelJoinV2 } from './channel.test';
import { requestChannelsCreateV2 } from './channels.test';
import { requestDmCreateV2 } from './dm.test';
import { returnDmCreate } from './dm';

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

export function requestSearchV1(token: string, queryStr: string) {
  return requestHelper('GET', '/search/v1', {
    token,
    queryStr
  });
}

describe('Tests for search', () => {
  let user1: user;
  let user2: user;
  let user3: user;
  let channel1: channelReturn;
  let channel2: channelReturn;
  let newmessage: string;
  let newmessage2: string;
  let newmessage3: string;
  let newmessage4: string;
  let newmessageId: number;
  let newmessageId2: number;
  let newmessageId3: number;
  let newmessageId4: number;
  let queryStr: string;
  let dmIdnew: returnDmCreate;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'thisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('branch@gmail.com', 'thisIsMyPass2', 'Seb', 'Branch');
    user3 = requestAuthRegisterV3('bigbranch@gmail.com', 'thisIsMyPass3', 'Biggest', 'Branch');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
    channel2 = requestChannelsCreateV2(user1.token, 'Second Channel', true);
    requestChannelJoinV2(user2.token, channel1.channelId);
    dmIdnew = requestDmCreateV2(user1.token, [user2.authUserId]);
    newmessage = 'All other branches wish they could be as cool as @sebbranch';
    newmessage2 = 'How many branches?';
    newmessage3 = 'Not enough Branches';
    newmessage4 = 'no branch';
    queryStr = 'branches';
  });

  test('Fail-Case: Invalid Token', () => {
    expect(requestSearchV1('userToken is invalid', queryStr)).toStrictEqual(403);
  });

  test('Fail-Case: Invalid Length - Too short', () => {
    expect(requestSearchV1(user2.token, '')).toStrictEqual(400);
  });

  test('Fail-Case: Invalid Length - Too long', () => {
    const longstring = 'i'.repeat(1001);
    expect(requestSearchV1(user1.token, longstring)).toStrictEqual(400);
  });

  test('Success Case - Searched', () => {
    newmessageId = requestMessageSendV2(user1.token, channel1.channelId, newmessage).messageId;
    newmessageId2 = requestMessageSendV2(user1.token, channel2.channelId, newmessage2).messageId;
    requestChannelInviteV2(user1.token, channel2.channelId, user3.authUserId);
    newmessageId3 = requestMessageSenddmV2(user1.token, dmIdnew.dmId, newmessage3).messageId;
    newmessageId4 = requestMessageSenddmV2(user1.token, dmIdnew.dmId, newmessage4).messageId;

    const returnedarray = requestSearchV1(user2.token, queryStr).messages;
    expect(returnedarray).toContainEqual({
      isPinned: false,
      reacts: [],
      messageId: newmessageId,
      uId: user1.authUserId,
      message: newmessage,
      timeSent: expect.any(Number),
    });
    expect(returnedarray).not.toContainEqual({
      isPinned: false,
      reacts: [],
      messageId: newmessageId2,
      uId: user1.authUserId,
      message: newmessage2,
      timeSent: expect.any(Number),
    });
    expect(returnedarray).toContainEqual({
      isPinned: false,
      reacts: [],
      messageId: newmessageId3,
      uId: user1.authUserId,
      message: newmessage3,
      timeSent: expect.any(Number),
    });
    expect(returnedarray).not.toContainEqual({
      isPinned: false,
      reacts: [],
      messageId: newmessageId4,
      uId: user1.authUserId,
      message: newmessage4,
      timeSent: expect.any(Number),
    });
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
