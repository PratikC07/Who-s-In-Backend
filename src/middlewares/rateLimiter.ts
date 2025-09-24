import type { NextFunction } from "express";
import type { Request, Response } from "express";
import { redisClient } from "../lib/redis.js";
import { TooManyRequestsError } from "../utils/errors.js";

export const createRateLimiter = ({
  windowInSeconds,
  maxRequests,
}: {
  windowInSeconds: number;
  maxRequests: number;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Use req.ip which Express gets from headers like X-Forwarded-For
    const ip = req.ip;
    const key = `rate-limit:${req.originalUrl}:${ip}`;

    try {
      // Use a Redis transaction to perform multiple commands atomically
      const multi = redisClient.multi();
      multi.incr(key); // Increment the counter for this IP
      multi.expire(key, windowInSeconds); // Set/reset the expiration window

      const result = await multi.exec();

      // Handle potential null result from multi.exec() if Redis transaction fails
      if (!result || result.length === 0) {
        console.error("Redis transaction for rate limiting failed.");
        return next(); // Fail open
      }

      const currentRequests = result[0] as unknown as number;

      if (currentRequests > maxRequests) {
        // 👇 Throw an error instead of sending a response
        throw new TooManyRequestsError(
          "Too many requests, please try again later."
        );
      }

      next();
    } catch (error) {
      // If the error is the one we threw, pass it on.
      if (error instanceof TooManyRequestsError) {
        return next(error);
      }
      // For any other unexpected errors (e.g., Redis connection), fail open.
      console.error("Error in rate limiter:", error);
      next();
    }
  };
};
