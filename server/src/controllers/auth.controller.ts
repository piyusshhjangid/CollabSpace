import type { RequestHandler } from "express";
import type { RegisterBody } from "../schemas/auth.schema.js";
import { registerUser } from "../services/auth.service.js";
import type { ApiResponse } from "../types/apiResponse.js";

export const register: RequestHandler<
  {},
  any,
  RegisterBody
> = async (req, res) => {
  const { name, email, password } = req.body;

  const user = await registerUser(
    name,
    email,
    password,
  );

  const response: ApiResponse<typeof user> = {
    success: true,
    message: "User registered successfully",
    data: user,
  };

  res.status(201).json(response);
};