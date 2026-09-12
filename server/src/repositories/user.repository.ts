import { prisma } from "../db/prisma.js";

export async function findUserByEmail(email: string) {
  return prisma.users.findUnique({
    where: {
      email,
    },
  });
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
) {
  return prisma.users.create({
    data: {
      name,
      email,
      password_hash: passwordHash,
    },
  });
}