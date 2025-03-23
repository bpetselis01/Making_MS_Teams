import HTTPError from 'http-errors';
import {
  changeGlobalPermissions,
  checkOnlyGlobalOwner,
  checkUserIsGlobalOwner,
  checkValidUserId,
  removeUserChannelMessages,
  removeUserDmMessages,
  removeUserFromAllChannels,
  removeUserFromAllDms,
  removeUserProfile
} from './other';

export function adminUserRemove(authUserId: number | string, uId: number) {
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidUserId(uId)) {
    throw HTTPError(400, 'Invalid GlobalMember');
  }

  if (!checkUserIsGlobalOwner(authUserId)) {
    throw HTTPError(403, 'Not a GlobalOwner, No Permissions');
  }

  if (checkOnlyGlobalOwner(uId)) {
    throw HTTPError(400, 'Only Global Owner, Unable to remove');
  }

  removeUserFromAllChannels(uId);
  removeUserChannelMessages(uId);
  removeUserDmMessages(uId);
  removeUserFromAllDms(uId);
  removeUserProfile(uId);
  return {};
}

export function adminUserPermissionChange(authUserId: number | string, uId: number, permissionId: number) {
  if (authUserId === 'Invalid token' || typeof (authUserId) === 'string') {
    throw HTTPError(403, 'Invalid Token');
  }

  if (!checkValidUserId(uId)) {
    throw HTTPError(400, 'Invalid GlobalMember');
  }

  if (!checkUserIsGlobalOwner(authUserId)) {
    throw HTTPError(403, 'Not a GlobalOwner, No Permissions');
  }

  if (checkUserIsGlobalOwner(uId) && permissionId === 1) {
    throw HTTPError(400, 'PermissionId Same as Before');
  }

  if (!checkUserIsGlobalOwner(uId) && permissionId === 2) {
    throw HTTPError(400, 'PermissionId Same as Before');
  }

  if (checkOnlyGlobalOwner(uId)) {
    throw HTTPError(400, 'Only Global Owner, Unable to remove');
  }

  if (permissionId === undefined || (permissionId !== 1 && permissionId !== 2)) {
    throw HTTPError(400, 'Invalid PermissionId');
  }

  changeGlobalPermissions(uId, permissionId);

  return {};
}
