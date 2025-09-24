import prisma from "../../lib/prisma.js";
import type { UpdateUserSchema } from "./user.types.js";
import { redisClient } from "../../lib/redis.js";
import { InternalServerError, NotFoundError } from "../../utils/errors.js";

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      photoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    // 👇 Throw a specific, semantic error
    throw new NotFoundError("User not found");
  }

  return user;
};

export const updateUserProfile = async (
  userId: string,
  data: UpdateUserSchema,
  file: Express.Multer.File | undefined
) => {
  const cacheKey = `user:profile:${userId}`;
  const updateData: any = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (file !== undefined) {
    updateData.photoUrl = file.path;
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      photoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (updatedUser) {
    await redisClient.del(cacheKey);
  }

  if (!updatedUser) {
    throw new InternalServerError(
      "An unexpected error occurred while updating the profile."
    );
  }

  return updatedUser;
};
