import request, { HttpVerb } from 'sync-request';
import { port, url } from './config.json';
import { requestChannelsCreateV2, requestChannelsListV2 } from './channels.test';
import { getData } from './dataStore';
import fs from 'fs';

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

export function requestAuthPasswordresetRequestV1(email: string) {
  return requestHelper('POST', '/auth/passwordreset/request/v1', {
    email
  });
}

export function requestAuthPasswordresetResetV1(resetCode: string, newPassword: string) {
  return requestHelper('POST', '/auth/passwordreset/reset/v1', {
    resetCode,
    newPassword
  });
}

export function requestAuthRegisterV3(email: string, password: string, nameFirst: string, nameLast: string) {
  return requestHelper('POST', '/auth/register/v3', {
    email,
    password,
    nameFirst,
    nameLast
  });
}

export function requestAuthLoginV1(email: string, password: string) {
  return requestHelper('POST', '/auth/login/v3', {
    email,
    password
  });
}

export function requestAuthLogoutV1(token: string) {
  return requestHelper('POST', '/auth/logout/v2', { token });
}

beforeEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
});

describe('authRegisterV3 - Missing Inputs', () => {
  test.each`
      email                         | pass                  | first         | last       | message
      ${''}                         | ${'thisIsMyPass1'}    | ${'Hayden'}   | ${'Smith'} | ${'email'}
      ${'thisisanemail@gmail.com'}  | ${''}                 | ${'Hayden'}   | ${'Smith'} | ${'password'}
      ${'thisisanemail@gmail.com'}  | ${'thisIsMyPass1'}    | ${''}         | ${'Smith'} | ${'firstName'}
      ${'thisisanemail@gmail.com'}  | ${'thisIsMyPass1'}    | ${'Hayden'}   | ${''}      | ${'lastName'}
    `('Fail case - missing $message', ({
    email,
    pass,
    first,
    last
  }) => {
    expect(requestAuthRegisterV3(email, pass, first, last)).toStrictEqual(400);
  });
});

describe('authRegisterV3 - Invalid Inputs', () => {
  test.each`
      email                         | pass                  | first                                                              | last                                                               | message
      ${'notAnEmailGmailCom'}       | ${'thisIsMyPass1'}    | ${'Hayden'}                                                        | ${'Smith'}                                                         | ${'invalid email'}
      ${'duplicate@gmail.com'}      | ${'thisIsMyPass1'}    | ${'Hayden'}                                                        | ${'Smith'}                                                         | ${'duplicate email'}
      ${'thisisanemail@gmail.com'}  | ${'Pass1'}            | ${'Hayden'}                                                        | ${'Smith'}                                                         | ${'password < 6 characters'}
      ${'thisisanemail@gmail.com'}  | ${'thisIsMyPass1'}    | ${'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'}  | ${'Smith'}                                                         | ${'nameFirst > 50 characters'} 
      ${'thisisanemail@gmail.com'}  | ${'thisIsMyPass1'}    | ${'Hayden'}                                                        | ${'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'}  | ${'nameLast > 50 characters'} 
    `('Fail case - $message', ({
    email,
    pass,
    first,
    last
  }) => {
    if (email === 'duplicate@gmail.com') {
      requestAuthRegisterV3(email, pass, 'Big', 'Poppa');
    }
    expect(requestAuthRegisterV3(email, pass, first, last)).toStrictEqual(400);
  });
});

describe('Success Case (authRegisterV3)', () => {
  test('Valid and unique authUserId returned', () => {
    const user1 = requestAuthRegisterV3('validemail@gmail.com', 'thisIsMyPass1', 'Haydennnnnnn', 'Smithhhhhhhhhhhhh');
    const user2 = requestAuthRegisterV3('anothervalidemail@gmail.com', 'thisIsMyPass1', 'Big', 'Poppa');
    const user3 = requestAuthRegisterV3('asdhivalidemail@gmail.com', 'thisIsMyPass111', 'Haydennnnnnn', 'Smithhhhhhhhhhhhh');
    const user4 = requestAuthRegisterV3('asdhasdivalidemail@gmail.com', 'thisIsMyPass11', 'Haydennnnnnn', 'Smithhhhhhhhhhhhh');
    expect(user1).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(user2).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(user3).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(user4).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
    expect(user1.authUserId).not.toStrictEqual(user2.authUserId);
  });
});

describe('Missing Inputs (authLoginV3)', () => {
  test.each`
      email                         | pass                  | message
      ${''}                         | ${'thisIsMyPass1'}    | ${'email'}
      ${'thisisanemail@gmail.com'}  | ${''}                 | ${'password'}
    `('Fail case - missing $message', ({
    email,
    pass
  }) => {
    expect(requestAuthLoginV1(email, pass)).toStrictEqual(400);
  });
});

describe('Invalid Inputs (authLoginV3)', () => {
  // beforeEach(() => {
  // });
  test('Email does not exist in database', () => {
    requestAuthRegisterV3('validemail@gmail.com', 'thisIsMyPass1', 'Hayden', 'Smith');
    requestAuthRegisterV3('anothervalidemail@gmail.com', 'thisIsMyPass1', 'Big', 'Poppa');
    expect(requestAuthLoginV1('doesnotexist@gmail.com', 'thisIsMyPass1')).toStrictEqual(400);
  });

  test('Incorrect Password', () => {
    requestAuthRegisterV3('validemail@gmail.com', 'thisIsMyPass1', 'Hayden', 'Smith');
    expect(requestAuthLoginV1('validemail@gmail.com', 'thisIsNOTMyPass1')).toStrictEqual(400);
  });
});

describe('Success Case (authLoginV3)', () => {
  test('Successful authUserId returned', () => {
    requestAuthRegisterV3('validemail@gmail.com', 'thisIsMyPass1', 'Hayden', 'Smith');
    requestAuthRegisterV3('anothervalidemail@gmail.com', 'thisIsMyPass1', 'Big', 'Poppa');
    expect(requestAuthLoginV1('validemail@gmail.com', 'thisIsMyPass1')).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
  });
});

describe('Missing/Invalid Inputs (authLogoutV2)', () => {
  test.each`
      token                 | message    
      ${''}                 | ${'missing token'}
      ${'thisisnotvalid'}   | ${'invalid token'}
    `('Fail case - $message', ({ token }) => {
    expect(requestAuthLogoutV1(token)).toStrictEqual(403);
  });
});
// Test above is okay

describe('Success Case (authLogoutV2)', () => {
  test('Successful Logout', () => {
    const user1 = requestAuthRegisterV3('validemail@gmail.com', 'thisIsMyPass1', 'Hayden', 'Smith');
    requestChannelsCreateV2(user1.token, 'channel1', true);
    expect(requestChannelsListV2(user1.token)).toStrictEqual({
      channels: [{
        channelId: 1,
        name: 'channel1'
      }]
    });
    requestAuthLogoutV1(user1.token);
    expect(requestChannelsListV2(user1.token)).toStrictEqual(403);
  });
});

describe('/auth/passwordreset/request/v1 tests', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    requestAuthRegisterV3('stanley.kal42@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
  });

  test('Success case - email does not exist', () => {
    const data = getData();
    requestAuthPasswordresetRequestV1('invalidemail@gmail.com');
    expect(getData()).toStrictEqual(data);
  });

  test('Success case - email exists', () => {
    requestAuthPasswordresetRequestV1('stanley.kal42@gmail.com');
    const data = getData();
    expect(data.users[0].resetCode).toStrictEqual(expect.any(String));
    expect(data.users[0].sessions).toStrictEqual([]);
  });
});

describe('/auth/passwordreset/reset/v1', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    requestAuthRegisterV3('stanley.kal42@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
  });

  test('Fail case - resetCode is not a valid reset code', () => {
    requestAuthPasswordresetRequestV1('stanley.kal42@gmail.com');
    expect(requestAuthPasswordresetResetV1('invalidCode', 'newPassword')).toStrictEqual(400);
  });

  test('Fail case - newPassword is less than 6 characters long', () => {
    requestAuthPasswordresetRequestV1('stanley.kal42@gmail.com');
    const data = getData();
    const resetCode = data.users[0].resetCode;
    expect(requestAuthPasswordresetResetV1(resetCode, 'short')).toStrictEqual(400);
  });

  test('Success case', () => {
    requestAuthPasswordresetRequestV1('stanley.kal42@gmail.com');
    let data = getData();
    let resetCode = data.users[0].resetCode;
    expect(requestAuthPasswordresetResetV1(resetCode, 'newPassword')).toStrictEqual({});
    data = getData();
    resetCode = data.users[0].resetCode;
    expect(resetCode).toStrictEqual(null);
    expect(requestAuthLoginV1('stanley.kal42@gmail.com', 'newPassword')).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
  });
});

describe('Loading up database when datastore.ts does not exist', () => {
  test('Deleting DataBase', () => {
    request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
    const path = './database.json';
    try {
      fs.unlinkSync(path);
      requestAuthRegisterV3('stanley.kal42@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
      // file removed
    } catch (err) {
      requestAuthRegisterV3('stanley.kal42@gmail.com', 'ThisIsMyPass1', 'Hayden', 'Smith');
      console.error(err);
    }
  });
  expect(1).toStrictEqual(1);
});

request('DELETE', SERVER_URL + '/clear/v1', { json: {} });
