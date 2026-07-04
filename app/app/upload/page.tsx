"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowLeft, ArrowRight } from "lucide-react";
import FileUpload from "@/components/FileUpload";

const UploadPage = () => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  const uploadToBucket = async () => {
    try {
      if (!file) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/sign-upload`,
      );
      const result = await response.json();

      const { signature, timestamp, api_key, cloud_name } = result.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", "raw");

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`;

      const uploadRes = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      console.log("Upload result: ", uploadData);

      // Transcoding

      const transcodeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/transcode`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secure_url: uploadData.secure_url,
            title,
            description,
            public_id: uploadData.public_id,
          }),
        },
      );

      const transcodeResult = await transcodeResponse.json();
      console.log("Transcode result: ", transcodeResult);
    } catch (error) {
      console.log("upload error: ", error);
    }
  };

  return (
    <main>
      <div className="container mx-auto">
        <section className="mt-10">
          <Link
            href="/"
            className="font-sans text-blue-200 flex items-center gap-2"
          >
            <ArrowLeft size={14} /> View All Videos
          </Link>

          <div className="font-sans text-4xl font-semibold mt-2">
            Upload Video
          </div>
          <p className="font-sans text-gray-400">
            Publish your high quality video to the world.
          </p>
        </section>

        <div className="flex flex-col justify-center items-center">
          <div className="w-full flex items-center justify-center">
            <FileUpload file={file} setFile={setFile} />
          </div>

          <div className="mt-10 min-w-120 bg-[#191c1e] rounded-2xl border border-gray-800 p-8 space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <label className="text-gray-300">Video Title</label>
                <span className="text-gray-500">{title.length}/100</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title that describes your video"
                className="w-full bg-[#101415] border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <label className="text-gray-300">Description</label>
                <span className="text-gray-500">{description.length}/5000</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Tell viewers about your video"
                className="w-full bg-[#101415] border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              />
            </div>

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-xl shadow-blue-900/20"
              onClick={uploadToBucket}
            >
              Start Upload <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UploadPage;
