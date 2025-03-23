import { getData, setData } from './dataStore';
import validator from 'validator';
import { checkValidUserId, tokenFinder, tokenGenerator } from './other';
import HTTPError from 'http-errors';

const nodemailer = require('nodemailer');

export interface returnauthLoginV1 {
  token: string;
  authUserId: number;
}

export interface error {
  error: string;
}

/**
 *
 * @param email
 * @param password
 * @returns {{error: string}|{authUserId: (number|*)}}
 */
export function authLoginV3(email: string, password: string) {
  const data = getData();
  for (const user of data.users) {
    if (email === user.email) {
      if (password === user.password) {
        const newSession = tokenGenerator();
        user.sessions.push(newSession);
        setData(data);
        return {
          token: newSession,
          authUserId: user.uId
        };
      } else {
        throw HTTPError(400, 'Incorrect password');
      }
    }
  }
  throw HTTPError(400, 'Email or Inputs Invalid');
}

/**
 *
 * @param email
 * @param password
 * @param nameFirst
 * @param nameLast
 * @returns {{error: string}|{authUserId: number}}
 */
export function authRegisterV3(email: string, password: string, nameFirst: string, nameLast: string) {
  // errors are split into separate if statements in preparation for different error codes in iteration 2
  // check if email is valid
  if (validator.isEmail(email) === false) {
    throw HTTPError(400, 'Invalid Email');
  }

  // check password is at least 6 characters
  if (password.length < 6) {
    throw HTTPError(400, 'Password must be at least 6 characters');
  }

  // check first name is between 1 and 50 characters
  if (nameFirst.length > 50 || nameFirst.length < 1) {
    throw HTTPError(400, 'NameFirst must be between 1 and 50 characters');
  }

  // check last name is between 1 and 50 characters
  if (nameLast.length > 50 || nameLast.length < 1) {
    throw HTTPError(400, 'NameLast must be between 1 and 50 characters');
  }

  const data = getData();
  const handlesList = [];

  for (const user of data.users) {
    // check if email is already registered
    if (email === user.email) {
      throw HTTPError(400, 'Email is already registered');
    }
    handlesList.push(user.handleStr);
  }

  // generate unique handleStr
  let handleStr = (nameFirst + nameLast).toLowerCase().replace(/[^a-z0-9]/gi, '');
  if (handleStr.length > 20) {
    handleStr = handleStr.slice(0, 20);
  }
  if (handlesList.includes(handleStr)) {
    let handleNum = 0;
    let newHandle = handleStr + handleNum;
    while (handlesList.includes(newHandle)) {
      handleNum += 1;
      newHandle = handleStr + handleNum;
    }
    handleStr = newHandle;
  }

  let index = 1;
  let uId = 1;

  while (true) {
    if (checkValidUserId(index)) {
      index++;
    } else {
      uId = index;
      break;
    }
  }

  // generate unique uId
  // const uId = handlesList.length + 1;

  // sets globalPermissionId (Global owner if first member to register)
  let globalPermissionId;
  if (data.users.length === 0) {
    globalPermissionId = 1;
  } else {
    globalPermissionId = 2;
  }

  const userSessions = [];
  const userToken = tokenGenerator();
  userSessions.push(userToken);
  // When I call newSession, does it call the function again? Cuz I don't want it to

  // User Statistics
  const channelsJoined = [
    {
      numChannelsJoined: 0,
      timeStamp: new Date().getTime(),
    },
  ];
  const dmsJoined = [
    {
      numDmsJoined: 0,
      timeStamp: new Date().getTime(),
    },
  ];
  const messagesSent = [
    {
      numMessagesSent: 0,
      timeStamp: new Date().getTime(),
    },
  ];
  const involvementRate = 0;

  const newUser = {
    uId: uId,
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
    handleStr: handleStr,
    password: password,
    globalPermissionId: globalPermissionId,
    sessions: userSessions,
    channelsJoined: channelsJoined,
    dmsJoined: dmsJoined,
    messagesSent: messagesSent,
    involvementRate: involvementRate,
    resetCode: null,
  };

  data.users.push(newUser);
  setData(data);

  return {
    token: userToken,
    authUserId: uId,
  };
}

/**
 *
 * @param token
 */
export function authLogoutV2(token: string) {
  const data = getData();
  const userId = tokenFinder(token);

  if (userId === 'Invalid token' || typeof (userId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  for (const user of data.users) {
    if (user.uId === userId) {
      const tokenIndex = user.sessions.indexOf(token);
      if (tokenIndex > -1) {
        user.sessions.splice(tokenIndex, 1);
      }
    }
  }

  setData(data);
  return {};
}

export function authPasswordresetRequestV1(email: string): Record<string, never> {
  const data = getData();
  for (const user of data.users) {
    if (user.email === email) {
      let code = Math.floor(Math.random() * 10).toString();
      for (let i = 0; i < 5; i++) {
        code = code.concat(Math.floor(Math.random() * 10).toString());
      }
      user.resetCode = code;
      user.sessions = [];
      setData(data);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: '1531beansofficial@gmail.com',
          pass: 'iofvdoewszzabxwn'
        }
      });

      const mailOptions = {
        from: '1531beansofficial@gmail.com',
        to: email,
        subject: `${code} is your reset code.`,
        text: `Hello ${user.nameFirst} ${user.nameLast}, your 6 digit code to reset your 1531 Beans password is ${code}.`
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    }
  }

  return {};
}

export function authPasswordresetResetV1(resetCode: string, newPassword: string): Record<string, never> {
  if (newPassword.length < 6) {
    throw HTTPError(400, 'Password must be at least 6 characters');
  }
  const data = getData();
  for (const user of data.users) {
    if (user.resetCode === resetCode) {
      user.password = newPassword;
      user.resetCode = null;
      setData(data);
      return {};
    }
  }
  throw HTTPError(400, 'Invalid password reset code');
}
