import "dotenv/config";
import { Worker } from "bullmq";
import { videoTranscoding } from "./hls/transcode.js";

const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL!,
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN!,
  tls: {},
};

const worker = new Worker(
  "hls",
  async (job) => {
    try {
      console.log("==========JOB RECEIVED==========");
      console.log("Job data: ", job.data);

      await videoTranscoding(
        job.data.secure_url,
        job.data.public_id,
        job.data.extension,
      );
    } catch (error) {
      console.log("Job failed: ", error);
    }
  },
  { connection },
);

worker.on("ready", () => {
  console.log("Worker ready");
});

worker.on("completed", (job) => {
  console.log("Job completed");
});

worker.on("failed", (job, error) => {
  console.log("Job failed: ", error);
});
