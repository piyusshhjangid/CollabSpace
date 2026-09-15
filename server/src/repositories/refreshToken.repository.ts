import { prisma } from "../db/prisma.js";

export async function createRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date,
) {
  return prisma.refresh_tokens.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });
}

export async function findRefreshToken(token: string) {
  return prisma.refresh_tokens.findUnique({
    where: {
      token,
    },
  });
}

export async function revokeRefreshToken(token: string) {
  return prisma.refresh_tokens.update({
    where: {
      token,
    },
    data: {
      revoked_at: new Date(),
    },
  });
}