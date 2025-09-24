import { Router } from "express";
import { handleRedirect } from "./redirect.controller.js";
import { validate } from "../../middlewares/validate.js";
import { redirectParamsSchema } from "./redirect.types.js";

const router = Router();

router.get("/:shareCode", validate(redirectParamsSchema), handleRedirect);

export default router;
