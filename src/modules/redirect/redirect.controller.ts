import type { Request, Response } from "express";
import { findPollByShareCode } from "./redirect.service.js";
import { type RedirectParamsInput } from "./redirect.types.js";
import { redisClient } from "../../lib/redis.js";
import { catchAsync } from "../../utils/catchAsync.js";

// Note: For the frontend URLs, we will use another environment variable.
// This is better than hardcoding them.

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const FRONTEND_VOTE_URL = `${FRONTEND_BASE_URL}/vote`;
const FRONTEND_RESULTS_URL = `${FRONTEND_BASE_URL}/poll-result-closed`;

export const handleRedirect = catchAsync(
  async (req: Request & { params: RedirectParamsInput }, res: Response) => {
    const { shareCode } = req.params;
    const cacheKey = `redirect:${shareCode}`;

    // 👈 2. Check the cache first
    const cachedData = await redisClient.get(cacheKey);

    let poll: { id: string; status: string };

    if (cachedData) {
      poll = JSON.parse(cachedData);
    } else {
      // If not in cache, fetch from DB
      poll = await findPollByShareCode(shareCode);

      // 👈 3. Save the result to cache for 1 hour
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(poll));
    }

    let destinationUrl: string;

    if (poll.status === "active") {
      destinationUrl = `${FRONTEND_VOTE_URL}/${poll.id}`;
    } else {
      // Assumes any other status (e.g., 'closed') goes to results
      destinationUrl = `${FRONTEND_RESULTS_URL}/${poll.id}`;
    }

    res.redirect(302, destinationUrl);
  }
);
