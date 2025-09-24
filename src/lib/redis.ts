import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis Client Connected");
  } catch (error) {
    console.log("Redis Client Error", error);
    process.exit(1);
  }
};

export { connectRedis, redisClient };
