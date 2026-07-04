import "dotenv/config";
import { Worker } from "bullmq";

const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL!,
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN!,
  tls: {},
};

const worker = new Worker(
  "hls",
  async (job) => {
    console.log("New job: ", job);

    return job;
  },
  { connection },
);

worker.on("ready", () => {
  console.log("Worker ready");
});

worker.on("completed", (job) => {
  console.log("Job completed: ", job);
});

worker.on("failed", (job) => {
  console.log("Job failed: ", job);
});
