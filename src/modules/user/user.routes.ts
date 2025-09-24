import { isAuthenticated } from "../../middlewares/isAuthenticated.js";
import { getMyProfile, updateMyProfile } from "./user.controller.js";
import { Router } from "express";
import { updateUserBodySchema } from "./user.types.js";
import { validate } from "../../middlewares/validate.js";
import upload from "../../middlewares/upload.js";

const router = Router();

router.get("/profile", isAuthenticated, getMyProfile);
router.put(
  "/profile",
  isAuthenticated,
  upload.single("profilePicture"),
  validate(updateUserBodySchema),
  updateMyProfile
);

export default router;
