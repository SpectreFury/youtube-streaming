import "dotenv/config";
import express from "express";
import mongoose from 'mongoose'

import cors from "cors";

import uploadRouter from "./routes/upload.js";
import watchRouter from "./routes/watch.js";

const app = express();

mongoose.connect(process.env.MONGODB_URI!)

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;

app.use("/api/upload", uploadRouter);
app.use("/api/watch", watchRouter);

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
