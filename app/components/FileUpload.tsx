"use client";

import React, { useState, useRef } from "react";
import { Cloud, CheckCircle } from "lucide-react";

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full border-gray-600 border-2 border-dashed border-spacing-2 rounded max-w-120 flex flex-col items-center p-10">
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={(e) => {
          console.log(e.target.files);
          const file = e.target.files?.[0];
          setFile(file || null);
        }}
      />

      {file ? (
        <div className="w-20 h-20 bg-gray-800 flex justify-center items-center rounded-full">
          <CheckCircle className="text-green-400" size={40} />
        </div>
      ) : (
        <div className="w-20 h-20 bg-gray-800 flex justify-center items-center rounded-full">
          <Cloud className="" size={40} />
        </div>
      )}

      {file && (
        <p className="mt-2 font-sans text-2xl font-medium">Ready to upload</p>
      )}

      {file ? (
        <p className="mt-2 font-sans text-md font-normal text-gray-400">
          {file.name}
        </p>
      ) : (
        <p className="mt-2 font-sans text-2xl font-medium">
          Upload Your Videos
        </p>
      )}

      {file ? (
        <button
          className="font-sans underline cursor-pointer mt-2"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.value = "";
              setFile(null);
            }
          }}
        >
          Remove file
        </button>
      ) : (
        <button
          className="mt-2 font-sans px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 cursor-pointer flex items-center gap-2"
          onClick={() => inputRef.current?.click()}
        >
          Select files
        </button>
      )}
    </div>
  );
};

export default FileUpload;
