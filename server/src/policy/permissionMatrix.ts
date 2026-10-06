import type { Role } from "../types/role.js";

export type PermissionAction =
  | "VIEW"
  | "DELETE_WORKSPACE"
  | "INVITE_MEMBERS"
  | "CREATE_PROJECT"
  | "DELETE_PROJECT"
  | "CREATE_TASK"
  | "UPDATE_OWN_TASK"
  | "REMOVE_MEMBER";

export const permissionMatrix: Record<
  PermissionAction,
  Record<Role, boolean>
> = {
  VIEW: {
    OWNER: true,
    ADMIN: true,
    MEMBER: true,
    VIEWER: true,
  },

  DELETE_WORKSPACE: {
    OWNER: true,
    ADMIN: false,
    MEMBER: false,
    VIEWER: false,
  },

  INVITE_MEMBERS: {
    OWNER: true,
    ADMIN: true,
    MEMBER: false,
    VIEWER: false,
  },

  CREATE_PROJECT: {
    OWNER: true,
    ADMIN: true,
    MEMBER: true,
    VIEWER: false,
  },

  DELETE_PROJECT: {
    OWNER: true,
    ADMIN: true,
    MEMBER: false,
    VIEWER: false,
  },

  CREATE_TASK: {
    OWNER: true,
    ADMIN: true,
    MEMBER: true,
    VIEWER: false,
  },

  UPDATE_OWN_TASK: {
    OWNER: true,
    ADMIN: true,
    MEMBER: true,
    VIEWER: false,
  },

  REMOVE_MEMBER: {
    OWNER: true,
    ADMIN: true,
    MEMBER: false,
    VIEWER: false,
  },
};

export function hasPermission(
  role: Role,
  action: PermissionAction,
): boolean {
  return permissionMatrix[action][role] ?? false;
}
