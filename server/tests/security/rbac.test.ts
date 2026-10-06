import { describe, expect, it } from "vitest";
import {
  hasPermission,
  permissionMatrix,
  type PermissionAction,
} from "../../src/policy/permissionMatrix.js";
import { ROLES, type Role } from "../../src/types/role.js";

describe("RBAC permission matrix", () => {
  const actions = Object.keys(permissionMatrix) as PermissionAction[];

  it("defines every role for every action", () => {
    for (const action of actions) {
      for (const role of ROLES) {
        expect(typeof permissionMatrix[action][role]).toBe("boolean");
      }
    }
  });

  it("allows every role to view", () => {
    for (const role of ROLES) {
      expect(hasPermission(role, "VIEW")).toBe(true);
    }
  });

  it("only allows OWNER to delete a workspace", () => {
    expect(hasPermission("OWNER", "DELETE_WORKSPACE")).toBe(true);
    expect(hasPermission("ADMIN", "DELETE_WORKSPACE")).toBe(false);
    expect(hasPermission("MEMBER", "DELETE_WORKSPACE")).toBe(false);
    expect(hasPermission("VIEWER", "DELETE_WORKSPACE")).toBe(false);
  });

  it("only allows OWNER and ADMIN to invite members", () => {
    expect(hasPermission("OWNER", "INVITE_MEMBERS")).toBe(true);
    expect(hasPermission("ADMIN", "INVITE_MEMBERS")).toBe(true);
    expect(hasPermission("MEMBER", "INVITE_MEMBERS")).toBe(false);
    expect(hasPermission("VIEWER", "INVITE_MEMBERS")).toBe(false);
  });

  it("allows MEMBER to create projects and tasks but not VIEWER", () => {
    expect(hasPermission("MEMBER", "CREATE_PROJECT")).toBe(true);
    expect(hasPermission("MEMBER", "CREATE_TASK")).toBe(true);

    expect(hasPermission("VIEWER", "CREATE_PROJECT")).toBe(false);
    expect(hasPermission("VIEWER", "CREATE_TASK")).toBe(false);
  });

  it("does not allow VIEWER to update own tasks", () => {
    expect(hasPermission("VIEWER", "UPDATE_OWN_TASK")).toBe(false);
  });

  it("only allows OWNER and ADMIN to remove members", () => {
    expect(hasPermission("OWNER", "REMOVE_MEMBER")).toBe(true);
    expect(hasPermission("ADMIN", "REMOVE_MEMBER")).toBe(true);
    expect(hasPermission("MEMBER", "REMOVE_MEMBER")).toBe(false);
    expect(hasPermission("VIEWER", "REMOVE_MEMBER")).toBe(false);
  });
});
