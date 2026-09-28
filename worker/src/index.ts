import "dotenv/config";
import { Worker } from "bullmq";
import { videoTranscoding } from "./hls/transcode.js";
import mongoose from "mongoose";

const redisHost = process.env.UPSTASH_REDIS_REST_URL!.replace(
  /^https?:\/\//,
  "",
).replace(/\/$/, "");

const connection = {
  host: redisHost,
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN!,
  tls: {},
  // Required for BullMQ v5 + Upstash (serverless Redis)
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Connect to DB before starting the worker, so Video.create() can't run unconnected.
// (Previously this only ran inside worker.on("ready"), which never fires if Redis fails.)
try {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Database connected");
} catch (error) {
  console.error("Database connection failed:", error);
  process.exit(1);
}

const worker = new Worker(
  "hls",
  async (job) => {
    console.log("==========JOB RECEIVED==========");
    console.log("Job data: ", job.data);

    // Let errors throw so BullMQ marks the job failed instead of completed.
    // (Previously the try/catch swallowed them, so failures looked successful
    // and no Video doc was ever created.)
    await videoTranscoding(
      job.data.secure_url,
      job.data.public_id,
      job.data.extension,
      job.data.title,
      job.data.description ?? ""
    );
    console.log("Job processing finished");
  },
  { connection },
);

worker.on("ready", () => {
  console.log("Worker ready");
});

worker.on("error", (error) => {
  console.error("Worker error (likely Redis connection):", error);
});

worker.on("completed", (job) => {
  console.log("Job completed");
});

worker.on("failed", (job, error) => {
  console.log("Job failed: ", error);
});
