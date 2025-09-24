import { Router } from "express";
import { login, register } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.js";
import { loginBodySchema, registerBodySchema } from "./auth.types.js";
import { createRateLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

// 👈 2. Define the rate limit rules for auth endpoints
const authLimiter = createRateLimiter({
  windowInSeconds: 15 * 60, // 15 minutes
  maxRequests: 11, // Limit each IP to 10 requests per 15 minutes
});

router.post("/register", authLimiter, validate(registerBodySchema), register);
router.post("/login", authLimiter, validate(loginBodySchema), login);

export default router;
