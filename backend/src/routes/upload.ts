import express from "express";
import { cloudinary } from "../libs/cloudinary.js";

const uploadRouter = express.Router();

uploadRouter.get("/sign-upload", (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const params = { timestamp, folder: "raw" };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!,
  );

  console.log("Signature: ", signature);

  return res.status(200).json({
    success: true,
    data: {
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
    },
  });
});

export default uploadRouter;
