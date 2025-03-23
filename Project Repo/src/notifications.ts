import { getData } from './dataStore';
import HTTPError from 'http-errors';

export interface notifications {
  channelId: number;
  dmId: number;
  notificationMessage: string,
}

export function notificationsGetV1(userId: string | number) {
  if (userId === 'Invalid token' || typeof (userId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  const data = getData();

  console.log(data.usernotifications);

  for (const usernotifications of data.usernotifications) {
    if (usernotifications.uId === userId) {
      console.log(usernotifications);
      const notificationArray = usernotifications.notifications.slice(0, 20);
      return {
        notifications: notificationArray,
      };
    }
  }
  return { notifications: [] };
}
