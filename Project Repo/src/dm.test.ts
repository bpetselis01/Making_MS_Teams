import { requestAuthRegisterV3 } from './auth.test';
import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';
import { generateUniqueUserId } from './other';
import { requestMessageSenddmV2 } from './message.test';
import { returnauthLoginV1 } from './auth';
import { returnDmCreate } from './dm';

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

export function requestDmCreateV2(token: string, uIds: number[]) {
  return requestHelper('POST', '/dm/create/v2', {
    token,
    uIds
  });
}

export function requestDmListV1(token: string) {
  return requestHelper('GET', '/dm/list/v2', { token });
}

export function requestDmRemoveV1(token: string, dmId: number) {
  return requestHelper('DELETE', '/dm/remove/v2', {
    token,
    dmId
  });
}

export function requestDmDetailsV1(token: string, dmId: number) {
  return requestHelper('GET', '/dm/details/v2', {
    token,
    dmId
  });
}

export function requestDmLeaveV1(token: string, dmId: number | string) {
  return requestHelper('POST', '/dm/leave/v2', {
    token,
    dmId
  });
}

export function requestDmMessagesV2(token: string, dmId: number | string, start: number) {
  return requestHelper('GET', '/dm/messages/v2', {
    token,
    dmId,
    start
  });
}

describe('/dm/create/v1 Tests', () => {
  let user1: returnauthLoginV1;
  let user2: returnauthLoginV1;
  let user3: returnauthLoginV1;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    user3 = requestAuthRegisterV3('shmick.mick@gmail.com', 'ThIsisMyPass3', 'Shmick', 'Mick');
  });

  test('Fail Case - Invalid uId in uIds', () => {
    expect(requestDmCreateV2(user1.token, [user2.authUserId, user3.authUserId, generateUniqueUserId()])).toStrictEqual(400);
  });

  test('Fail Case - Duplicate uId in uIds', () => {
    expect(requestDmCreateV2(user1.token, [user2.authUserId, user3.authUserId, user2.authUserId])).toStrictEqual(400);
  });

  test('Fail Case - Invalid token', () => {
    expect(requestDmCreateV2(user1.token + 'invalid', [user2.authUserId, user3.authUserId])).toStrictEqual(403);
  });

  test('Success Case - Empty uIds list', () => {
    const dm = requestDmCreateV2(user1.token, []);
    expect(requestDmDetailsV1(user1.token, dm.dmId)).toStrictEqual({
      name: 'haydensmith',
      members: [
        {
          uId: user1.authUserId,
          email: 'validemail@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith',
        }
      ]
    });
  });

  test('Success Case - 1 uId in uIds', () => {
    const dm = requestDmCreateV2(user2.token, [user1.authUserId]);
    expect(requestDmDetailsV1(user1.token, dm.dmId)).toStrictEqual({
      name: 'haydensmith, philfoden',
      members: [
        {
          uId: user2.authUserId,
          email: 'phil.foden@gmail.com',
          nameFirst: 'Phil',
          nameLast: 'Foden',
          handleStr: 'philfoden',
        },
        {
          uId: user1.authUserId,
          email: 'validemail@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith',
        },
      ]
    });
  });

  test('Success Case - 2 uId in uIds', () => {
    const dm = requestDmCreateV2(user3.token, [user1.authUserId, user2.authUserId]);
    expect(requestDmDetailsV1(user3.token, dm.dmId)).toStrictEqual({
      name: 'haydensmith, philfoden, shmickmick',
      members: [
        {
          uId: user3.authUserId,
          email: 'shmick.mick@gmail.com',
          nameFirst: 'Shmick',
          nameLast: 'Mick',
          handleStr: 'shmickmick',
        },
        {
          uId: user1.authUserId,
          email: 'validemail@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith',
        },
        {
          uId: user2.authUserId,
          email: 'phil.foden@gmail.com',
          nameFirst: 'Phil',
          nameLast: 'Foden',
          handleStr: 'philfoden',
        },
      ]
    });
  });
});

describe('/dm/list/v1 Tests', () => {
  let user1: returnauthLoginV1;
  let user2: returnauthLoginV1;
  let user3: returnauthLoginV1;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    user3 = requestAuthRegisterV3('shmick.mick@gmail.com', 'ThIsisMyPass3', 'Shmick', 'Mick');
  });

  test('Fail Case - Invalid token', () => {
    expect(requestDmListV1(user1.token + 'invalid')).toStrictEqual(403);
  });

  test('Success Case - single dm creator checking dms they are part of', () => {
    const dm = requestDmCreateV2(user1.token, []);
    expect(requestDmListV1(user1.token)).toStrictEqual(
      {
        dms: [
          {
            dmId: dm.dmId,
            name: 'haydensmith'
          }
        ]
      }
    );
  });

  test('Success Case - single dm member checking dms they are part of', () => {
    const dm = requestDmCreateV2(user1.token, [user2.authUserId]);
    expect(requestDmListV1(user2.token)).toStrictEqual(
      {
        dms: [
          {
            dmId: dm.dmId,
            name: 'haydensmith, philfoden'
          }
        ]
      }
    );
  });

  test('Success Case - dm owner and invited member checking dms they are part of', () => {
    const dm1 = requestDmCreateV2(user1.token, [user2.authUserId]);
    const dm2 = requestDmCreateV2(user2.token, [user3.authUserId]);
    expect(requestDmListV1(user2.token)).toStrictEqual(
      {
        dms: [
          {
            dmId: dm1.dmId,
            name: 'haydensmith, philfoden'
          },
          {
            dmId: dm2.dmId,
            name: 'philfoden, shmickmick'
          }
        ]
      }
    );
  });
});

describe('/dm/remove/v1 Tests', () => {
  let user1: returnauthLoginV1;
  let user2: returnauthLoginV1;
  let user3: returnauthLoginV1;
  let dm: returnDmCreate;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    user3 = requestAuthRegisterV3('shmick.mick@gmail.com', 'ThIsisMyPass3', 'Shmick', 'Mick');
    dm = requestDmCreateV2(user1.token, [user2.authUserId, user3.authUserId]);
  });

  test('Fail Case - Invalid dmId', () => {
    expect(requestDmRemoveV1(user1.token, dm.dmId + 1)).toStrictEqual(400);
  });

  test('Fail Case - Valid dmId but user is not dm creator', () => {
    expect(requestDmRemoveV1(user2.token, dm.dmId)).toStrictEqual(403);
  });

  test('Fail Case - Valid dmId but user is no longer in the dm', () => {
    requestDmLeaveV1(user1.token, dm.dmId);
    expect(requestDmRemoveV1(user1.token, dm.dmId)).toStrictEqual(403);
  });

  test('Fail Case - Invalid token', () => {
    expect(requestDmRemoveV1(user1.token + 'invalid', dm.dmId)).toStrictEqual(403);
  });

  test('Fail Case - testing with dm/details/v1', () => {
    requestDmRemoveV1(user1.token, dm.dmId);
    expect(requestDmDetailsV1(user1.token, dm.dmId)).toStrictEqual(400);
  });

  test('Success Case - testing with dm/list/v1', () => {
    requestDmRemoveV1(user1.token, dm.dmId);
    expect(requestDmListV1(user1.token)).toStrictEqual({ dms: [] });
  });
});

describe('/dm/details/v1 Tests', () => {
  let user1: returnauthLoginV1;
  let user2: returnauthLoginV1;
  let user3: returnauthLoginV1;
  let dm: returnDmCreate;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    user3 = requestAuthRegisterV3('shmick.mick@gmail.com', 'ThIsisMyPass3', 'Shmick', 'Mick');
    dm = requestDmCreateV2(user1.token, [user2.authUserId]);
  });

  test('Fail Case - Invalid dmId', () => {
    expect(requestDmDetailsV1(user1.token, dm.dmId + 1)).toStrictEqual(400);
  });

  test('Fail Case - Valid dmId but user is not member of dm', () => {
    expect(requestDmDetailsV1(user3.token, dm.dmId)).toStrictEqual(403);
  });

  test('Fail Case - Invalid token', () => {
    expect(requestDmDetailsV1(user1.token + 'invalid', dm.dmId)).toStrictEqual(403);
  });

  test('Success Case', () => {
    expect(requestDmDetailsV1(user1.token, dm.dmId)).toStrictEqual({
      name: 'haydensmith, philfoden',
      members: [
        {
          uId: user1.authUserId,
          email: 'validemail@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith',
        },
        {
          uId: user2.authUserId,
          email: 'phil.foden@gmail.com',
          nameFirst: 'Phil',
          nameLast: 'Foden',
          handleStr: 'philfoden'
        }
      ]
    });
  });
});

describe('Fail Case - Invalid Inputs (requestDmLeaveV1)', () => {
  let user1: returnauthLoginV1;
  let user2: returnauthLoginV1;
  let dm1: returnDmCreate;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    dm1 = requestDmCreateV2(user1.token, [user2.authUserId]);
  });

  test('Invalid token', () => {
    expect(requestDmLeaveV1(user2.token + 'invalid', dm1.dmId)).toStrictEqual(403);
  });

  test('Invalid dmId', () => {
    expect(requestDmLeaveV1(user2.token, dm1.dmId + 1)).toStrictEqual(400);
  });

  test('Authorised user is not a member of the dm', () => {
    const user3 = requestAuthRegisterV3('lil.baby@gmail.com', 'ThisisMyPass3', 'Lil', 'Baby');
    expect(requestDmLeaveV1(user3.token, dm1.dmId)).toStrictEqual(403);
  });
});

describe('Success Case - Valid Inputs (requestDmLeaveV1)', () => {
  test('Valid Output', () => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    const user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const dm1 = requestDmCreateV2(user1.token, [user2.authUserId]);
    requestDmLeaveV1(user2.token, dm1.dmId);
    expect(requestDmDetailsV1(user1.token, dm1.dmId)).toStrictEqual({
      name: 'haydensmith, philfoden',
      members: [
        {
          uId: user1.authUserId,
          email: 'validemail@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith',
        }
      ]
    });
  });
});

describe('Fail Case - Invalid Inputs (requestDmMessagesV2)', () => {
  let user1: returnauthLoginV1;
  let user2: returnauthLoginV1;
  let dm1: returnDmCreate;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    dm1 = requestDmCreateV2(user1.token, [user2.authUserId]);
  });

  test('Invalid token', () => {
    expect(requestDmMessagesV2(user2.token + 'invalid', dm1.dmId, 0)).toStrictEqual(403);
  });

  test('Invalid dmId', () => {
    expect(requestDmMessagesV2(user2.token, dm1.dmId + 1, 0)).toStrictEqual(400);
  });

  test('Authorised user is not a member of the dm', () => {
    const user3 = requestAuthRegisterV3('lil.baby@gmail.com', 'ThisisMyPass3', 'Lil', 'Baby');
    expect(requestDmMessagesV2(user3.token, dm1.dmId, 0)).toStrictEqual(403);
  });

  test('Start is greater than total number of messages', () => {
    expect(requestDmMessagesV2(user2.token, dm1.dmId, 1)).toStrictEqual(400);
  });
});

describe('Success Case - Valid Inputs (requestDmMessagesV2)', () => {
  let user1: returnauthLoginV1;
  let user2: returnauthLoginV1;
  let dm1: returnDmCreate;
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    dm1 = requestDmCreateV2(user1.token, [user2.authUserId]);
  });

  test('No messages in dm', () => {
    expect(requestDmMessagesV2(user2.token, dm1.dmId, 0)).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('One messages in dm', () => {
    const timeSent = Math.floor((new Date()).getTime() / 1000);
    const message1 = requestMessageSenddmV2(user1.token, dm1.dmId, 'Hello World');
    const dmMessages = requestDmMessagesV2(user2.token, dm1.dmId, 0);
    expect(dmMessages).toStrictEqual({
      messages: [
        {
          reacts: [],
          isPinned: false,
          message: 'Hello World',
          messageId: message1.messageId,
          timeSent: expect.any(Number),
          uId: user1.authUserId,
        }
      ],
      start: 0,
      end: -1,
    });
    expect(dmMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent - 3);
    expect(dmMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent + 3);
  });

  test('Multiple messages in dm', () => {
    const timeSent1 = Math.floor((new Date()).getTime() / 1000);
    const message1 = requestMessageSenddmV2(user1.token, dm1.dmId, 'Hello World');
    const timeSent2 = Math.floor((new Date()).getTime() / 1000);
    const message2 = requestMessageSenddmV2(user1.token, dm1.dmId, 'Comp1531');
    const dmMessages = requestDmMessagesV2(user2.token, dm1.dmId, 0);
    expect(dmMessages).toStrictEqual({
      messages: [
        {
          reacts: [],
          isPinned: false,
          message: 'Hello World',
          messageId: message1.messageId,
          timeSent: expect.any(Number),
          uId: user1.authUserId,
        },
        {
          reacts: [],
          isPinned: false,
          message: 'Comp1531',
          messageId: message2.messageId,
          timeSent: expect.any(Number),
          uId: user1.authUserId,
        },
      ],
      start: 0,
      end: -1,
    });
    expect(dmMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent1 - 3);
    expect(dmMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent1 + 3);
    expect(dmMessages.messages[1].timeSent).toBeGreaterThanOrEqual(timeSent2 - 3);
    expect(dmMessages.messages[1].timeSent).toBeLessThanOrEqual(timeSent2 + 3);
  });

  test('Multiple messages in dm with different start', () => {
    requestMessageSenddmV2(user1.token, dm1.dmId, 'Hello World');
    const timeSent1 = Math.floor((new Date()).getTime() / 1000);
    const message1 = requestMessageSenddmV2(user1.token, dm1.dmId, 'Comp1531');
    const timeSent2 = Math.floor((new Date()).getTime() / 1000);
    const message2 = requestMessageSenddmV2(user1.token, dm1.dmId, 'Iteration 2');
    const dmMessages = requestDmMessagesV2(user2.token, dm1.dmId, 1);
    expect(dmMessages).toStrictEqual({
      messages: [
        {
          reacts: [],
          isPinned: false,
          message: 'Comp1531',
          messageId: message1.messageId,
          timeSent: expect.any(Number),
          uId: user1.authUserId,
        },
        {
          reacts: [],
          isPinned: false,
          message: 'Iteration 2',
          messageId: message2.messageId,
          timeSent: expect.any(Number),
          uId: user1.authUserId,
        }
      ],
      start: 1,
      end: -1,
    });
    expect(dmMessages.messages[0].timeSent).toBeGreaterThanOrEqual(timeSent1 - 3);
    expect(dmMessages.messages[0].timeSent).toBeLessThanOrEqual(timeSent1 + 3);
    expect(dmMessages.messages[1].timeSent).toBeGreaterThanOrEqual(timeSent2 - 3);
    expect(dmMessages.messages[1].timeSent).toBeLessThanOrEqual(timeSent2 + 3);
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
