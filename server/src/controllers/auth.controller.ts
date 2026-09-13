import type { RequestHandler } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
import type { ApiResponse } from "../types/apiResponse.js";
import type { RegisterBody, LoginBody } from "../schemas/auth.schema.js";

export const register: RequestHandler<{}, any, RegisterBody> = async (
  req,
  res,
) => {
  const { name, email, password } = req.body;

  const user = await registerUser(name, email, password);

  const response: ApiResponse<typeof user> = {
    success: true,
    message: "User registered successfully",
    data: user,
  };

  res.status(201).json(response);
};

export const login: RequestHandler<
  {},
  any,
  LoginBody
> = async (req, res) => {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  const response: ApiResponse<typeof result> = {
    success: true,
    message: "Login successful",
    data: result,
  };

  res.json(response);
};