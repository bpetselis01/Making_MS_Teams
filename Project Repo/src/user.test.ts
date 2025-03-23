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

export function requestUserProfileV1(token: string, uId: number) {
  return requestHelper('GET', '/user/profile/v3', {
    token,
    uId
  });
}

export function requestUserProfileSetNameV1(token: string, nameFirst: string, nameLast: string) {
  return requestHelper('PUT', '/user/profile/setname/v2', {
    token,
    nameFirst,
    nameLast
  });
}

export function requestUserProfileSetEmailV1(token: string, email: string) {
  return requestHelper('PUT', '/user/profile/setemail/v2', {
    token,
    email
  });
}

export function requestUserProfileSetHandleV1(token: string, handleStr: string) {
  return requestHelper('PUT', '/user/profile/sethandle/v2', {
    token,
    handleStr
  });
}

export function requestUserProfileUploadPhotoV1(token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) {
  return requestHelper('POST', '/user/profile/uploadphoto/v1', {
    token,
    imgUrl,
    xStart,
    yStart,
    xEnd,
    yEnd
  });
}

export function requestUserStatsV1(token: string) {
  return requestHelper('GET', '/user/stats/v1', { token });
}

// To get the user stats, we can pass in the authUserId, we just need to make sure that there is a token being passed through the headers
// And then like we have done in server.ts, we can convert this token into an authUserId and then pass that into a function that gets the UserStats

describe('Invalid Inputs (requestUserProfileV1)', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
  });

  test('Invalid User, first user', () => {
    const user = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    expect(requestUserProfileV1(user.token + 'invalid', 2)).toStrictEqual(403);
  });

  test('Invalid User, multiple users', () => {
    // const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    expect(requestUserProfileV1(user2.token, 3)).toStrictEqual(400);
  });

  test('Invalid User, no users', () => {
    expect(requestUserProfileV1('', 0)).toStrictEqual(403);
  });
});

describe('Testing Correct Outputs (requestUserProfileV1)', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
  });

  test('Valid Output, first user', () => {
    const user = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    expect(requestUserProfileV1(user.token, user.authUserId)).toStrictEqual({
      user:
        {
          uId: user.authUserId,
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          email: 'hayden.smith@gmail.com',
          handleStr: 'haydensmith',
        },
    });
  });

  test('Valid Output, second user', () => {
    const user1 = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
    const user2 = requestAuthRegisterV3('phil.foden@gmail.com', 'ThisisMyPass2', 'Phil', 'Foden');
    expect(requestUserProfileV1(user1.token, user1.authUserId)).toStrictEqual({
      user:
        {
          uId: user1.authUserId,
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          email: 'hayden.smith@gmail.com',
          handleStr: 'haydensmith',
        },
    });
    expect(requestUserProfileV1(user2.token, user2.authUserId)).toStrictEqual({
      user:
        {
          uId: user2.authUserId,
          nameFirst: 'Phil',
          nameLast: 'Foden',
          email: 'phil.foden@gmail.com',
          handleStr: 'philfoden',
        },
    });
  });
});

describe('Testing Invalid Outputs (requestUserProfileSetNameV1)', () => {
  let userToken: string;
  let userToken1: string;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    userToken = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith').token;
    userToken1 = requestAuthRegisterV3('big.poppa@gmail.com', 'ThisisMyPass1', 'Big', 'Poppa').token;
  });

  test('Fail-Case: Invalid Token', () => {
    expect(requestUserProfileSetNameV1('invalidtoken', 'Byron', 'Petselis')).toStrictEqual(403);
  });

  test('Fail-Case: Missing firstName', () => {
    expect(requestUserProfileSetNameV1(userToken, '', 'Petselis')).toStrictEqual(400);
  });

  test('Fail-Case: Missing firstName', () => {
    expect(requestUserProfileSetNameV1(userToken1, '', 'Petselis')).toStrictEqual(400);
  });

  test('Fail-Case: Missing lastName', () => {
    expect(requestUserProfileSetNameV1(userToken, 'Byron', '')).toStrictEqual(400);
  });

  test('Fail-Case: Invalid firstName (Too Long)', () => {
    expect(requestUserProfileSetNameV1(userToken, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'Petselis')).toStrictEqual(400);
  });

  test('Fail-Case: Invalid lastName (Too Long)', () => {
    expect(requestUserProfileSetNameV1(userToken, 'Byron', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toStrictEqual(400);
  });
});

describe('Testing Correct Outputs (requestUserProfileSetNameV1)', () => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });

  test('Success Case', () => {
    const userToken: string = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith').token;
    requestUserProfileSetNameV1(userToken, 'Byron', 'Petselis');
    expect(requestUserProfileV1(userToken, 1)).toStrictEqual({
      user:
        {
          uId: 1,
          nameFirst: 'Byron',
          nameLast: 'Petselis',
          email: 'hayden.smith@gmail.com',
          handleStr: 'haydensmith',
        },
    });
  });
});

describe('Testing Invalid Outputs (requestUserProfileSetEmailV1)', () => {
  let userToken: string;
  let userToken1: string;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    userToken = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith').token;
    userToken1 = requestAuthRegisterV3('big.poppa@gmail.com', 'ThisisMyPass1', 'Big', 'Poppa').token;
  });

  test('Fail-Case: Invalid Token', () => {
    expect(requestUserProfileSetEmailV1('invalidtoken', 'smith.hayden@gmail.com')).toStrictEqual(403);
  });

  test('Fail-Case: Missing Email', () => {
    expect(requestUserProfileSetEmailV1(userToken, '')).toStrictEqual(400);
  });

  test('Fail-Case: Invalid Email', () => {
    expect(requestUserProfileSetEmailV1(userToken, 'email@gmailcom')).toStrictEqual(400);
  });

  test('Fail-Case: Invalid Email', () => {
    expect(requestUserProfileSetEmailV1(userToken, 'emailgmail.com')).toStrictEqual(400);
  });

  test('Fail-Case: Duplicate Email', () => {
    expect(requestUserProfileSetEmailV1(userToken1, 'hayden.smith@gmail.com')).toStrictEqual(400);
  });
});

describe('Testing Correct Outputs (requestUserProfileSetEmailV1)', () => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });

  test('Success Case', () => {
    const userToken: string = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith').token;
    requestUserProfileSetEmailV1(userToken, 'smith.hayden@gmail.com');
    expect(requestUserProfileV1(userToken, 1)).toStrictEqual({
      user:
        {
          uId: 1,
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          email: 'smith.hayden@gmail.com',
          handleStr: 'haydensmith',
        },
    });
  });
});

describe('Testing Invalid Outputs (requestUserProfileSetHandleV1)', () => {
  let userToken: string;
  let userToken1: string;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    userToken = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith').token;
    userToken1 = requestAuthRegisterV3('big.poppa@gmail.com', 'ThisisMyPass1', 'Big', 'Poppa').token;
  });

  test('Fail-Case: Invalid Token', () => {
    expect(requestUserProfileSetHandleV1('invalidtoken', 'smithhayden')).toStrictEqual(403);
  });

  test('Fail-Case: Missing Handle', () => {
    expect(requestUserProfileSetHandleV1(userToken, '')).toStrictEqual(400);
  });

  test('Fail-Case: Invalid Handle (Too Short)', () => {
    expect(requestUserProfileSetHandleV1(userToken, 'it')).toStrictEqual(400);
  });

  test('Fail-Case: Invalid Handle (Too Long)', () => {
    expect(requestUserProfileSetHandleV1(userToken, 'smithhaydensmithhaydennn')).toStrictEqual(400);
  });

  test('Fail-Case: Invalid Handle (Non-Alphanumeric)', () => {
    expect(requestUserProfileSetHandleV1(userToken, 'smith-hayden!!!')).toStrictEqual(400);
  });

  test('Fail-Case: Duplicate handleStr', () => {
    expect(requestUserProfileSetHandleV1(userToken1, 'haydensmith')).toStrictEqual(400);
  });
});

describe('Testing Correct Outputs (requestUserProfileSetHandleV1)', () => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });

  test('Success Case', () => {
    const userToken: string = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith').token;
    requestUserProfileSetHandleV1(userToken, 'smithhayden');
    expect(requestUserProfileV1(userToken, 1)).toStrictEqual({
      user:
        {
          uId: 1,
          nameFirst: 'Hayden',
          nameLast: 'Smith',
          email: 'hayden.smith@gmail.com',
          handleStr: 'smithhayden',
        },
    });
  });
});

// describe('Testing Invalid Inputs (user/profile/uploadphoto/v1)', () => {

//   let validLink;
//   let user;

//   beforeEach(() => {
//     request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
//     user = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
//     validLink = "http://i.picsum.photos/id/24/200/300.jpg?hmac=UogR0hFxP5yLDwcZpCawObw8Bzm9vnzci_7eMrbqn_s";
//   });

//   test('Failure Case - Invalid Token', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token + 'invalid', validLink, 0, 0, 200, 300)).toStrictEqual(403);
//   });

//   test('Failure Case - Invalid Link', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, validLink + 'Invalid', 0, 0, 200, 300)).toStrictEqual(400);
//   });

//   test('Failure Case - Invalid xStart', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, validLink, -1, 0, 200, 300)).toStrictEqual(400);
//   });

//   test('Failure Case - Invalid yStart', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, validLink, 0, -1, 200, 300)).toStrictEqual(400);
//   });

//   test('Failure Case - Invalid xEnd', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, validLink, 0, 0, -1, 300)).toStrictEqual(400);
//   });

//   test('Failure Case - Invalid xEnd', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, validLink, 0, 0, 200, -1)).toStrictEqual(400);
//   });

//   test('Failure Case - xEnd Smaller than xStart', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, validLink, 20, 0, 0, 300)).toStrictEqual(400);
//   });

//   test('Failure Case - yEnd Smaller than yStart', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, validLink, 0, 20, 200, 0)).toStrictEqual(400);
//   });

//   test('Failure Case - Non JPG Image', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, "http://i.picsum.photos/id/598/200/300.webp?hmac=tLk7Zz3I3TCNxO3b2Pwf3lfryRoqIZf2BHTgIb7dQTs", 0, 0, 200, 300)).toStrictEqual(400);
//   });
// });

// describe('Testing Correct Output (user/profile/uploadphoto/v1)', () => {
//   let validLink;
//   let user;

//   beforeEach(() => {
//     request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
//     user = requestAuthRegisterV3('hayden.smith@gmail.com', 'ThisisMyPass1', 'Hayden', 'Smith');
//     validLink = "http://i.picsum.photos/id/24/200/300.jpg?hmac=UogR0hFxP5yLDwcZpCawObw8Bzm9vnzci_7eMrbqn_s";
//   });

//   test('Success Case - Image added to profile', () => {
//     expect(requestUserProfileUploadPhotoV1(user.token, validLink, 0, 0, 200, 300)).toStrictEqual({});
//     expect(requestUserProfileV1(user.token, user.authUserId)).toStrictEqual({
//       user:
//         {
//           uId: user.authUserId,
//           nameFirst: 'Hayden',
//           nameLast: 'Smith',
//           email: 'hayden.smith@gmail.com',
//           handleStr: 'haydensmith',
//           profileImgUrl: "http://i.picsum.photos/id/24/200/300.jpg?hmac=UogR0hFxP5yLDwcZpCawObw8Bzm9vnzci_7eMrbqn_s",
//         },
//     });
//   });
// });

describe('Testing Correct Outputs (user/stats/v1)', () => {
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
    requestMessageRemoveV2(user.token, message.messageId); // Shouldn't have an impact
    requestDmRemoveV1(user.token, dm.dmId);
  });

  // If I'm getting a specific user's details, shouldn't I have a uId parameter?
  test('Success Case', () => {
    expect(requestUserStatsV1(user.token)).toStrictEqual({
      userStats:
        {
          channelsJoined: [
            {
              numChannelsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 1,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 2,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 3,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 4,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 5,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 4,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 3,
              timeStamp: expect.any(Number)
            }
          ],
          dmsJoined: [
            {
              numDmsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 1,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 2,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 3,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 2,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 1,
              timeStamp: expect.any(Number)
            },
          ],
          messagesSent: [
            {
              numMessagesSent: 0,
              timeStamp: expect.any(Number)
            },
            {
              numMessagesSent: 1,
              timeStamp: expect.any(Number)
            },
            {
              numMessagesSent: 2,
              timeStamp: expect.any(Number)
            },
            {
              numMessagesSent: 3,
              timeStamp: expect.any(Number)
            },
          ],
          involvementRate: expect.any(Number),
        }
    });
  });
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
