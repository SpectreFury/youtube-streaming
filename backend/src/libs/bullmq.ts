import "dotenv/config";
import { Queue } from "bullmq";

const redisHost = process.env.UPSTASH_REDIS_REST_URL!.replace(
  /^https?:\/\//,
  "",
).replace(/\/$/, "");

const queue = new Queue("hls", {
  connection: {
    host: redisHost,
    port: 6379,
    password: process.env.UPSTASH_REDIS_REST_TOKEN!,
    tls: {},
    // Required for BullMQ v5 + Upstash (serverless Redis)
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
});

export { queue };
