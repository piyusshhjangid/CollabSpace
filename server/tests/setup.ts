import "dotenv/config";
import { beforeEach, afterAll } from "vitest";

const developmentUrl = process.env.DATABASE_URL;

if (!developmentUrl) {
  throw new Error("DATABASE_URL is missing.");
}

const testUrl = new URL(developmentUrl);
const databaseName = decodeURIComponent(
  testUrl.pathname.replace(/^\/+/, "")
);

if (
  !["localhost", "127.0.0.1", "::1"].includes(testUrl.hostname) ||
  databaseName !== "collabspace"
) {
  throw new Error(
    "Refusing to run tests: expected a local DATABASE_URL pointing to collabspace."
  );
}

testUrl.pathname = "/collabspace_test";

process.env.DATABASE_URL_TEST = testUrl.toString();
process.env.DATABASE_URL = testUrl.toString();

const { prisma } = await import("../src/db/prisma.js");

beforeEach(async () => {
  await prisma.$transaction([
    prisma.task_status_history.deleteMany(),
    prisma.tasks.deleteMany(),
    prisma.invitations.deleteMany(),
    prisma.refresh_tokens.deleteMany(),
    prisma.workspace_members.deleteMany(),
    prisma.projects.deleteMany(),
    prisma.workspaces.deleteMany(),
    prisma.users.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
