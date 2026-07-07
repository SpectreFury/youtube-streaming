import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hlsUrl: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "READY", "FAILED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  },
);

export const Video =
  mongoose.models.Video || mongoose.model("Video", VideoSchema);

