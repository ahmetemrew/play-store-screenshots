"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  VIEWPORT_EXPORT_DIMENSIONS as deviceDimensions,
} from "@/lib/rendering/viewport-catalog";
import {
  describeCaptureExpectation as getUploadHint,
  isFlexibleViewportId as isCustomDeviceType,
  inspectInboundCapture as validateUploadedScreenshot,
} from "@/lib/intake/capture-audit";

interface ImageUploadProps {
  frameKey: string;
  onImageUpload: (imageUrl: string, fileName?: string) => void;
}

const ImageUpload = ({ frameKey, onImageUpload }: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const processFile = (selectedFile: File) => {
    setError(null);

    if (
      selectedFile.type !== "image/png" &&
      selectedFile.type !== "image/jpeg"
    ) {
      setError("Sadece PNG veya JPEG yükleyin.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();

      image.onload = () => {
        const validation = validateUploadedScreenshot({
          deviceType: frameKey,
          width: image.width,
          height: image.height,
        });

        if (!validation.isValid) {
          setError(validation.error);
          return;
        }

        if (event.target?.result) {
          setFileLabel(selectedFile.name);
          onImageUpload(event.target.result as string, selectedFile.name);
        }
      };

      image.src = event.target?.result as string;
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.[0]) {
      processFile(event.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      processFile(event.target.files[0]);
    }
  };

  const dimensions =
    deviceDimensions[frameKey as keyof typeof deviceDimensions];
  const isCustomFrame = isCustomDeviceType(frameKey);

  return (
    <div className="space-y-3">
      <div
        className={`rounded-[24px] border-2 border-dashed p-6 text-center transition ${
          dragActive
            ? "border-[#ff6b35] bg-[#fff4ee]"
            : error
            ? "border-red-300 bg-red-50"
            : "border-[rgba(17,24,39,0.12)] bg-white/60"
        }`}
        onClick={openPicker}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171412] text-white shadow-[0_14px_24px_rgba(23,20,18,0.18)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V4m0 0-4 4m4-4 4 4M5 20h14"
            />
          </svg>
        </div>

        <p className="mb-0 mt-4 text-sm font-semibold text-[#171412]">
          Görseli bırakın veya seçin
        </p>
        <p className="mb-0 mt-2 text-xs studio-muted">{getUploadHint(frameKey)}</p>
        {isCustomFrame ? (
          <p className="mb-0 mt-1 text-xs studio-muted">
            Kaynak görselde sabit boyut zorunluluğu yok.
          </p>
        ) : (
          <p className="mb-0 mt-1 text-xs studio-muted">
            Gerekli ölçü {dimensions.width} x {dimensions.height}
          </p>
        )}
      </div>

      {fileLabel && !error && (
        <div className="rounded-full border border-[rgba(17,24,39,0.08)] bg-white/70 px-4 py-2 text-xs font-medium text-[#171412]">
          {fileLabel}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
