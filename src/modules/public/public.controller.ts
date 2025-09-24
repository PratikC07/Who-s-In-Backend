import type { NextFunction } from "express";
import type { Response, Request } from "express";
import {
  findPollForVoting,
  getPollResults,
  submitVote,
} from "./public.service.js";
import { type PollParamsInput, type SubmitVoteInput } from "./public.types.js";
import eventEmitter from "../../utils/eventEmitter.js";
import { redisClient } from "../../lib/redis.js";
import { catchAsync } from "../../utils/catchAsync.js";

export const getPollForVotingHandler = catchAsync(
  async (
    req: Request & { params: PollParamsInput },
    res: Response,
    next: NextFunction
  ) => {
    const { pollId } = req.params;
    console.log("pollId", pollId);
    // The service now handles caching, the controller just calls it.
    const poll = await findPollForVoting(pollId);
    res.status(200).json({ status: "success", data: { poll } });
  }
);

export const submitVoteHandler = catchAsync(
  async (
    req: Request & {
      params: PollParamsInput;
      body: SubmitVoteInput;
    },
    res: Response,
    next: NextFunction
  ) => {
    const { pollId } = req.params;
    const { optionId, voterName } = req.body;
    const vote = await submitVote(pollId, { optionId, voterName });

    // SSE implementation
    // // ✨ Emit an event after a vote is successfully cast
    // eventEmitter.emit(`newVote:${pollId}`, {
    //   optionId,
    //   voterName,
    //   votedAt: vote.createdAt,
    // });

    // Pub-Sub implementation
    // The service now handles invalidation and publishing
    res.status(201).json({ status: "success", data: { vote } });
  }
);

export const getPollResultsHandler = catchAsync(
  async (
    req: Request & {
      params: PollParamsInput;
    },
    res: Response,
    next: NextFunction
  ) => {
    const { pollId } = req.params;
    // The service now handles caching, the controller just calls it.
    const pollResults = await getPollResults(pollId);
    res.status(200).json({ status: "success", data: { pollResults } });
  }
);

export const streamPollResultsHandler = async (
  req: Request & { params: PollParamsInput },
  res: Response
) => {
  const { pollId } = req.params;
  const pubSubChannel = `poll-updates:${pollId}`;

  // 1. Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // 2. Send the initial state
  try {
    const initialState = await getPollResults(pollId);
    res.write(`event: initialState\ndata: ${JSON.stringify(initialState)}\n\n`);
  } catch (error) {
    res.write(
      `event: error\ndata: ${JSON.stringify({
        message: "Poll not found",
      })}\n\n`
    );
    return res.end();
  }

  // SSE implementation
  // // 3. Define the function that will be called when a new vote is received
  // const voteListener = (data: any) => {
  //   res.write(`event: newVote\ndata: ${JSON.stringify(data)}\n\n`);
  // };

  // // 4. Listen for new votes
  // eventEmitter.on(`newVote:${pollId}`, voteListener);

  // // 5. Cleanup function to remove the listener when the client disconnects
  // const cleanup = () => {
  //   eventEmitter.off(`newVote:${pollId}`, voteListener);
  //   res.end();
  // };

  // // 6. Close the connection when the client disconnects
  // req.on("close", cleanup);
  // req.on("error", cleanup);

  // Pub-Sub implementation
  // 👈 3. Create a dedicated Redis client for subscribing
  const subscriber = redisClient.duplicate();
  const connectAndSubscribe = async () => {
    try {
      await subscriber.connect();
      // console.log(`[Redis] Subscriber connected for pollId: ${pollId}`);

      // Publishing the redis update message to the client
      await subscriber.subscribe(pubSubChannel, (message) => {
        const { eventType, ...data } = JSON.parse(message);
        if (eventType === "newVote") {
          res.write(`event: newVote\ndata: ${JSON.stringify(data)}\n\n`);
        } else if (eventType === "pollClosed") {
          res.write(`event: pollClosed\ndata: ${JSON.stringify(data)}\n\n`);
        }
      });
    } catch (err) {
      cleanup(); // Attempt to clean up on failure
    }
  };

  // 6. Define a SINGLE, ROBUST cleanup function
  const cleanup = () => {
    // Remove listeners to prevent memory leaks
    req.off("close", cleanup);
    req.off("error", cleanup);

    if (subscriber.isOpen) {
      subscriber.unsubscribe(pubSubChannel).then(() => {
        return subscriber.quit();
      });
    }
    res.end();
    console.log(`[SSE] Connection CLOSED for pollId: ${pollId}.`);
  };
  // 7. Attach cleanup listeners
  req.on("close", cleanup);
  req.on("error", (err) => {
    cleanup();
  });

  // Start the subscription process
  connectAndSubscribe();
};
