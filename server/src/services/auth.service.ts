import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
} from "../repositories/user.repository.js";
import { badRequest, unauthorized } from "../lib/AppError.js";
import jwt from "jsonwebtoken";

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

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}
