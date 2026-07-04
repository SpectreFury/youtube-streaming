"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowLeft, ArrowRight } from "lucide-react";
import FileUpload from "@/components/FileUpload";

const UploadPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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
            <FileUpload />
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

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-xl shadow-blue-900/20">
              Start Upload <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UploadPage;
