import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';
import { requestAuthRegisterV3 } from './auth.test';
import { requestChannelsCreateV2 } from './channels.test';
import { requestChannelDetailsV2, requestChannelInviteV2, requestChannelMessagesV2 } from './channel.test';
import { requestDmCreateV2, requestDmDetailsV1, requestDmListV1, requestDmMessagesV2 } from './dm.test';
import { requestMessageEditV2, requestMessageSenddmV2, requestMessageSendV2 } from './message.test';
import { requestUserProfileV1 } from './user.test';
import { requestUsersAllV1 } from './users.test';
import { returnauthLoginV1 } from './auth';
import { returnChannelCreate } from './channels';
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

export function requestAdminUserRemove(token: string, uId: number) {
  return requestHelper('DELETE', '/admin/user/remove/v1', {
    token,
    uId
  });
}

export function requestAdminUserPermissionChange(token: string, uId: number, permissionId: number) {
  return requestHelper('POST', '/admin/userpermission/change/v1', {
    token,
    uId,
    permissionId
  });
}

describe('Testing Invalid Inputs (/admin/user/remove/v1)', () => {
  let globalOwner: returnauthLoginV1;
  let globalMember: returnauthLoginV1;
  let globalMember1: returnauthLoginV1;
  beforeEach(() => {
    // clearing datastore before test
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    globalOwner = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    globalMember = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    globalMember1 = requestAuthRegisterV3('lil.baby@gmail.com', 'ThIsisMyPass3', 'Lil', 'Baby');
  });

  test('Fail Case - Invalid Token', () => {
    expect(requestAdminUserRemove(globalOwner.token + 'Invalid', globalMember.authUserId)).toStrictEqual(403);
  });

  test('Fail Case - Invalid GlobalMember', () => {
    expect(requestAdminUserRemove(globalOwner.token, 999)).toStrictEqual(400);
  });

  test('Fail Case - Only GlobalOwner', () => {
    expect(requestAdminUserRemove(globalOwner.token, globalOwner.authUserId)).toStrictEqual(400);
  });

  test('Fail Case - Not a GlobalOwner, No Permissions', () => {
    expect(requestAdminUserRemove(globalMember.token, globalMember1.authUserId)).toStrictEqual(403);
  });
});

describe('Testing Correct Outputs (/admin/user/remove/v1)', () => {
  let globalOwner: returnauthLoginV1;
  let globalMember: returnauthLoginV1;
  let globalMember1: returnauthLoginV1;
  let channel: returnChannelCreate;
  let dm: returnDmCreate;
  let message;
  let message1;
  let dmMessage;
  let dmMessage1;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    globalOwner = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    globalMember = requestAuthRegisterV3('anothervalidemail@gmail.com', 'thisIsMyPass1', 'Big', 'Poppa');
    globalMember1 = requestAuthRegisterV3('shmick.mick@gmail.com', 'ThIsisMyPass3', 'Shmick', 'Mick');
    channel = requestChannelsCreateV2(globalOwner.token, 'HaydenChannel1', true);
    requestChannelInviteV2(globalOwner.token, channel.channelId, globalMember.authUserId);
    dm = requestDmCreateV2(globalOwner.token, [globalMember.authUserId, globalMember1.authUserId]);
    message = requestMessageSendV2(globalMember.token, channel.channelId, 'All other branches wish they could be as cool as Seb Branch');
    requestMessageEditV2(globalMember.token, message.messageId, 'This is a new channel message 1');
    message1 = requestMessageSendV2(globalMember.token, channel.channelId, 'All other branches');
    requestMessageEditV2(globalMember.token, message1.messageId, 'This is a new channel message 2');
    dmMessage = requestMessageSenddmV2(globalMember.token, dm.dmId, 'This is my message 2');
    requestMessageEditV2(globalMember.token, dmMessage.messageId, 'This a new DM messsage 1');
    dmMessage1 = requestMessageSenddmV2(globalMember.token, dm.dmId, 'This is my message 2');
    requestMessageEditV2(globalMember.token, dmMessage1.messageId, 'This a new DM messsage 2');
    requestAdminUserRemove(globalOwner.token, globalMember.authUserId);
  });

  test('Success Case - Check User Profile', () => {
    expect(requestUserProfileV1(globalOwner.token, globalMember.authUserId)).toStrictEqual({
      user:
        {
          uId: globalMember.authUserId,
          nameFirst: 'Removed',
          nameLast: 'user',
          email: '',
          handleStr: '',
        },
    });
  });

  test('Success Case - List All Users', () => {
    expect(requestUsersAllV1(globalOwner.token)).toStrictEqual({
      users: [
        {
          uId: 1,
          email: 'hayden.smith@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith'
        },
        {
          uId: 3,
          email: 'shmick.mick@gmail.com',
          nameFirst: 'Shmick',
          nameLast: 'Mick',
          handleStr: 'shmickmick'
        }
      ]
    });
  });

  test('Success Case - User removed from list of Channel Members/Owners', () => {
    expect(requestChannelDetailsV2(globalOwner.token, channel.channelId)).toStrictEqual({
      name: 'HaydenChannel1',
      isPublic: true,
      ownerMembers: [
        {
          uId: globalOwner.authUserId,
          email: 'hayden.smith@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith',
        }
      ],
      allMembers: [
        {
          uId: globalOwner.authUserId,
          email: 'hayden.smith@gmail.com',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          handleStr: 'haydensmith',
        },
      ]
    });
  });

  test('Success Case - Removed User Channel Messages are Changed', () => {
    expect(requestChannelMessagesV2(globalOwner.token, channel.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          message: 'Removed user',
          messageId: 0,
          timeSent: expect.any(Number),
          uId: 2,
        },
        {
          isPinned: false,
          reacts: [],
          message: 'Removed user',
          messageId: 1,
          timeSent: expect.any(Number),
          uId: 2,
        }
      ],
      start: 0,
    });
  });

  test('Success Case - Removed User From DM List', () => {
    expect(requestDmListV1(globalOwner.token)).toStrictEqual({
      dms: [
        {
          dmId: dm.dmId,
          name: 'bigpoppa, haydensmith, shmickmick'
        }
      ]
    });
  });

  test('Success Case - Removed User From DM Details', () => {
    expect(requestDmDetailsV1(globalOwner.token, dm.dmId)).toStrictEqual({
      members: [
        {
          email: 'hayden.smith@gmail.com',
          handleStr: 'haydensmith',
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          uId: 1,
        },
        {
          email: 'shmick.mick@gmail.com',
          handleStr: 'shmickmick',
          nameFirst: 'Shmick',
          nameLast: 'Mick',
          uId: 3,
        },
      ],
      name: 'bigpoppa, haydensmith, shmickmick',
    });
  });
  // Based on Forum, name of DM remains unchanged, User's uId and messages are changed/removed

  test('Success Case - Removed User From DM Messages', () => {
    expect(requestDmMessagesV2(globalOwner.token, dm.dmId, 0)).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          message: 'Removed user',
          messageId: 2,
          timeSent: expect.any(Number),
          uId: 2,
        },
        {
          isPinned: false,
          reacts: [],
          message: 'Removed user',
          messageId: 3,
          timeSent: expect.any(Number),
          uId: 2,
        },
      ],
      start: 0,
    });
  });
});

describe('Testing Invalid Inputs (/admin/userpermission/change/v1)', () => {
  let globalOwner: returnauthLoginV1;
  let globalMember: returnauthLoginV1;
  let globalMember1: returnauthLoginV1;
  beforeEach(() => {
    // clearing datastore before test
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    globalOwner = requestAuthRegisterV3('validemail@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
    globalMember = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisIsMyPass2', 'Phil', 'Foden');
    globalMember1 = requestAuthRegisterV3('lil.baby@gmail.com', 'ThIsisMyPass3', 'Lil', 'Baby');
  });
  // 1: GlobalOwner
  // 2: GlobalMember

  test('Fail Case - Invalid Token', () => {
    expect(requestAdminUserPermissionChange(globalOwner.token + 'Invalid', globalMember.authUserId, 1)).toStrictEqual(403);
  });

  test('Fail Case - Invalid GlobalMember', () => {
    expect(requestAdminUserPermissionChange(globalOwner.token, 999, 1)).toStrictEqual(400);
  });

  test('Fail Case - Only GlobalOwner', () => {
    expect(requestAdminUserPermissionChange(globalOwner.token, globalOwner.authUserId, 2)).toStrictEqual(400);
  });

  test('Fail Case - PermissionId Invalid', () => {
    expect(requestAdminUserPermissionChange(globalOwner.token, globalMember.authUserId, 3)).toStrictEqual(400);
  });

  test('Fail Case - PermissionId Same As Before', () => {
    expect(requestAdminUserPermissionChange(globalOwner.token, globalMember.authUserId, 2)).toStrictEqual(400);
  });

  test('Fail Case - PermissionId Same As Before', () => {
    requestAdminUserPermissionChange(globalOwner.token, globalMember.authUserId, 1);
    expect(requestAdminUserPermissionChange(globalOwner.token, globalMember.authUserId, 1)).toStrictEqual(400);
  });

  test('Fail Case - Not a GlobalOwner, No Permissions', () => {
    expect(requestAdminUserPermissionChange(globalMember.token, globalMember1.authUserId, 1)).toStrictEqual(403);
  });
});

describe('Testing Correct Outputs (/admin/userpermission/change/v1)', () => {
  let globalOwner: returnauthLoginV1;
  let globalMember: returnauthLoginV1;
  let globalMember1: returnauthLoginV1;
  let channel: returnChannelCreate;
  let dm: returnDmCreate;
  let message;
  let message1;
  let dmMessage;
  let dmMessage1;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    globalOwner = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    globalMember = requestAuthRegisterV3('anothervalidemail@gmail.com', 'thisIsMyPass1', 'Big', 'Poppa');
    globalMember1 = requestAuthRegisterV3('shmick.mick@gmail.com', 'ThIsisMyPass3', 'Shmick', 'Mick');
    channel = requestChannelsCreateV2(globalOwner.token, 'HaydenChannel1', true);
    requestChannelInviteV2(globalOwner.token, channel.channelId, globalMember.authUserId);
    dm = requestDmCreateV2(globalOwner.token, [globalMember.authUserId, globalMember1.authUserId]);
    message = requestMessageSendV2(globalMember.token, channel.channelId, 'All other branches wish they could be as cool as Seb Branch');
    requestMessageEditV2(globalMember.token, message.messageId, 'This is a new channel message 1');
    message1 = requestMessageSendV2(globalMember.token, channel.channelId, 'All other branches');
    requestMessageEditV2(globalMember.token, message1.messageId, 'This is a new channel message 2');
    dmMessage = requestMessageSenddmV2(globalMember.token, dm.dmId, 'This is my message 2');
    requestMessageEditV2(globalMember.token, dmMessage.messageId, 'This a new DM messsage 1');
    dmMessage1 = requestMessageSenddmV2(globalMember.token, dm.dmId, 'This is my message 2');
    requestMessageEditV2(globalMember.token, dmMessage1.messageId, 'This a new DM messsage 2');
    requestAdminUserPermissionChange(globalOwner.token, globalMember.authUserId, 1);
    requestAdminUserRemove(globalMember.token, globalOwner.authUserId);
  });

  test('Success Case - Check User Profile', () => {
    expect(requestUserProfileV1(globalMember.token, globalOwner.authUserId)).toStrictEqual({
      user:
        {
          uId: globalOwner.authUserId,
          nameFirst: 'Removed',
          nameLast: 'user',
          email: '',
          handleStr: '',
        },
    });
  });

  test('Success Case - List All Users', () => {
    expect(requestUsersAllV1(globalMember.token)).toStrictEqual({
      users: [
        {
          uId: 2,
          email: 'anothervalidemail@gmail.com',
          nameFirst: 'Big',
          nameLast: 'Poppa',
          handleStr: 'bigpoppa'
        },
        {
          uId: 3,
          email: 'shmick.mick@gmail.com',
          nameFirst: 'Shmick',
          nameLast: 'Mick',
          handleStr: 'shmickmick'
        }
      ]
    });
  });

  test('Success Case - User removed from list of Channel Members/Owners', () => {
    expect(requestChannelDetailsV2(globalMember.token, channel.channelId)).toStrictEqual({
      name: 'HaydenChannel1',
      isPublic: true,
      ownerMembers: [],
      allMembers: [
        {
          email: 'anothervalidemail@gmail.com',
          handleStr: 'bigpoppa',
          nameFirst: 'Big',
          nameLast: 'Poppa',
          uId: 2,
        }
      ],
    });
  });

  test('Success Case - Removed User Channel Messages are Changed', () => {
    expect(requestChannelMessagesV2(globalMember.token, channel.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          message: 'This is a new channel message 1',
          messageId: 0,
          timeSent: expect.any(Number),
          uId: 2,
        },
        {
          isPinned: false,
          reacts: [],
          message: 'This is a new channel message 2',
          messageId: 1,
          timeSent: expect.any(Number),
          uId: 2,
        }
      ],
      start: 0,
    });
  });

  test('Success Case - Removed User From DM List', () => {
    expect(requestDmListV1(globalMember.token)).toStrictEqual({
      dms: [
        {
          dmId: dm.dmId,
          name: 'bigpoppa, haydensmith, shmickmick'
        }
      ]
    });
  });

  test('Success Case - Removed User From DM Details', () => {
    expect(requestDmDetailsV1(globalMember.token, dm.dmId)).toStrictEqual({
      members: [
        {
          email: 'anothervalidemail@gmail.com',
          handleStr: 'bigpoppa',
          nameFirst: 'Big',
          nameLast: 'Poppa',
          uId: 2,
        },
        {
          email: 'shmick.mick@gmail.com',
          handleStr: 'shmickmick',
          nameFirst: 'Shmick',
          nameLast: 'Mick',
          uId: 3,
        },
      ],
      name: 'bigpoppa, haydensmith, shmickmick',
    });
  });
  // Based on Forum, name of DM remains unchanged, User's uId and messages are changed/removed

  test('Success Case - Removed User From DM Messages', () => {
    expect(requestDmMessagesV2(globalMember.token, dm.dmId, 0)).toStrictEqual({
      end: -1,
      messages: [
        {
          isPinned: false,
          reacts: [],
          message: 'This a new DM messsage 1',
          messageId: 2,
          timeSent: expect.any(Number),
          uId: 2,
        },
        {
          isPinned: false,
          reacts: [],
          message: 'This a new DM messsage 2',
          messageId: 3,
          timeSent: expect.any(Number),
          uId: 2,
        },
      ],
      start: 0,
    });
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
