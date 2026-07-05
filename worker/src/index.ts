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
    console.log("==========JOB RECEIVED==========");
    console.log("Job data: ", job.data);


  },
  { connection },
);

worker.on("ready", () => {
  console.log("Worker ready");
});

worker.on("completed", (job) => {
  console.log("Job completed")
});

worker.on("failed", (job, error) => {
  console.log("Job failed: ", error);
});
