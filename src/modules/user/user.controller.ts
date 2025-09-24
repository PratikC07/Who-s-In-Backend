import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../middlewares/isAuthenticated.js";
import { getUserProfile, updateUserProfile } from "./user.service.js";
import { redisClient } from "../../lib/redis.js";
import { catchAsync } from "../../utils/catchAsync.js";

export const getMyProfile = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const cacheKey = `user:profile:${userId}`;

    // 👈 2. Check the cache first
    const catchedProfile = await redisClient.get(cacheKey);

    if (catchedProfile) {
      return res.status(200).json({
        status: "success",
        data: {
          userProfile: JSON.parse(catchedProfile),
        },
      });
    }

    // 👈 3. If not in cache, fetch from the database
    const userProfile = await getUserProfile(userId!);

    // 👈 3. Save the result to the cache for future requests
    // Set a 1-hour expiration
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(userProfile));

    res.status(200).json({
      status: "success",
      data: {
        userProfile,
      },
    });
  }
);

export const updateMyProfile = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.userId;

    const file = req.file;
    const body = req.body;

    const updatedUser = await updateUserProfile(userId, body, file);

    res.status(200).json({
      status: "success",
      data: {
        updatedUser,
      },
    });
  }
);
