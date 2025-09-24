import express from "express";
import apiRouter from "./api.js";
import redirectRouter from "./modules/redirect/redirect.route.js";
import { connectRedis } from "./lib/redis.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cors from "cors";

const startServer = async () => {
  await connectRedis(); // 👈 2. Connect to Redis

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(
    cors({
      origin: process.env.FRONTEND_BASE_URL,
      credentials: true,
    })
  );

  // Main health check
  app.get("/api/healthcheck", (req, res) => {
    res.json({ message: "API is running." });
  });

  // Mount the main API router
  app.use("/api", apiRouter);

  // ✨ Mount the redirect router at the root level
  app.use("/s", redirectRouter);

  // ✨ Mount the error handler as the last middleware
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer(); // 👈 3. Call the async function to start the server
