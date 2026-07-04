import "dotenv/config";
import { Queue } from "bullmq";

const queue = new Queue("hls", {
  connection: {
    host: process.env.UPSTASH_REDIS_REST_URL!,
    port: 6379,
    password: process.env.UPSTASH_REDIS_REST_TOKEN!,
    tls: {},
  },
});

export { queue };
