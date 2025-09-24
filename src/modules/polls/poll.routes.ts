import { Router } from "express";
import {
  isAuthenticated,
  isAuthenticatedByQuery,
} from "../../middlewares/isAuthenticated.js";
import {
  createPollBodySchema,
  pollParamsSchema,
  pollQuerySchema,
} from "./poll.types.js";
import {
  closePollHandler,
  createPollHandler,
  getShareLinkHandler,
  getUserPollsHandler,
  streamUserPollsUpdates,
} from "./poll.controller.js";
import { validate } from "../../middlewares/validate.js";

const router = Router();

router.get(
  "/:pollId/share-link",
  validate(pollParamsSchema),
  getShareLinkHandler
);

// 👇 Add the new streaming route
router.get(
  "/updates",
  validate(pollQuerySchema),
  isAuthenticatedByQuery,
  streamUserPollsUpdates
);

// Protect all routes in this file
router.use(isAuthenticated);

router.post("/", validate(createPollBodySchema), createPollHandler);
router.get("/", getUserPollsHandler);
router.put("/:pollId/close", validate(pollParamsSchema), closePollHandler);

export default router;
