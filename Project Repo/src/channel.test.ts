import { requestAuthRegisterV3 } from './auth.test';
import { requestChannelsCreateV2 } from './channels.test';
import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';
import { returnauthLoginV1 } from './auth';
import { returnChannelCreate } from './channels';

const SERVER_URL = `${url}:${port}`;

interface user {
  uId: number,
  nameFirst: string,
  nameLast: string;
  email: string,
  handleStr?: string,
  password?: string
}

interface message {
  messageId: number,
  uId: string,
  message: string,
  timeSent: number
}

interface channel {
  channelId: number,
  name: string,
  isPublic?: boolean,
  ownerMembers?: user[],
  allMembers?: user[],
  messages?: message[]
}

interface authRegisterReturn {
  authUserId: number,
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

export function requestChannelDetailsV2(token: string, channelId: number) {
  return requestHelper('GET', '/channel/details/v3', {
    token,
    channelId
  });
}

export function requestChannelJoinV2(token: string, channelId: number) {
  return requestHelper('POST', '/channel/join/v3', {
    token,
    channelId
  });
}

export function requestChannelInviteV2(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/invite/v3', {
    token,
    channelId,
    uId
  });
}

export function requestChannelMessagesV2(token: string, channelId: number, start: number) {
  return requestHelper('GET', '/channel/messages/v3', {
    token,
    channelId,
    start
  });
}

export function requestChannelLeave(token: string, channelId: number) {
  return requestHelper('POST', '/channel/leave/v2', {
    token,
    channelId
  });
}

export function requestChannelAddOwnerV2(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/addowner/v2', {
    token,
    channelId,
    uId
  });
}

export function requestchannelremoveowner(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/removeowner/v2', {
    token,
    channelId,
    uId
  });
}

beforeEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
});

describe('Missing Inputs (requestChannelMessagesV2)', () => {
  test.each`
      token        | channelId    | start        | message
      ${undefined} | ${1}         | ${0}         | ${'token'}
      ${1}         | ${undefined} | ${0}         | ${'channelId'} 
      ${1}         | ${1}         | ${undefined} | ${'start'} 
    `('Fail case - missing $message', ({
    token,
    channelId,
    start
  }) => {
    expect(requestChannelMessagesV2(token, channelId, start)).toStrictEqual(403);
  });
});
// Above does not throw in a legitimate authUserId or token, test a bit invalid

describe('Testing (requestChannelMessagesV2)', () => {
  let user1: returnauthLoginV1;
  let channel1: returnChannelCreate;
  beforeEach(() => {
    user1 = requestAuthRegisterV3('validemail@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'First Channel', true);
  });

  test('Fail case - Invalid Token', () => {
    expect(requestChannelMessagesV2(user1.token + 'invalid', channel1.channelId, 0)).toStrictEqual(403);
  });

  test('Fail case - authUserId not a member of channel', () => {
    const user2 = requestAuthRegisterV3('anothervalidemail@gmail.com', 'ThisisMyPass1', 'Big', 'Poppa');
    expect(requestChannelMessagesV2(user2.token, channel1.channelId, 0)).toStrictEqual(403);
  });

  test('Fail case Invalid channelId', () => {
    expect(requestChannelMessagesV2(user1.token, channel1.channelId + 1, 0)).toStrictEqual(400);
  });

  test('Fail case - Start greater than number of messages', () => {
    expect(requestChannelMessagesV2(user1.token, channel1.channelId, 1)).toStrictEqual(400);
  });

  test('Success case - 0 messages case', () => {
    expect(requestChannelMessagesV2(user1.token, channel1.channelId, 0)).toStrictEqual({
      end: -1,
      messages: [],
      start: 0,
    });
  });
});

describe('requestChannelDetailsV2 tests', () => {
  let user: returnauthLoginV1;
  let channel: returnChannelCreate;
  beforeEach(() => {
    user = requestAuthRegisterV3('random.guy1@gmail.com', 'Pass123!', 'random', 'guy');
    channel = requestChannelsCreateV2(user.token, 'myChannel1', true);
  });

  test('fail case - invalid token', () => {
    expect(requestChannelDetailsV2(user.token + 1, channel.channelId)).toStrictEqual(403);
  });

  test('fail case - invalid channelId', () => {
    expect(requestChannelDetailsV2(user.token, channel.channelId + 1)).toStrictEqual(400);
  });

  test('fail case - user is not a member of channel', () => {
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    expect(requestChannelDetailsV2(user2.token, channel.channelId)).toStrictEqual(403);
  });

  test('success case - testing correct return', () => {
    expect(requestChannelDetailsV2(user.token, channel.channelId)).toStrictEqual(
      {
        name: 'myChannel1',
        isPublic: true,
        ownerMembers: [
          {
            uId: user.authUserId,
            email: 'random.guy1@gmail.com',
            nameFirst: 'random',
            nameLast: 'guy',
            handleStr: 'randomguy',
          }
        ],
        allMembers: [
          {
            uId: user.authUserId,
            email: 'random.guy1@gmail.com',
            nameFirst: 'random',
            nameLast: 'guy',
            handleStr: 'randomguy',
          }
        ]
      });
  });
});
// Code above passes, no issues in npm start, issues are in the section below

describe('requestChannelJoinV2 tests', () => {
  let user1: returnauthLoginV1;
  let publicChannel: returnChannelCreate;
  beforeEach(() => {
    user1 = requestAuthRegisterV3('random.guy1@gmail.com', 'Pass123!', 'random', 'guy');
    publicChannel = requestChannelsCreateV2(user1.token, 'myChannel1', true);
  });

  test('fail case - invalid token', () => {
    expect(requestChannelJoinV2(user1.token + 1, publicChannel.channelId + 1)).toStrictEqual(403);
  });

  test('fail case - invalid channelId', () => {
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    expect(requestChannelJoinV2(user2.token, publicChannel.channelId + 1)).toStrictEqual(400);
  });

  test('fail case - user is already member of channel', () => {
    expect(requestChannelJoinV2(user1.token, publicChannel.channelId)).toStrictEqual(400);
  });

  test('fail case - channel is private and user is not global owner or channel member', () => {
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    const privateChannel = requestChannelsCreateV2(user1.token, 'myChannel2', false);
    expect(requestChannelJoinV2(user2.token, privateChannel.channelId)).toStrictEqual(403);
  });

  // Everything is still good above this, something is wrong beneath

  test('success case - public channel joined by global member', () => {
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    requestChannelJoinV2(user2.token, publicChannel.channelId);
    expect(requestChannelDetailsV2(user2.token, publicChannel.channelId)).toStrictEqual(
      {
        name: 'myChannel1',
        isPublic: true,
        ownerMembers: [
          {
            uId: user1.authUserId,
            email: 'random.guy1@gmail.com',
            nameFirst: 'random',
            nameLast: 'guy',
            handleStr: 'randomguy',
          }
        ],
        allMembers: [
          {
            uId: user1.authUserId,
            email: 'random.guy1@gmail.com',
            nameFirst: 'random',
            nameLast: 'guy',
            handleStr: 'randomguy',
          },
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          }
        ]
      });
  });

  test('success case - public channel joined by global owner', () => {
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    const publicChannel2 = requestChannelsCreateV2(user2.token, 'myChannel2', true);
    requestChannelJoinV2(user1.token, publicChannel2.channelId);
    expect(requestChannelDetailsV2(user1.token, publicChannel2.channelId)).toStrictEqual(
      {
        name: 'myChannel2',
        isPublic: true,
        ownerMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          }
        ],
        allMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
          {
            uId: user1.authUserId,
            email: 'random.guy1@gmail.com',
            nameFirst: 'random',
            nameLast: 'guy',
            handleStr: 'randomguy',
          },
        ]
      });
  });

  test('success case - private channel joined by global owner', () => {
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    const privateChannel = requestChannelsCreateV2(user2.token, 'myChannel2', false);
    requestChannelJoinV2(user1.token, privateChannel.channelId);
    expect(requestChannelDetailsV2(user1.token, privateChannel.channelId)).toStrictEqual(
      {
        name: 'myChannel2',
        isPublic: false,
        ownerMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          }
        ],
        allMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
          {
            uId: user1.authUserId,
            email: 'random.guy1@gmail.com',
            nameFirst: 'random',
            nameLast: 'guy',
            handleStr: 'randomguy',
          },
        ]
      });
  });
});

describe('Invalid Inputs (requestChannelInviteV2)', () => {
  let user1: returnauthLoginV1;
  let channel1: returnChannelCreate;
  beforeEach(() => {
    user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true);
  });

  test('Missing Inputs', () => {
    expect(requestChannelInviteV2(user1.token, channel1.channelId + 1, undefined)).toStrictEqual(400);
  });

  test('Missing Inputs', () => {
    expect(requestChannelInviteV2(user1.token, undefined, user1.authUserId)).toStrictEqual(400);
  });

  test('Invalid Token', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    expect(requestChannelInviteV2(user1.token + 'invalid', channel1.channelId, user2.authUserId)).toStrictEqual(403);
  });

  test('Invalid Channel Id', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    expect(requestChannelInviteV2(user1.token, channel1.channelId + 1, user2.authUserId)).toStrictEqual(400);
  });

  test('Invalid User Id', () => {
    expect(requestChannelInviteV2(user1.token, channel1.channelId, user1.authUserId + 1)).toStrictEqual(400);
  });

  test('User already in Channel', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    requestChannelJoinV2(user2.token, channel1.channelId);
    expect(requestChannelInviteV2(user1.token, channel1.channelId, user2.authUserId)).toStrictEqual(400);
  });

  test('User is not a member of Channel', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const user3 = requestAuthRegisterV3('tim.cahill@gmail.com', 'ThisisMyPass3', 'Tim', 'Cahill');
    expect(requestChannelInviteV2(user2.token, channel1.channelId, user3.authUserId)).toStrictEqual(403);
  });
});

describe('Testing Correct Outputs (requestChannelInviteV2)', () => {
  test('Valid Users and Channel', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true);
    expect(requestChannelInviteV2(user1.token, channel1.channelId, user2.authUserId)).toStrictEqual({});
  });
});

// New function tests

describe('Testing Invalid Requests (requestChannelLeave)', () => {
  test('Invalid Token', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true) as channel;
    expect(requestChannelLeave('Not a token', channel1.channelId)).toStrictEqual(403);
  });

  test('Not a member of a valid channel (requestChannelLeave)', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true);
    expect(requestChannelLeave(user2.token, channel1.channelId)).toStrictEqual(403);
  });

  test('Not a valid channel Id (requestChannelLeave)', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    expect(requestChannelLeave(user2.token, 1)).toStrictEqual(400);
  });
});

describe('Testing correct output (requestChannelLeave)', () => {
  test('Remove member', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    const publicChannel2 = requestChannelsCreateV2(user2.token, 'myChannel2', true);
    requestChannelJoinV2(user1.token, publicChannel2.channelId);
    requestChannelLeave(user1.token, publicChannel2.channelId);
    expect(requestChannelDetailsV2(user2.token, publicChannel2.channelId)).toStrictEqual(
      {
        name: 'myChannel2',
        isPublic: true,
        ownerMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          }
        ],
        allMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
        ]
      });
  });

  test('Remove owner', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    const publicChannel2 = requestChannelsCreateV2(user2.token, 'myChannel2', true);
    requestChannelJoinV2(user1.token, publicChannel2.channelId);
    requestChannelLeave(user2.token, publicChannel2.channelId);
    expect(requestChannelDetailsV2(user1.token, publicChannel2.channelId)).toStrictEqual(
      {
        name: 'myChannel2',
        isPublic: true,
        ownerMembers: [],
        allMembers: [
          {
            email: 'hayden.smith@gmail.com',
            handleStr: 'haydensmith',
            nameFirst: 'Hayden',
            nameLast: 'Smith',
            uId: 1,
          }
        ]
      });
  });
});

describe('Testing Invalid Requests (requestChannelAddOwnerV2)', () => {
  test('Invalid Token', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden') as authRegisterReturn;
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith') as authRegisterReturn;
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true) as channel;
    requestChannelJoinV2(user1.token, channel1.channelId);
    expect(requestChannelAddOwnerV2('Not a token', channel1.channelId, user1.authUserId)).toStrictEqual(403);
  });

  test('Not a member of a valid channel (requestChannelAddOwnerV2)', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true);
    expect(requestChannelAddOwnerV2(user1.token, channel1.channelId, user2.authUserId)).toStrictEqual(400);
  });

  test('Not a valid channel Id (requestChannelAddOwnerV2)', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true);
    requestChannelJoinV2(user2.token, channel1.channelId);
    expect(requestChannelAddOwnerV2(user1.token, channel1.channelId + 1, user2.authUserId)).toStrictEqual(400);
  });

  test('Not a valid user Id (requestChannelAddOwnerV2)', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    expect(requestChannelAddOwnerV2(user2.token, channel1.channelId, user1.authUserId + 1)).toStrictEqual(400);
  });

  test('Already an owner (requestChannelAddOwnerV2)', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true);
    expect(requestChannelAddOwnerV2(user1.token, channel1.channelId, user1.authUserId)).toStrictEqual(400);
  });

  test('Not authorised (requestChannelAddOwnerV2)', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user3 = requestAuthRegisterV3('big.poppa@gmail.com', 'ThisisMyPass3', 'Big', 'Poppa');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    requestChannelJoinV2(user3.token, channel1.channelId);
    expect(requestChannelAddOwnerV2(user3.token, channel1.channelId, user1.authUserId)).toStrictEqual(403);
  });
});

describe('Testing correct output (requestChannelAddOwnerV2)', () => {
  test('Add owner', () => {
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user3 = requestAuthRegisterV3('big.poppa@gmail.com', 'ThisisMyPass3', 'Big', 'Poppa');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    requestChannelJoinV2(user3.token, channel1.channelId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user3.authUserId);
    expect(requestChannelDetailsV2(user2.token, channel1.channelId)).toStrictEqual(
      {
        name: 'Moodle',
        isPublic: true,
        ownerMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
          {
            uId: user3.authUserId,
            email: 'big.poppa@gmail.com',
            nameFirst: 'Big',
            nameLast: 'Poppa',
            handleStr: 'bigpoppa',
          }
        ],
        allMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
          {
            uId: user1.authUserId,
            email: 'hayden.smith@gmail.com',
            nameFirst: 'Hayden',
            nameLast: 'Smith',
            handleStr: 'haydensmith',
          },
          {
            uId: user3.authUserId,
            email: 'big.poppa@gmail.com',
            nameFirst: 'Big',
            nameLast: 'Poppa',
            handleStr: 'bigpoppa',
          },
        ]
      });
  });
});

describe('Testing Invalid Requests (requestchannelremoveowner)', () => {
  test('Invalid Token', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user1.authUserId);
    expect(requestchannelremoveowner('Not a token', channel1.channelId, user1.authUserId)).toStrictEqual(403);
  });

  test('Not an owner of a valid channel (requestchannelremoveowner)', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true);
    requestChannelJoinV2(user2.token, channel1.channelId);
    expect(requestchannelremoveowner(user2.token, channel1.channelId, user1.authUserId)).toStrictEqual(400);
  });

  test('Not a valid channel Id (requestChannelRemoveOwner)', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user1.authUserId);
    expect(requestchannelremoveowner(user1.token, channel1.channelId + 1, user2.authUserId)).toStrictEqual(400);
  });

  test('Not a valid user Id (requestchannelremoveowner)', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user1.authUserId);
    expect(requestchannelremoveowner(user2.token, channel1.channelId, user1.authUserId + 1)).toStrictEqual(400);
  });

  test('The only owner (requestchannelremoveowner)', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const channel1 = requestChannelsCreateV2(user1.token, 'Moodle', true);
    expect(requestchannelremoveowner(user1.token, channel1.channelId, user1.authUserId)).toStrictEqual(400);
  });

  test('Not authorised (requestChannelAddOwnerV2)', () => {
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user3 = requestAuthRegisterV3('big.poppa@gmail.com', 'ThisisMyPass3', 'Big', 'Poppa');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    requestChannelJoinV2(user3.token, channel1.channelId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user1.authUserId);
    expect(requestchannelremoveowner(user3.token, channel1.channelId, user1.authUserId)).toStrictEqual(403);
  });
});

describe('Testing correct output (requestChannelAddOwnerV2)', () => {
  test('Add owner', () => {
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user3 = requestAuthRegisterV3('big.poppa@gmail.com', 'ThisisMyPass3', 'Big', 'Poppa');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    requestChannelJoinV2(user3.token, channel1.channelId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user3.authUserId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user1.authUserId);
    requestchannelremoveowner(user2.token, channel1.channelId, user3.authUserId);
    requestchannelremoveowner(user2.token, channel1.channelId, user1.authUserId);
    expect(requestChannelDetailsV2(user2.token, channel1.channelId)).toStrictEqual(
      {
        name: 'Moodle',
        isPublic: true,
        ownerMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
        ],
        allMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
          {
            uId: user1.authUserId,
            email: 'hayden.smith@gmail.com',
            nameFirst: 'Hayden',
            nameLast: 'Smith',
            handleStr: 'haydensmith',
          },
          {
            uId: user3.authUserId,
            email: 'big.poppa@gmail.com',
            nameFirst: 'Big',
            nameLast: 'Poppa',
            handleStr: 'bigpoppa',
          },
        ]
      });
  });

  test('Add owner', () => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    const user2 = requestAuthRegisterV3('joe.jenkins@gmail.com', 'Hello99', 'joe', 'jenkins');
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user3 = requestAuthRegisterV3('big.poppa@gmail.com', 'ThisisMyPass3', 'Big', 'Poppa');
    const channel1 = requestChannelsCreateV2(user2.token, 'Moodle', true);
    requestChannelJoinV2(user1.token, channel1.channelId);
    requestChannelJoinV2(user3.token, channel1.channelId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user3.authUserId);
    requestChannelAddOwnerV2(user2.token, channel1.channelId, user1.authUserId);
    requestchannelremoveowner(user2.token, channel1.channelId, user3.authUserId);
    expect(requestChannelDetailsV2(user2.token, channel1.channelId)).toStrictEqual(
      {
        name: 'Moodle',
        isPublic: true,
        ownerMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
          {
            uId: user1.authUserId,
            email: 'hayden.smith@gmail.com',
            nameFirst: 'Hayden',
            nameLast: 'Smith',
            handleStr: 'haydensmith',
          },
        ],
        allMembers: [
          {
            uId: user2.authUserId,
            email: 'joe.jenkins@gmail.com',
            nameFirst: 'joe',
            nameLast: 'jenkins',
            handleStr: 'joejenkins',
          },
          {
            uId: user1.authUserId,
            email: 'hayden.smith@gmail.com',
            nameFirst: 'Hayden',
            nameLast: 'Smith',
            handleStr: 'haydensmith',
          },
          {
            uId: user3.authUserId,
            email: 'big.poppa@gmail.com',
            nameFirst: 'Big',
            nameLast: 'Poppa',
            handleStr: 'bigpoppa',
          },
        ]
      });
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
