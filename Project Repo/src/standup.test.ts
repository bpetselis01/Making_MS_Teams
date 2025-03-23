import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';
import { requestAuthRegisterV3 } from './auth.test';
import { requestChannelsCreateV2 } from './channels.test';

const SERVER_URL = `${url}:${port}`;

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

export const requestStandupStartV1 = (token: string, channelId: number, length: number) => {
  return requestHelper('POST', '/standup/start/v1', {
    token,
    channelId,
    length
  });
};

export const requestStandupActiveV1 = (token: string, channelId: number) => {
  return requestHelper('GET', '/standup/active/v1', {
    token,
    channelId
  });
};

export const requestStandupSendV1 = (token: string, channelId: number, message: string) => {
  return requestHelper('POST', '/standup/send/v1', {
    token,
    channelId,
    message
  });
};

describe('/standup/start/v1 Tests', () => {
  let user1;
  let channel1;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
  });

  test('Fail case - invalid channel id', () => {
    expect(requestStandupStartV1(user1.token, channel1.channelId + 1, 1)).toStrictEqual(400);
  });

  test('Fail case - length is a negative integer', () => {
    expect(requestStandupStartV1(user1.token, channel1.channelId, -1)).toStrictEqual(400);
  });

  test('Fail case - active standup is currently running in the channel', () => {
    requestStandupStartV1(user1.token, channel1.channelId, 5);
    expect(requestStandupStartV1(user1.token, channel1.channelId, 5)).toStrictEqual(400);
  });

  test('Fail case - channelId is valid and the authorised user is not a member of the channel', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    expect(requestStandupStartV1(user2.token, channel1.channelId, 1)).toStrictEqual(403);
  });

  test('Success case', () => {
    const timeStarted = Math.floor((new Date()).getTime() / 1000);
    const standup = requestStandupStartV1(user1.token, channel1.channelId, 1);
    expect(standup.timeFinish).toStrictEqual(timeStarted + 1);
  });
});

describe('/standup/active/v1 Tests', () => {
  let user1;
  let channel1;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
  });

  test('Fail case - invalid channel id', () => {
    expect(requestStandupActiveV1(user1.token, channel1.channelId + 1)).toStrictEqual(400);
  });

  test('Fail case - channelId is valid and the authorised user is not a member of the channel', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    expect(requestStandupActiveV1(user2.token, channel1.channelId)).toStrictEqual(403);
  });

  test('Success case - standup is currently running in the channel', () => {
    const timeStarted = Math.floor((new Date()).getTime() / 1000);
    requestStandupStartV1(user1.token, channel1.channelId, 5);
    expect(requestStandupActiveV1(user1.token, channel1.channelId)).toStrictEqual({
      isActive: true,
      timeFinish: timeStarted + 5,
    });
  });

  test('Success case - no standup is currently running in the channel', () => {
    expect(requestStandupActiveV1(user1.token, channel1.channelId)).toStrictEqual({
      isActive: false,
      timeFinish: null,
    });
  });
});

describe('/standup/send/v1 Tests', () => {
  let user1;
  let channel1;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
  });

  test('Fail case - channelId does not refer to a valid channel', () => {
    requestStandupStartV1(user1.token, channel1.channelId, 5);
    expect(requestStandupSendV1(user1.token, channel1.channelId + 1, 'message1')).toStrictEqual(400);
  });

  test('Fail case - length of message is over 1000 characters', () => {
    const longString = 'a'.repeat(1001);
    requestStandupStartV1(user1.token, channel1.channelId, 5);
    expect(requestStandupSendV1(user1.token, channel1.channelId, longString)).toStrictEqual(400);
  });

  test('Fail case - an active standup is not currently running in the channel', () => {
    expect(requestStandupSendV1(user1.token, channel1.channelId, 'message1')).toStrictEqual(400);
  });

  test('Fail case - channelId is valid and the authorised user is not a member of the channel', () => {
    const user2 = requestAuthRegisterV3('validemail1@gmail.com', 'ThisIsMyPass2', 'Seb', 'Branch');
    expect(requestStandupSendV1(user2.token, channel1.channelId, 'message1')).toStrictEqual(403);
  });

  // test('Success Case', async () => {
  //   requestStandupStartV1(user1.token, channel1.channelId, 1);
  //   requestStandupSendV1(user1.token, channel1.channelId, 'message1');
  //   requestStandupSendV1(user1.token, channel1.channelId, 'message2');
  //   requestStandupSendV1(user1.token, channel1.channelId, 'message3');
  //   await new Promise((r) => setTimeout(r, 1500));
  //   expect(requestChannelMessagesV2(user1.token, channel1.channelId, 0)).toStrictEqual({
  //     end: -1,
  //     messages: [
  //       {
  //         messageId: expect.any(Number),
  //         uId: user1.authUserId,
  //         message: 'haydensmith: message1\nhaydensmith: message2\nhaydensmith: message3',
  //         timeSent: expect.any(Number),
  //       }
  //     ],
  //     start: 0,
  //   });
  // });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
