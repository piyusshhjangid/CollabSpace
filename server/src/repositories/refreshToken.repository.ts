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

export async function rotateRefreshToken(
  token: string,
  newToken: string,
  newExpiresAt: Date,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.refresh_tokens.findUnique({
      where: {
        token,
      },
    });

    if (!current) {
      return null;
    }

    const now = new Date();

    if (
      current.revoked_at ||
      current.expires_at <= now
    ) {
      return null;
    }

    const revoked = await tx.refresh_tokens.updateMany({
      where: {
        token,
        revoked_at: null,
        expires_at: {
          gt: now,
        },
      },
      data: {
        revoked_at: now,
      },
    });

    if (revoked.count !== 1) {
      return null;
    }

    await tx.refresh_tokens.create({
      data: {
        user_id: current.user_id,
        token: newToken,
        expires_at: newExpiresAt,
      },
    });

    return {
      userId: current.user_id,
    };
  });
}
