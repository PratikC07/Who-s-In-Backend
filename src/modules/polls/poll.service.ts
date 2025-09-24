import type { CreatePollSchema } from "./poll.types.js";
import { generateUniqueShareCode } from "../../utils/generate_uniqueCode.js";
import prisma from "../../lib/prisma.js";
import { redisClient } from "../../lib/redis.js";
import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../utils/errors.js";

export const createPoll = async (data: CreatePollSchema, userId: string) => {
  try {
    const shareCode = await generateUniqueShareCode();

    // Use a transaction to ensure both the poll and its options are created
    const poll = await prisma.$transaction(async (tx) => {
      const newPoll = await tx.poll.create({
        data: {
          title: data.title,
          UserId: userId,
          shareCode,
        },
      });

      // Create the options linked to the new poll
      await tx.option.createMany({
        data: data.options.map((optionText) => {
          return {
            text: optionText,
            pollId: newPoll.id,
          };
        }),
      });

      // 👇 Invalidate the user's poll list cache when they create a new poll
      const cacheKey = `user-polls:${userId}`;
      await redisClient.del(cacheKey);

      return newPoll;
    });

    return poll;
  } catch (error) {
    console.error("Error during poll creation transaction:", error);
    // 👇 If the transaction fails, it's a server-side issue.
    throw new InternalServerError("Could not create the poll.");
  }
};

export const findPollsByUser = async (userId: string) => {
  const cacheKey = `user-polls:${userId}`;

  // Check cache first
  const cachedPolls = await redisClient.get(cacheKey);
  if (cachedPolls) {
    return JSON.parse(cachedPolls);
  }

  // If not in cache, fetch from DB
  const polls = await prisma.poll.findMany({
    where: {
      UserId: userId,
    },
    include: {
      _count: {
        select: {
          votes: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Format the data to include totalVotes
  const pollsWithVoteCounts = polls.map((poll) => ({
    id: poll.id,
    title: poll.title,
    status: poll.status,
    shareCode: poll.shareCode,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
    UserId: poll.UserId,
    totalVotes: poll._count.votes,
  }));

  // Save to cache for 1 hour
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(pollsWithVoteCounts));

  return pollsWithVoteCounts;
};

export const closePoll = async (pollId: string, userId: string) => {
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });

  if (!poll) {
    // 👇 Use our semantic NotFoundError
    throw new NotFoundError("Poll not found");
  }
  if (poll.UserId !== userId) {
    // 👇 Use our semantic ForbiddenError for authorization issues
    throw new ForbiddenError("You are not authorized to close this poll");
  }

  // Invalidate all the caches
  const redirectCacheKey = `redirect:${poll.shareCode}`;
  const userPollsCacheKey = `user-polls:${userId}`;
  const votingCacheKey = `poll:voting:${pollId}`;
  const resultsCacheKey = `poll:results:${pollId}`;
  await redisClient.del([
    redirectCacheKey,
    userPollsCacheKey,
    votingCacheKey,
    resultsCacheKey,
  ]);

  // Publish the pollClosed update event to the poll-updates channel
  const pubSubChannel = `poll-updates:${pollId}`;
  const eventData = {
    eventType: "pollClosed",
    pollId: pollId,
    status: "closed",
  };
  await redisClient.publish(pubSubChannel, JSON.stringify(eventData));

  return await prisma.poll.update({
    where: { id: pollId },
    data: { status: "closed" },
  });
};

export const getPollShareLink = async (pollId: string) => {
  const cacheKey = `share-link:${pollId}`;

  // 1. Check the cache first
  const cachedShareCode = await redisClient.get(cacheKey);
  if (cachedShareCode) {
    return cachedShareCode;
  }

  // 2. If not in cache, fetch from DB
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { shareCode: true },
  });

  if (!poll) {
    // 👇 Use our semantic NotFoundError
    throw new NotFoundError("Poll not found");
  }

  // 3. Save the result to the cache for future requests
  // We can use a long expiration since the share code never changes
  await redisClient.setEx(cacheKey, 3600, poll.shareCode);

  return poll.shareCode;
};
