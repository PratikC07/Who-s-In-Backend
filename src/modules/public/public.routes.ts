import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { pollParamsSchema, submitSchema } from "./public.types.js";
import {
  getPollForVotingHandler,
  getPollResultsHandler,
  streamPollResultsHandler,
  submitVoteHandler,
} from "./public.controller.js";

const router = Router();

router.get(
  "/polls/:pollId",
  validate(pollParamsSchema),
  getPollForVotingHandler
);

router.post("/polls/:pollId/vote", validate(submitSchema), submitVoteHandler);

router.get(
  "/polls/:pollId/results",
  validate(pollParamsSchema),
  getPollResultsHandler
);

router.get(
  "/polls/:pollId/results/stream",
  validate(pollParamsSchema),
  streamPollResultsHandler
);

export default router;
