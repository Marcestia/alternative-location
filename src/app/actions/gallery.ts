"use server";

import crypto from "node:crypto";
import path from "node:path";
import { GalleryMediaType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { uploadBufferToR2, uploadImageDataToR2 } from "@/lib/r2";
import { redirect } from "next/navigation";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const getText = (value: FormDataEntryValue | null) => String(value || "").trim();

const getSortOrder = (value: FormDataEntryValue | null) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getActive = (value: FormDataEntryValue | null) => String(value || "") === "on";

const getGalleryType = (value: FormDataEntryValue | null) =>
  String(value || "").toUpperCase() === GalleryMediaType.VIDEO
    ? GalleryMediaType.VIDEO
    : GalleryMediaType.IMAGE;

const getPublicBaseUrl = () => {
  const value = process.env.R2_PUBLIC_BASE_URL;
  if (!value) {
    throw new Error("Missing R2_PUBLIC_BASE_URL env var.");
  }
  return value.replace(/\/+$/, "");
};

const buildPublicUrl = (key: string) => `${getPublicBaseUrl()}/${key}`;

async function saveImageData(imageData: string, baseName: string) {
  return uploadImageDataToR2(imageData, {
    prefix: "gallery",
    baseName,
  });
}

async function saveSectionImageData(imageData: string, baseName: string) {
  return uploadImageDataToR2(imageData, {
    prefix: "gallery-sections",
    baseName,
  });
}

async function saveVideoFile(file: File, baseName: string) {
  if (!file || file.size === 0) return null;

  const extension =
    path.extname(file.name || "").toLowerCase() ||
    (file.type === "video/webm"
      ? ".webm"
      : file.type === "video/quicktime"
        ? ".mov"
        : ".mp4");

  const key = `gallery/${slugify(baseName || "video")}-${Date.now()}-${crypto
    .randomBytes(8)
    .toString("hex")}${extension}`;

  const body = Buffer.from(await file.arrayBuffer());
  await uploadBufferToR2({
    key,
    body,
    contentType: file.type || "video/mp4",
  });

  return buildPublicUrl(key);
}

async function resolveMediaUrls(
  formData: FormData,
  title: string,
  existing?: {
    type: GalleryMediaType;
    mediaUrl: string;
    posterUrl: string | null;
  }
) {
  const type = getGalleryType(formData.get("type"));
  const imageData = getText(formData.get("imageData"));
  const posterData = getText(formData.get("posterData"));
  const videoUrl = getText(formData.get("videoUrl"));
  const videoFile = formData.get("videoFile");

  const savedPosterUrl = posterData
    ? await saveImageData(posterData, `${title || "gallery"}-poster`)
    : existing?.posterUrl || null;

  if (type === GalleryMediaType.IMAGE) {
    const savedImageUrl = imageData
      ? await saveImageData(imageData, title || "gallery")
      : existing?.type === GalleryMediaType.IMAGE
        ? existing.mediaUrl
        : null;

    return {
      type,
      mediaUrl: savedImageUrl,
      posterUrl: null,
    };
  }

  const uploadedVideoUrl =
    videoFile instanceof File ? await saveVideoFile(videoFile, title || "gallery-video") : null;
  const savedVideoUrl =
    uploadedVideoUrl ||
    videoUrl ||
    (existing?.type === GalleryMediaType.VIDEO ? existing.mediaUrl : null);

  return {
    type,
    mediaUrl: savedVideoUrl,
    posterUrl: savedPosterUrl,
  };
}

export async function addGalleryMedia(formData: FormData) {
  const title = getText(formData.get("title"));
  const subtitle = getText(formData.get("subtitle"));
  const active = getActive(formData.get("active"));
  const sortOrder = getSortOrder(formData.get("sortOrder"));
  const sectionId = getText(formData.get("sectionId")) || null;

  if (!title) {
    redirect("/admin/parametres?gallery=0");
  }

  const resolved = await resolveMediaUrls(formData, title);

  if (!resolved.mediaUrl) {
    redirect("/admin/parametres?gallery=missing");
  }

  await prisma.galleryMedia.create({
    data: {
      title,
      subtitle: subtitle || null,
      type: resolved.type,
      mediaUrl: resolved.mediaUrl,
      posterUrl: resolved.posterUrl,
      active,
      sortOrder,
      sectionId,
    },
  });

  redirect("/admin/parametres?gallery=1");
}

export async function updateGalleryMedia(formData: FormData) {
  const id = getText(formData.get("id"));
  const title = getText(formData.get("title"));
  const subtitle = getText(formData.get("subtitle"));
  const active = getActive(formData.get("active"));
  const sortOrder = getSortOrder(formData.get("sortOrder"));
  const sectionId = getText(formData.get("sectionId")) || null;

  if (!id || !title) {
    redirect("/admin/parametres?gallery=0");
  }

  const existing = await prisma.galleryMedia.findUnique({
    where: { id },
    select: {
      type: true,
      mediaUrl: true,
      posterUrl: true,
    },
  });

  if (!existing) {
    redirect("/admin/parametres?gallery=0");
  }

  const resolved = await resolveMediaUrls(formData, title, existing);

  if (!resolved.mediaUrl) {
    redirect("/admin/parametres?gallery=missing");
  }

  await prisma.galleryMedia.update({
    where: { id },
    data: {
      title,
      subtitle: subtitle || null,
      type: resolved.type,
      mediaUrl: resolved.mediaUrl,
      posterUrl: resolved.posterUrl,
      active,
      sortOrder,
      sectionId,
    },
  });

  redirect("/admin/parametres?gallery=1");
}

export async function deleteGalleryMedia(formData: FormData) {
  const id = getText(formData.get("id"));

  if (!id) {
    redirect("/admin/parametres?gallery=0");
  }

  await prisma.galleryMedia.delete({
    where: { id },
  });

  redirect("/admin/parametres?gallery=deleted");
}

export async function addGallerySection(formData: FormData) {
  const name = getText(formData.get("name"));
  const description = getText(formData.get("description"));
  const active = getActive(formData.get("active"));
  const sortOrder = getSortOrder(formData.get("sortOrder"));
  const imageData = getText(formData.get("coverImageData"));

  if (!name) {
    redirect("/admin/parametres?gallerySection=0");
  }

  const coverImageUrl = imageData
    ? await saveSectionImageData(imageData, name)
    : null;

  await prisma.gallerySection.create({
    data: {
      name,
      description: description || null,
      coverImageUrl,
      active,
      sortOrder,
    },
  });

  redirect("/admin/parametres?gallerySection=1");
}

export async function updateGallerySection(formData: FormData) {
  const id = getText(formData.get("id"));
  const name = getText(formData.get("name"));
  const description = getText(formData.get("description"));
  const active = getActive(formData.get("active"));
  const sortOrder = getSortOrder(formData.get("sortOrder"));
  const imageData = getText(formData.get("coverImageData"));
  const currentCoverImageUrl = getText(formData.get("coverImageUrl"));
  const clearCoverImage = getActive(formData.get("clearCoverImage"));

  if (!id || !name) {
    redirect("/admin/parametres?gallerySection=0");
  }

  const coverImageUrl = clearCoverImage
    ? null
    : imageData
      ? await saveSectionImageData(imageData, name)
      : currentCoverImageUrl || null;

  await prisma.gallerySection.update({
    where: { id },
    data: {
      name,
      description: description || null,
      coverImageUrl,
      active,
      sortOrder,
    },
  });

  redirect("/admin/parametres?gallerySection=1");
}

export async function deleteGallerySection(formData: FormData) {
  const id = getText(formData.get("id"));

  if (!id) {
    redirect("/admin/parametres?gallerySection=0");
  }

  await prisma.galleryMedia.updateMany({
    where: { sectionId: id },
    data: { sectionId: null },
  });

  await prisma.gallerySection.delete({
    where: { id },
  });

  redirect("/admin/parametres?gallerySection=deleted");
}
