import { Router } from "express";
import authRouter from "./modules/auth/auth.route.js";
import userRouter from "./modules/user/user.routes.js";
import pollRouter from "./modules/polls/poll.routes.js";
import publicRouter from "./modules/public/public.routes.js";
// Import other routers as you create them

const router = Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/polls", pollRouter);
router.use("/public", publicRouter);

export default router;
