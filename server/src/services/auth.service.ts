import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
} from "../repositories/user.repository.js";
import { badRequest } from "../lib/AppError.js";

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

  const user = await createUser(
    name,
    email,
    passwordHash,
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };
}