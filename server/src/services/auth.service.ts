import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
} from "../repositories/user.repository.js";
import { badRequest, unauthorized } from "../lib/AppError.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} from "../repositories/refreshToken.repository.js";

function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw badRequest("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await createUser(name, email, passwordHash);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw unauthorized("Invalid email or password");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
    },
    jwtSecret,
    {
      expiresIn: "15m",
    },
  );

  const refreshToken = generateRefreshToken();

  const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await createRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const storedToken = await findRefreshToken(refreshToken);

  if (!storedToken) {
    throw unauthorized("Invalid refresh token");
  }

  if (storedToken.revoked_at) {
    throw unauthorized("Invalid refresh token");
  }

  if (storedToken.expires_at <= new Date()) {
    throw unauthorized("Invalid refresh token");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const accessToken = jwt.sign(
    {
      sub: storedToken.user_id,
    },
    jwtSecret,
    {
      expiresIn: "15m",
    },
  );

  return {
    accessToken,
  };
}

export async function logoutUser(refreshToken: string) {
  const storedToken = await findRefreshToken(refreshToken);

  if (!storedToken) {
    return;
  }

  if (storedToken.revoked_at) {
    return;
  }

  await revokeRefreshToken(refreshToken);
}