import express from "express";
import { Video } from "../models/video.js";

const watchRouter = express.Router();

watchRouter.get("/:videoId", async (req, res) => {
  try {
    const videoId = req.params.videoId;

    if (!videoId) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const video = await Video.findById(videoId);

    return res.status(200).json({ success: true, data: video });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
});

watchRouter.get("/", async (req, res) => {
  try {
    const videos = await Video.find();

    return res.status(200).json({ success: true, data: videos });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
});

export default watchRouter;
