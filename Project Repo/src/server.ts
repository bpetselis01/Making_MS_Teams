import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';

import {
  authLoginV3,
  authLogoutV2,
  authPasswordresetRequestV1,
  authPasswordresetResetV1,
  authRegisterV3
} from './auth';
import { channelsCreateV1, channelsListAllV3, channelsListV3 } from './channels';
import {
  channelAddownerV2,
  channelDetailsV3,
  channelInviteV3,
  channelJoinV3,
  channelLeaveV2,
  channelMessagesV3,
  channelRemoveOwnerV2
} from './channel';
import { dmCreateV2, dmDetailsV2, dmLeaveV2, dmListV2, dmMessagesV2, dmRemoveV2 } from './dm';
import { clearV1, tokenFinder } from './other';
import { usersAllV1, usersStatsV1 } from './users';
import {
  messageEditV2,
  messagePinV1,
  messageReactV1,
  messageRemoveV2,
  messageSenddmV2,
  messageSendlaterdmV1,
  messageSendlaterV1,
  messageSendV2,
  messageShareV1,
  messageUnpinV1,
  messageUnreactV1
} from './message';
import {
  userProfileSetEmailV1,
  userProfileSetHandleV1,
  userProfileSetNameV1,
  userProfileV1,
  userStatsV1
} from './user';
import { adminUserPermissionChange, adminUserRemove } from './admin';
import { standupActiveV1, standupSendV1, standupStartV1 } from './standup';
import { notificationsGetV1 } from './notifications';
import { searchV1 } from './search';

// interface user {uId: number, nameFirst: string, nameLast: string; email: string, handleStr?: string, password?: string};
// interface message {messageId: number, uId: string, message: string, timeSent: number};
// interface channel {channelId: number, name: string, isPublic?: boolean, ownerMembers?: user[], allMembers?: user[], messages?: message[]};
// interface messagereturn {messages: message[], start: number, end: number};

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));

// const PORT: number = parseInt(process.env.PORT || config.port);
// const HOST: string = process.env.IP || 'localhost';

// Example get request
app.get('/echo', (req: Request, res: Response, next) => {
  try {
    const data = req.query.echo as string;
    return res.json(echo(data));
  } catch (err) {
    next(err);
  }
});

// for logging errors (print to terminal)
app.use(morgan('dev'));
app.post('/auth/login/v3', (req: Request, res: Response, next) => {
  try {
    const {
      email,
      password
    } = req.body;
    return res.json(authLoginV3(email, password));
  } catch (err) {
    next(err);
  }
});

app.post('/auth/register/v3', (req: Request, res: Response, next) => {
  try {
    const {
      email,
      password,
      nameFirst,
      nameLast
    } = req.body;
    return res.json(authRegisterV3(email, password, nameFirst, nameLast));
  } catch (err) {
    next(err);
  }
});

app.post('/auth/logout/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(authLogoutV2(token));
  } catch (err) {
    next(err);
  }
});

app.post('/auth/passwordreset/request/v1', (req: Request, res: Response, next) => {
  try {
    const {
      email
    } = req.body;
    return res.json(authPasswordresetRequestV1(email));
  } catch (err) {
    next(err);
  }
});

app.post('/auth/passwordreset/reset/v1', (req: Request, res: Response, next) => {
  try {
    const {
      resetCode,
      newPassword
    } = req.body;
    return res.json(authPasswordresetResetV1(resetCode, newPassword));
  } catch (err) {
    next(err);
  }
});

app.post('/channels/create/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      name,
      isPublic
    } = req.body;
    return res.json(channelsCreateV1(tokenFinder(token), name, isPublic));
  } catch (err) {
    next(err);
  }
});

app.get('/channels/list/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(channelsListV3(tokenFinder(token)));
  } catch (err) {
    next(err);
  }
});

app.get('/channels/listall/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(channelsListAllV3(tokenFinder(token)));
  } catch (err) {
    next(err);
  }
});

app.get('/channel/details/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(channelDetailsV3(tokenFinder(token), parseInt(req.query.channelId as string)));
  } catch (err) {
    next(err);
  }
});

app.post('/channel/join/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      channelId
    } = req.body;
    return res.json(channelJoinV3(tokenFinder(token), channelId));
  } catch (err) {
    next(err);
  }
});

app.post('/channel/invite/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      channelId,
      uId
    } = req.body;
    return res.json(channelInviteV3(tokenFinder(token), channelId, uId));
  } catch (err) {
    next(err);
  }
});

app.get('/channel/messages/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(channelMessagesV3(tokenFinder(token), parseInt(req.query.channelId as string), parseInt(req.query.start as string)));
  } catch (err) {
    next(err);
  }
});

app.post('/channel/leave/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      channelId
    } = req.body;
    return res.json(channelLeaveV2(token, channelId));
  } catch (err) {
    next(err);
  }
});

app.post('/channel/addowner/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      channelId,
      uId
    } = req.body;
    return res.json(channelAddownerV2(token, channelId, uId));
  } catch (err) {
    next(err);
  }
});

app.post('/channel/removeowner/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      channelId,
      uId
    } = req.body;
    return res.json(channelRemoveOwnerV2(token, channelId, uId));
  } catch (err) {
    next(err);
  }
});

app.post('/dm/create/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      uIds,
    } = req.body;
    return res.json(dmCreateV2(tokenFinder(token), uIds));
  } catch (err) {
    next(err);
  }
});

app.get('/dm/list/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(dmListV2(tokenFinder(token)));
    // return res.json(channelMessagesV3(authUserId, parseInt(req.query.channelId as string), parseInt(req.query.start as string)));
  } catch (err) {
    next(err);
  }
});

app.get('/user/profile/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(userProfileV1(tokenFinder(token) as number | string, parseInt(req.query.uId as string)));
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setname/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      nameFirst,
      nameLast
    } = req.body;
    return res.json(userProfileSetNameV1(tokenFinder(token) as number | string, nameFirst, nameLast));
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setemail/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      email
    } = req.body;
    return res.json(userProfileSetEmailV1(tokenFinder(token) as number | string, email));
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/sethandle/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      handleStr
    } = req.body;
    return res.json(userProfileSetHandleV1(tokenFinder(token) as number | string, handleStr));
  } catch (err) {
    next(err);
  }
});

// app.post('/user/profile/uploadphoto/v1', (req: Request, res: Response, next) => {
//   try {
//     const token = req.header('token') as string;
//     const { imgUrl, xStart, yStart, xEnd, yEnd } = req.body;
//     return res.json(userProfileUploadPhotoV1(tokenFinder(token) as number | string, imgUrl, xStart, yStart, xEnd, yEnd));
//   } catch (err) {
//     next(err);
//   }
// });

app.get('/user/stats/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(userStatsV1(tokenFinder(token) as number | string));
  } catch (err) {
    next(err);
  }
});

app.get('/users/all/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(usersAllV1(tokenFinder(token)));
  } catch (err) {
    next(err);
  }
});

app.get('/users/stats/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(usersStatsV1(tokenFinder(token)));
  } catch (err) {
    next(err);
  }
});

app.delete('/admin/user/remove/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(adminUserRemove(tokenFinder(token), parseInt(req.query.uId as string)));
  } catch (err) {
    next(err);
  }
});

app.post('/admin/userpermission/change/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      uId,
      permissionId
    } = req.body;
    return res.json(adminUserPermissionChange(tokenFinder(token), uId, permissionId));
  } catch (err) {
    next(err);
  }
});

app.delete('/dm/remove/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const authUserId = tokenFinder(token);
    return res.json(dmRemoveV2(authUserId, parseInt(req.query.dmId as string)));
  } catch (err) {
    next(err);
  }
});

app.get('/dm/details/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const authUserId = tokenFinder(token);
    return res.json(dmDetailsV2(authUserId, parseInt(req.query.dmId as string)));
  } catch (err) {
    next(err);
  }
});

app.post('/dm/leave/v2', (req: Request, res: Response, next) => {
  try {
    const {
      dmId,
    } = req.body;
    const token = req.header('token') as string;
    const authUserId = tokenFinder(token);

    return res.json(dmLeaveV2(authUserId, dmId));
  } catch (err) {
    next(err);
  }
});

app.get('/dm/messages/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(dmMessagesV2(tokenFinder(token), parseInt(req.query.dmId as string), parseInt(req.query.start as string)));
  } catch (err) {
    next(err);
  }
});

app.post('/message/send/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      channelId,
      message
    } = req.body;
    return res.json(messageSendV2(tokenFinder(token), channelId, message));
  } catch (err) {
    next(err);
  }
});

app.put('/message/edit/v2', (req: Request, res: Response) => {
  const {
    messageId,
    message
  } = req.body;
  const token = req.header('token') as string;
  const authUserId = tokenFinder(token);
  return res.json(messageEditV2(authUserId, messageId, message));
});

app.delete('/message/remove/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const authUserId = tokenFinder(token);
  const messageId = parseInt(req.query.messageId as string);
  return res.json(messageRemoveV2(authUserId, messageId));
});

app.post('/message/senddm/v2', (req: Request, res: Response, next) => {
  try {
    const {
      dmId,
      message
    } = req.body;
    const token = req.header('token') as string;
    return res.json(messageSenddmV2(tokenFinder(token), dmId, message));
  } catch (err) {
    next(err);
  }
});

app.post('/message/pin/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { messageId } = req.body;
    return res.json(messagePinV1(tokenFinder(token), messageId));
  } catch (err) {
    next(err);
  }
});

app.post('/message/unpin/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { messageId } = req.body;
    return res.json(messageUnpinV1(tokenFinder(token), messageId));
  } catch (err) {
    next(err);
  }
});

app.post('/message/sendlater/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      channelId,
      message,
      timeSent
    } = req.body;
    return res.json(messageSendlaterV1(tokenFinder(token), channelId, message, timeSent));
  } catch (err) {
    next(err);
  }
});

app.post('/message/sendlaterdm/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      dmId,
      message,
      timeSent
    } = req.body;
    return res.json(messageSendlaterdmV1(tokenFinder(token), dmId, message, timeSent));
  } catch (err) {
    next(err);
  }
});

app.post('/message/react/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      messageId,
      reactId
    } = req.body;
    return res.json(messageReactV1(tokenFinder(token), messageId, reactId));
  } catch (err) {
    next(err);
  }
});

app.post('/message/unreact/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      messageId,
      reactId
    } = req.body;
    return res.json(messageUnreactV1(tokenFinder(token), messageId, reactId));
  } catch (err) {
    next(err);
  }
});

app.post('/message/share/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const {
      ogMessageId,
      message,
      channelId,
      dmId
    } = req.body;
    return res.json(messageShareV1(tokenFinder(token), ogMessageId, message, channelId, dmId));
  } catch (err) {
    next(err);
  }
});

app.post('/standup/start/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const authUserId = tokenFinder(token);
    const {
      channelId,
      length
    } = req.body;
    return res.json(standupStartV1(authUserId, channelId, length));
  } catch (err) {
    next(err);
  }
});

app.get('/standup/active/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const authUserId = tokenFinder(token);
    return res.json(standupActiveV1(authUserId, parseInt(req.query.channelId as string)));
  } catch (err) {
    next(err);
  }
});

app.post('/standup/send/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const authUserId = tokenFinder(token);
    const {
      channelId,
      message
    } = req.body;
    return res.json(standupSendV1(authUserId, channelId, message));
  } catch (err) {
    next(err);
  }
});

app.get('/notifications/get/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    return res.json(notificationsGetV1(tokenFinder(token)));
  } catch (err) {
    next(err);
  }
});

app.get('/search/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    return res.json(searchV1(token, req.query.queryStr as string));
  } catch (err) {
    next(err);
  }
});

app.delete('/clear/v1', (req: Request, res: Response) => {
  res.json(clearV1());
});

// handles errors nicely
app.use(errorHandler());

// start server
// let server = app.listen(PORT, HOST, () => {
//   // DO NOT CHANGE THIS LINE
//   console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
// });

const server = app.listen(parseInt(process.env.PORT || config.port), process.env.IP, () => {
  console.log(`⚡️ Server listening on port ${process.env.PORT || config.port}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
