import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { prisma } from "./setup.js";

export type TestRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export async function createUser(
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
  }> = {},
) {
  const password = overrides.password ?? "TestPassword123!";
  const email =
    overrides.email ??
    `user-${crypto.randomUUID()}@example.test`;

  const passwordHash = await bcrypt.hash(password, 4);

  const user = await prisma.users.create({
    data: {
      name: overrides.name ?? "Test User",
      email,
      password_hash: passwordHash,
    },
  });

  return {
    ...user,
    plainPassword: password,
  };
}

export async function createWorkspace(
  ownerUserId: string,
  name = `Workspace-${crypto.randomUUID()}`,
) {
  const workspace = await prisma.workspaces.create({
    data: {
      name,
    },
  });

  await prisma.workspace_members.create({
    data: {
      user_id: ownerUserId,
      workspace_id: workspace.id,
      role: "OWNER",
    },
  });

  return workspace;
}

export async function addMember(
  userId: string,
  workspaceId: string,
  role: TestRole = "MEMBER",
) {
  return prisma.workspace_members.create({
    data: {
      user_id: userId,
      workspace_id: workspaceId,
      role,
    },
  });
}

export async function createProject(
  workspaceId: string,
  name = `Project-${crypto.randomUUID()}`,
) {
  return prisma.projects.create({
    data: {
      workspace_id: workspaceId,
      name,
      description: "Security test project",
    },
  });
}

export async function createTask(
  projectId: string,
  workspaceId: string,
  title = `Task-${crypto.randomUUID()}`,
  assignedTo?: string,
) {
  return prisma.tasks.create({
    data: {
      project_id: projectId,
      workspace_id: workspaceId,
      title,
      assigned_to: assignedTo,
    },
  });
}

export async function createRefreshToken(
  userId: string,
  overrides: Partial<{
    token: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }> = {},
) {
  return prisma.refresh_tokens.create({
    data: {
      user_id: userId,
      token:
        overrides.token ??
        crypto.randomBytes(32).toString("hex"),
      expires_at:
        overrides.expiresAt ??
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked_at: overrides.revokedAt ?? null,
    },
  });
}

export function issueAccessToken(
  userId: string,
  expiresIn: jwt.SignOptions["expiresIn"] = "15m",
) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured for tests.");
  }

  return jwt.sign(
    {
      sub: userId,
    },
    secret,
    {
      expiresIn,
    },
  );
}

export async function createTwoTenantFixture() {
  const userA = await createUser({
    name: "Tenant A User",
    email: `tenant-a-${crypto.randomUUID()}@example.test`,
  });

  const userB = await createUser({
    name: "Tenant B User",
    email: `tenant-b-${crypto.randomUUID()}@example.test`,
  });

  const workspaceA = await createWorkspace(
    userA.id,
    "Workspace A",
  );

  const workspaceB = await createWorkspace(
    userB.id,
    "Workspace B",
  );

  const projectB = await createProject(
    workspaceB.id,
    "Workspace B Project",
  );

  const taskB = await createTask(
    projectB.id,
    workspaceB.id,
    "Workspace B Task",
    userB.id,
  );

  return {
    userA,
    userB,
    workspaceA,
    workspaceB,
    projectB,
    taskB,
    tokenA: issueAccessToken(userA.id),
    tokenB: issueAccessToken(userB.id),
  };
}
