import prisma from "../../lib/prisma.js";
import { redisClient } from "../../lib/redis.js";
import { InternalServerError, NotFoundError } from "../../utils/errors.js";
import type { SubmitVoteInput } from "./public.types.js";

export const findPollForVoting = async (pollId: string) => {
  const cacheKey = `poll:voting:${pollId}`;

  // Check cache first
  const cachedPoll = await redisClient.get(cacheKey);
  if (cachedPoll) {
    return JSON.parse(cachedPoll);
  }

  // If not in cache, fetch from DB
  const poll = await prisma.poll.findUnique({
    where: {
      id: pollId,
      status: "active",
    },
    select: {
      id: true,
      title: true,
      options: {
        select: {
          id: true,
          text: true,
        },
      },
    },
  });

  if (!poll) {
    // 👇 Use our semantic NotFoundError
    throw new NotFoundError("Active poll not found or has been closed.");
  }

  // Save to cache for 1 hour
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(poll));

  return poll;
};

export const submitVote = async (pollId: string, data: SubmitVoteInput) => {
  try {
    let pollOwnerId: string | null = null;

    const vote = await prisma.$transaction(async (tx) => {
      // 1. Verify the poll is still active before accepting a vote
      const poll = await tx.poll.findUnique({
        where: { id: pollId, status: "active" },
        select: { UserId: true },
      });

      if (!poll) {
        // 👇 Use our semantic NotFoundError
        throw new NotFoundError(
          "This poll is no longer active or does not exist."
        );
      }

      pollOwnerId = poll.UserId;

      // 2. Create the vote
      const newVote = await tx.vote.create({
        data: {
          PollId: pollId,
          OptionId: data.optionId,
          voterName: data.voterName,
        },
        include: {
          option: {
            select: {
              text: true,
            },
          },
        },
      });

      return newVote;
    });

    // // 👈 2. Invalidate the results cache & publish event after the DB transaction succeeds
    // const resultsCacheKey = `poll:results:${pollId}`;
    // await redisClient.del(resultsCacheKey);

    // // 👈 3. Publish the new vote event to a Redis channel
    // const pubSubChannel = `poll-updates:${pollId}`;
    // const eventPayload = {
    //   eventType: "newVote",
    //   payload: {
    //     optionId: data.optionId,
    //     voterName: data.voterName,
    //     votedAt: vote.createdAt,
    //   },
    // };
    // await redisClient.publish(pubSubChannel, JSON.stringify(eventPayload));

    // // 👇 NEW: Publish an update to the user's dashboard channel
    // if (pollOwnerId) {
    //   const dashboardChannel = `dashboard-updates:${pollOwnerId}`;
    //   const voteCount = await prisma.vote.count({ where: { PollId: pollId } });

    //   await redisClient.publish(
    //     dashboardChannel,
    //     JSON.stringify({
    //       eventType: "voteCountUpdate",
    //       payload: {
    //         pollId: pollId,
    //         totalVotes: voteCount,
    //       },
    //     })
    //   );
    // }

    // After the transaction succeeds, handle all cache invalidations and publications
    if (pollOwnerId) {
      // 👇 CORRECT: Invalidate the user's main poll list cache
      const userPollsCacheKey = `user-polls:${pollOwnerId}`;
      const resultsCacheKey = `poll:results:${pollId}`;
      await redisClient.del([userPollsCacheKey, resultsCacheKey]);

      // Publish the new vote event to the detailed results stream
      const pubSubChannel = `poll-updates:${pollId}`;
      const eventData = {
        eventType: "newVote",
        optionId: data.optionId,
        voterName: data.voterName,
        votedAt: vote.createdAt,
      };
      await redisClient.publish(pubSubChannel, JSON.stringify(eventData));

      // Publish the vote count update to the user's dashboard stream
      const dashboardChannel = `dashboard-updates:${pollOwnerId}`;
      const voteCount = await prisma.vote.count({ where: { PollId: pollId } });

      await redisClient.publish(
        dashboardChannel,
        JSON.stringify({
          pollId: pollId,
          totalVotes: voteCount,
        })
      );
    }

    return vote;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error; // Re-throw known errors to be handled by the controller
    }
    console.error("Error during vote submission transaction:", error);
    // 👇 If the transaction fails for other reasons, it's a server-side issue.
    throw new InternalServerError("Could not submit the vote.");
  }
};

export const getPollResults = async (pollId: string) => {
  const cacheKey = `poll:results:${pollId}`;

  // Check cache first
  const cachedResults = await redisClient.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults);
  }

  // If not in cache, fetch from DB
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        include: {
          _count: {
            select: {
              votes: true,
            },
          },
          votes: {
            select: {
              voterName: true,
            },
          },
        },
      },
    },
  });

  if (!poll) {
    // 👇 Use our semantic NotFoundError
    throw new NotFoundError("Poll not found.");
  }

  const formattedOptions = poll.options.map((option) => {
    return {
      id: option.id,
      text: option.text,
      votes: option._count.votes,
      voters: option.votes.map((vote) => {
        return {
          name: vote.voterName,
        };
      }),
    };
  });

  const pollResults = {
    id: poll.id,
    title: poll.title,
    status: poll.status,
    shareCode: poll.shareCode,
    options: formattedOptions,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
    UserId: poll.UserId,
  };

  // Save to cache for 1 hour
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(pollResults));

  return pollResults;
};
