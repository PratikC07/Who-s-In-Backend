import type { NextFunction, Request, Response } from "express";

type AsyncController<T extends Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async controller to catch any errors and pass them to the
 * global error handler. It preserves the controller's specific request type.
 * @param fn The async controller function to wrap.
 * @returns An Express middleware function.
 */

export const catchAsync = <T extends Request>(fn: AsyncController<T>) => {
  return async (req: T, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// for more info , go to this link,
// https://chatgpt.com/s/t_68c823f716048191a645e6e7447f234a
