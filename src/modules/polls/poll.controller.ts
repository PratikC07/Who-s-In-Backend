import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../middlewares/isAuthenticated.js";
import {
  closePoll,
  createPoll,
  findPollsByUser,
  getPollShareLink,
} from "./poll.service.js";
import type { PollParamsSchema } from "./poll.types.js";
import { redisClient } from "../../lib/redis.js";
import { catchAsync } from "../../utils/catchAsync.js";

export const createPollHandler = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const poll = await createPoll(req.body, userId);

    // Construct the full shareable URL
    const shareableUrl = `${process.env.BACKEND_BASE_URL}/s/${poll.shareCode}`;

    res
      .status(201)
      .json({ status: "success", data: { ...poll, shareableUrl } });
  }
);

export const getUserPollsHandler = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const polls = await findPollsByUser(userId);

    res.status(200).json({ status: "success", data: { polls } });
  }
);

export const closePollHandler = catchAsync(
  async (
    req: AuthRequest & { params: PollParamsSchema["params"] },
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user!.userId;
    const pollId = req.params.pollId!;
    const poll = await closePoll(pollId, userId);

    res.status(200).json({ status: "success", data: { poll } });
  }
);

export const getShareLinkHandler = catchAsync(
  async (
    req: AuthRequest & { params: PollParamsSchema["params"] },
    res: Response
  ) => {
    const { pollId } = req.params;
    const shareCode = await getPollShareLink(pollId);
    const shareableUrl = `${process.env.BACKEND_BASE_URL}/s/${shareCode}`;
    res.status(200).json({ status: "success", data: { shareableUrl } });
  }
);

export const streamUserPollsUpdates = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user!.userId;
  const pubSubChannel = `dashboard-updates:${userId}`;

  //Set headers for SSE
  res.header("Content-Type", "text/event-stream");
  res.header("Cache-Control", "no-cache");
  res.header("Connection", "keep-alive");
  res.flushHeaders();

  // Create a dedicated Redis client for subscribing
  const subscriber = redisClient.duplicate();

  try {
    await subscriber.connect();
    // Subscribe to the user-specific dashboard channel
    await subscriber.subscribe(pubSubChannel, (message) => {
      // When a message is received, write it to the client
      res.write(`event: voteCountUpdate\ndata: ${message}\n\n`);
      console.log(
        `---------------------------------[Redis] Message received: ${message}`
      );
    });
  } catch (error) {
    console.error("Error in SSE handler:", error);
    res.end(); // Close the connection on error
  }

  // Cleanup when the client disconnects
  req.on("close", () => {
    subscriber.unsubscribe(pubSubChannel);
    console.log(`[Redis] Unsubscribed from '${pubSubChannel}'`);
    subscriber.quit();
    console.log(`[Redis] Subscriber quit for userId: ${userId}`);
  });
};
