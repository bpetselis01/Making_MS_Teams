import { requestAuthLoginV1, requestAuthRegisterV3 } from './auth.test';

import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;

// interface error {error: 'error'}
interface authRegisterReturn {
  authUserId: number | string,
  token: string
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

export function requestChannelsCreateV2(token: string, name: string, isPublic: boolean) {
  return requestHelper('POST', '/channels/create/v3', {
    token,
    name,
    isPublic
  });
}

export function requestChannelsListV2(token: string) {
  return requestHelper('GET', '/channels/list/v3', { token });
}

export function requestChannelsListAllV2(token: string) {
  return requestHelper('GET', '/channels/listall/v3', { token });
}

describe('Missing Inputs (requestChannelsCreateV2)', () => {
  let userToken: string;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    userToken = requestAuthRegisterV3('validemail@gmail.com', 'thisIsMyPass1', 'Hayden', 'Smith').token;
  });

  test('Fail-Case: Invalid Token', () => {
    expect(requestChannelsCreateV2('invalidtoken', 'ChannelName', true)).toStrictEqual(403);
  });

  test('Fail-Case: Invalid Channel Name', () => {
    expect(requestChannelsCreateV2(userToken, '', true)).toStrictEqual(400);
  });

  // test('Fail-Case: Invalid isPublic', () => {
  //   expect(requestChannelsCreateV2(userToken, 'ChannelName', undefined)).toStrictEqual({ error: expect.any(String) });
  // });
  // Is this test case necessary?
});

describe('Invalid Name Length (requestChannelsCreateV2)', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
  });

  test('Name too long', () => {
    requestAuthRegisterV3('duplicate@gmail.com', 'ThisisMyPass1', 'Big', 'Poppa');
    expect(requestChannelsCreateV2(requestAuthLoginV1('duplicate@gmail.com', 'ThisisMyPass1').token, 'Thisnameisabsolutelywaytolong', true)).toStrictEqual(400);
  });

  test('Name too short', () => {
    requestAuthRegisterV3('duplicate@gmail.com', 'ThisisMyPass1', 'Big', 'Poppa');
    expect(requestChannelsCreateV2(requestAuthLoginV1('duplicate@gmail.com', 'ThisisMyPass1').token, '', true)).toStrictEqual(400);
  });
});

describe('Invalid authUserId (requestChannelsCreateV2)', () => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });

  test('Invalid Token', () => {
    expect(requestChannelsCreateV2('1', 'File Name', true)).toStrictEqual(403);
  });
});

describe('Invalid authUserId (channelsList)', () => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });

  test('Invalid Token', () => {
    expect(requestChannelsListV2('1')).toStrictEqual(403);
  });
});

describe('Test output (channelsList)', () => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });

  test('Two channels', () => {
    const user1 = requestAuthRegisterV3('poppa@gmail.com', 'ThisisMyPass1', 'Token', 'Test') as authRegisterReturn;
    const channel1 = requestChannelsCreateV2(user1.token, 'FirstChannelName', true);
    const channel2 = requestChannelsCreateV2(user1.token, 'SecondChannelName', true);
    const secondToken = requestAuthLoginV1('poppa@gmail.com', 'ThisisMyPass1').token;
    const original = requestChannelsListV2(secondToken);

    // Two Tokens are given to the user!
    expect(original).toStrictEqual(
      {
        channels: [
          {
            channelId: channel1.channelId,
            name: 'FirstChannelName',
          },
          {
            channelId: channel2.channelId,
            name: 'SecondChannelName',
          }
        ]
      });
  });
});

describe('Invalid authUserId (channelsListAllV3)', () => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });

  test('Invalid Token', () => {
    expect(requestChannelsCreateV2('1', 'File Name', true)).toStrictEqual(403);
  });
});
// Above test isn't really good, doesn't test channelsListAllV3

describe('Test output (channelsListAllV3)', () => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });

  test('Two channels', () => {
    const user1 = requestAuthRegisterV3('poppa@gmail.com', 'ThisisMyPass1', 'Big', 'Poppa') as authRegisterReturn;
    const user2 = requestAuthRegisterV3('boppa@gmail.com', 'ThisisMyPass2', 'Pig', 'Boppa') as authRegisterReturn;
    const channel1 = requestChannelsCreateV2(user1.token, 'FirstChannelName', true);
    const channel2 = requestChannelsCreateV2(user2.token, 'SecondChannelName', false);
    expect(requestChannelsListAllV2(user1.token)).toStrictEqual(
      {
        channels: [
          {
            channelId: channel1.channelId,
            name: 'FirstChannelName',
          },
          {
            channelId: channel2.channelId,
            name: 'SecondChannelName',
          }
        ]
      });
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
