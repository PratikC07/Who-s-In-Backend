// src/middlewares/errorHandler.ts
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/errors.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("❌ An error was caught by the central handler:", err);

  // Handle our custom ApiErrors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: "fail",
      message: err.message,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  // Handle any other unexpected errors
  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};
