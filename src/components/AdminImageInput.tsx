"use client";

import { useState } from "react";

type AdminImageInputProps = {
  name?: string;
  initialUrl?: string;
  label?: string;
};

const TARGET_SIZE = 800;

async function resizeImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Image read failed"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE);

  const scale = Math.min(
    TARGET_SIZE / img.width,
    TARGET_SIZE / img.height
  );
  const width = img.width * scale;
  const height = img.height * scale;
  const x = (TARGET_SIZE - width) / 2;
  const y = (TARGET_SIZE - height) / 2;

  ctx.drawImage(img, x, y, width, height);
  return canvas.toDataURL("image/png");
}

export default function AdminImageInput({
  name = "imageData",
  initialUrl,
  label = "Image",
}: AdminImageInputProps) {
  const [preview, setPreview] = useState(initialUrl ?? "");
  const [imageData, setImageData] = useState("");

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setPreview(resized);
    setImageData(resized);
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
        {label}
      </label>
      <input
        className="block w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
        type="file"
        accept="image/*"
        onChange={onChange}
      />
      {preview && (
        <img
          src={preview}
          alt="Aperçu"
          className="h-24 w-24 rounded-2xl border border-black/10 object-cover"
        />
      )}
      <input type="hidden" name={name} value={imageData} />
    </div>
  );
}
