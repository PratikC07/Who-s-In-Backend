import type { NextFunction, Request, Response } from "express";
import type { LoginSchema, RegisterSchema } from "./auth.types.js";
import { loginUser, registerUser } from "./auth.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

export const register = catchAsync(
  async (
    req: Request<{}, {}, RegisterSchema>,
    res: Response,
    next: NextFunction
  ) => {
    const response = await registerUser(req.body);

    res.status(201).json({
      status: "success",
      data: {
        ...response,
      },
    });
  }
);

export const login = catchAsync(
  async (
    req: Request<{}, {}, LoginSchema>,
    res: Response,
    next: NextFunction
  ) => {
    const response = await loginUser(req.body);

    res.status(200).json({
      status: "success",
      data: {
        ...response,
      },
    });
  }
);
