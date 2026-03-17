"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site";
import { uploadImageDataToR2 } from "@/lib/r2";

const parseEuroToCents = (value: FormDataEntryValue | null) => {
  const raw = String(value || "").trim().replace(",", ".");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
};

async function saveImageData(imageData: string, baseName: string, prefix: string) {
  return uploadImageDataToR2(imageData, { prefix, baseName });
}

export async function addItem(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const totalQty = Number(formData.get("totalQty") || 0);
  const rentalPriceCents = parseEuroToCents(formData.get("rentalPriceCents"));
  const depositPriceCents = parseEuroToCents(formData.get("depositPriceCents"));
  const imageDataList = formData
    .getAll("imageData")
    .map((value) => String(value || "").trim())
    .filter((value) => value.length > 0);
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (!name) {
    redirect("/admin/stock?saved=0");
  }

  const savedImages = (
    await Promise.all(
      imageDataList.map((data) => saveImageData(data, name, "items"))
    )
  ).filter((value): value is string => Boolean(value));

  await prisma.item.create({
    data: {
      name,
      totalQty: Number.isFinite(totalQty) ? totalQty : 0,
      rentalPriceCents,
      depositPriceCents,
      categoryId: categoryId || null,
      images: savedImages.length > 0
        ? {
            create: savedImages.map((url, index) => ({
              url,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });

  redirect("/admin/stock?saved=1");
}

export async function updateItem(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const totalQty = Number(formData.get("totalQty") || 0);
  const rentalPriceCents = parseEuroToCents(formData.get("rentalPriceCents"));
  const depositPriceCents = parseEuroToCents(formData.get("depositPriceCents"));
  const imageDataList = formData
    .getAll("imageData")
    .map((value) => String(value || "").trim())
    .filter((value) => value.length > 0);
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (!id || !name) {
    redirect("/admin/stock");
  }

  const savedImages = (
    await Promise.all(
      imageDataList.map((data) => saveImageData(data, name, "items"))
    )
  ).filter((value): value is string => Boolean(value));

  await prisma.item.update({
    where: { id },
    data: {
      name,
      totalQty: Number.isFinite(totalQty) ? totalQty : 0,
      rentalPriceCents,
      depositPriceCents,
      categoryId: categoryId || null,
    },
  });

  if (savedImages.length > 0) {
    const existingCount = await prisma.itemImage.count({ where: { itemId: id } });
    await prisma.itemImage.createMany({
      data: savedImages.map((url, index) => ({
        itemId: id,
        url,
        sortOrder: existingCount + index,
      })),
    });
  }

  redirect("/admin/stock");
}

export async function deleteItem(formData: FormData) {
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/stock");
  }

  const [reservationCount, quoteCount] = await Promise.all([
    prisma.reservationItem.count({ where: { itemId: id } }),
    prisma.quoteItem.count({ where: { itemId: id } }),
  ]);

  if (reservationCount > 0 || quoteCount > 0) {
    await prisma.item.update({ where: { id }, data: { active: false } });
    redirect("/admin/stock?saved=linked");
  }

  await prisma.itemImage.deleteMany({ where: { itemId: id } });
  await prisma.item.delete({ where: { id } });

  redirect("/admin/stock");
}

export async function updateCategory(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const heroTitle = String(formData.get("heroTitle") || "").trim();
  const heroImageUrl = String(formData.get("heroImageUrl") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!id || !name) {
    redirect("/admin/parametres");
  }

  await prisma.itemCategory.update({
    where: { id },
    data: {
      name,
      description: description || null,
      heroTitle: heroTitle || null,
      heroImageUrl: heroImageUrl || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  redirect("/admin/parametres");
}

export async function addSpotlight(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const imageData = String(formData.get("imageData") || "").trim();
  const active = String(formData.get("active") || "") === "on";
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!title) {
    redirect("/admin/parametres");
  }

  const savedImageUrl = imageData
    ? await saveImageData(imageData, title || "spotlight", "spotlight")
    : imageUrl || null;

  await prisma.spotlight.create({
    data: {
      title,
      description: description || null,
      imageUrl: savedImageUrl,
      active,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  redirect("/admin/parametres");
}

export async function updateSpotlight(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const imageData = String(formData.get("imageData") || "").trim();
  const active = String(formData.get("active") || "") === "on";
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!id || !title) {
    redirect("/admin/parametres");
  }

  const savedImageUrl = imageData
    ? await saveImageData(imageData, title || "spotlight", "spotlight")
    : imageUrl || null;

  await prisma.spotlight.update({
    where: { id },
    data: {
      title,
      description: description || null,
      imageUrl: savedImageUrl,
      active,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  redirect("/admin/parametres");
}

export async function deleteSpotlight(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/parametres");
  }
  await prisma.spotlight.delete({ where: { id } });
  redirect("/admin/parametres");
}
