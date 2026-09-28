import ffmpeg from "fluent-ffmpeg";
import { writeFile, mkdir, readdir, rm } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { fileURLToPath } from "url";
import { cloudinary } from "../libs/cloudinary.js";
import { Video } from "../models/video.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadFileToDisk = async (url: string, outputPath: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
  }

  if (!url) {
    throw new Error("downloadFileToDisk: empty secure_url");
  }

  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });

  const downloadStream = Readable.fromWeb(response.body as any);
  await writeFile(outputPath, downloadStream);

  console.log(`Saved video to ${outputPath}`);
};

const ffmpegTransformations = async (
  savePath: string,
  filename: string,
  rootDir: string,
  title: string,
  description: string = "",
) => {
  try {
    const outputPath = path.join(rootDir, `transformed/${filename}`);
    await mkdir(outputPath, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(savePath)
        .screenshots({
          count: 1,
          timemarks: ["00:00:02"],
          filename: `${filename}-thumbnail.jpg`,
          folder: outputPath,
          size: "1280x720",
        })
        .on("end", () => {
          console.log("Thumbnail generated");
          resolve();
        })
        .on("error", () => {
          console.log("Thumbnail generation resulted in error");
          reject();
        });
    });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(savePath)
        .videoCodec("libx264")
        .outputOptions(["-crf 21", "-preset fast"])

        .audioCodec("aac")
        .audioBitrate("128k")

        .format("hls")
        .outputOptions([
          "-hls_time 6",
          "-hls_playlist_type vod",
          `-hls_segment_filename ${path.join(outputPath, "segment_%03d.ts")}`,
        ])

        .output(path.join(outputPath, `${filename}.m3u8`))
        .on("end", () => {
          console.log("HLS conversion completed successfully");
          resolve();
        })
        .on("error", (error) => {
          console.log("HLS conversion failed: ", error);
          reject();
        })
        .on("progress", (progress) => {
          console.log("Processing: ", progress.percent);
        })

        .run();
    });

    const files = await readdir(outputPath);
    console.log("Files: ", files);

    const uploadPromises = files.map(async (file) => {
      const filePath = path.join(outputPath, file);

      const isThumbnail = file.endsWith(".jpg") || file.endsWith(".png");
      const resourceType = isThumbnail ? "image" : "raw";

      const cloudinaryFolder = `transformed/${filename}`;

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: cloudinaryFolder,
        use_filename: true,
        unique_filename: false,
        resource_type: resourceType,
      });

      return uploadResult;
    });

    const uploadResults = await Promise.all(uploadPromises);
    console.log("All files successfully uploaded to Cloudinary");

    const playlistUrl = uploadResults.find((res) =>
      res.secure_url.endsWith(".m3u8"),
    )?.secure_url;

    const thumbnailUrl = uploadResults.find((res) =>
      res.secure_url.endsWith(".jpg"),
    )?.secure_url;

    console.log("Playlist URL: ", playlistUrl);
    console.log("Thumbnail URL: ", thumbnailUrl);

    if (!playlistUrl) {
      throw new Error(
        `Playlist (.m3u8) URL not found in Cloudinary results: ${JSON.stringify(uploadResults.map((r) => r.secure_url))}`,
      );
    }

    await rm(outputPath, { recursive: true, force: true });
    await rm(savePath, { force: true });

    console.log("Cleaned up raw and hls files");

    const video = await Video.create({
      name: title,
      description,
      hlsUrl: playlistUrl,
      thumbnailUrl,
      status: "READY",
    });

    console.log("Saved video to database:", video._id);
  } catch (error) {
    console.error("Error in transformation of video: ", error);
    throw error;
  }
};

const videoTranscoding = async (
  secure_url: string,
  public_id: string,
  extension: string,
  title: string,
  description: string = "",
) => {
  // public_id is like "raw/my-video-abc123" — take the last segment so it
  // still works if Cloudinary ever returns no folder prefix.
  const filename = public_id.split("/").pop()!;
  if (!filename) {
    throw new Error(`Invalid public_id: ${public_id}`);
  }
  if (!secure_url) {
    throw new Error("Missing secure_url from upload");
  }
  if (!title?.trim()) {
    throw new Error("Missing title — Video.name is required, refusing to save");
  }
  const rootDir = path.join(__dirname, "../../");

  const savePath = path.join(
    rootDir,
    "downloaded/",
    `${filename}.${extension}`,
  );

  await downloadFileToDisk(secure_url, savePath);
  await ffmpegTransformations(savePath, filename, rootDir, title, description);

  console.log(public_id);
  const result = await cloudinary.uploader.destroy(public_id, {
    resource_type: "video",
  });
  console.log("Deleted result: ", result);
};

export { videoTranscoding };
