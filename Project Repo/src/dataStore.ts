import fs from 'fs';
import { workspaceStats } from './users.test';

export interface channelOwners {
  uId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  handleStr: string;
}

export interface channelMembers {
  uId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  handleStr: string;
}

export interface reacts {
  reactId: number;
  uIds: number[];
}

export interface channelMessages {
  messageId: number;
  uId: number;
  message: string;
  timeSent: number;
  isPinned: boolean;
  reacts: reacts[];
}

export interface channelsJoined {
  numChannelsJoined: number;
  timeStamp: number;
}

export interface dmsJoined {
  numDmsJoined: number;
  timeStamp: number;
}

export interface messagesSent {
  numMessagesSent: number;
  timeStamp: number;
}

export interface users {
  uId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  handleStr: string;
  password: string;
  globalPermissionId: number;
  sessions: string[];
  resetCode: string;
  profileImgUrl: string;
  channelsJoined?: channelsJoined[];
  dmsJoined?: dmsJoined[];
  messagesSent?: messagesSent[];
  involvementRate?: number;
}

// Add these new properties in authRegister, empty arrays
// When e.g. Channel is Joined/Created, add the object (channelsJoined) to the array

export interface userDetails {
  uId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  handleStr: string;
  profileImgUrl: string;
}

export interface channels {
  channelId: number;
  name: string;
  isPublic: boolean;
  standupActive: boolean;
  standupFinishTime: number | null;
  standup: string[];
  ownerMembers: channelOwners[];
  allMembers: channelMembers[];
  messages: channelMessages[];
}

export interface notifications {
  channelId: number;
  dmId: number;
  notificationMessage: string,
}

export interface usernotifications {
  uId: number;
  notifications: notifications[];
}

export interface dmMessages {
  messageId: number;
  uId: number;
  message: string;
  timeSent: number;
  isPinned: boolean;
}

export interface dm {
  dmId: number;
  creatorId: number;
  uIds: number[];
  name: string;
  messages: dmMessages[];
}

export interface dataBase {
  users: users[];
  channels: channels[];
  usernotifications: usernotifications[];
  dms: dm[];
  statistics: workspaceStats;
}

let data: dataBase = {
  users: [],
  channels: [],
  usernotifications: [],
  dms: [],
  statistics: {
    channelsExist: [
      {
        numChannelsExist: 0,
        timeStamp: new Date().getTime(),
      },
    ],
    dmsExist: [
      {
        numDmsExist: 0,
        timeStamp: new Date().getTime(),
      },
    ],
    messagesExist: [
      {
        numMessagesExist: 0,
        timeStamp: new Date().getTime(),
      },
    ],
    utilizationRate: 0,
  },
};

// Use get() to access the data
function getData() {
  let data;
  if (fs.existsSync('./database.json')) {
    const dataJsonString = fs.readFileSync('./database.json');
    data = JSON.parse(String(dataJsonString));
  } else {
    data = {
      users: [],
      channels: [],
      dms: [],
      statistics: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: new Date().getTime(),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: new Date().getTime(),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: new Date().getTime(),
          },
        ],
        utilizationRate: 0,
      },
    };
    const dataJsonString = JSON.stringify(data);
    fs.writeFileSync('./database.json', dataJsonString);
  }
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made.
function setData(newData: dataBase) {
  data = newData;
  const dataJsonString = JSON.stringify(data);
  fs.writeFileSync('./database.json', dataJsonString);
}

export { getData, setData };
