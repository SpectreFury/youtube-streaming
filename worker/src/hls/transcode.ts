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
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch video");
    }

    const dir = path.dirname(outputPath);
    await mkdir(dir, { recursive: true });

    const downloadStream = Readable.fromWeb(response.body as any);
    await writeFile(outputPath, downloadStream);

    console.log(`Saved video to ${outputPath}`);
  } catch (error) {
    console.log("Error saving video: ", error);
  }
};

const ffmpegTransformations = async (
  savePath: string,
  filename: string,
  rootDir: string,
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

    await rm(outputPath, { recursive: true, force: true });
    await rm(savePath, { force: true });

    console.log("Cleaned up raw and hls files");

    await Video.create({
      name: filename,
      hlsUrl: playlistUrl,
      thumbnailUrl,
      status: "READY",
    });
  } catch (error) {
    console.log("Error in transformation of video: ", error);
  }
};

const videoTranscoding = async (
  secure_url: string,
  public_id: string,
  extension: string,
) => {
  const filename = public_id.split("/")[1]!;
  const rootDir = path.join(__dirname, "../../");

  const savePath = path.join(
    rootDir,
    "downloaded/",
    `${filename}.${extension}`,
  );

  await downloadFileToDisk(secure_url, savePath);
  await ffmpegTransformations(savePath, filename, rootDir);
};

export { videoTranscoding };
