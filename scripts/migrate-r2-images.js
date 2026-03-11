const fs = require("node:fs/promises");
const path = require("node:path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const ITEMS_DIR = path.join(PUBLIC_DIR, "items");
const REVIEWS_DIR = path.join(PUBLIC_DIR, "reviews");
const SPOTLIGHT_DIR = path.join(PUBLIC_DIR, "spotlight");

const loadEnv = async () => {
  const envPath = path.join(ROOT, ".env");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (value.startsWith("\"") && value.endsWith("\"")) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {
    // ignore if .env missing
  }
};

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} env var.`);
  }
  return value;
};

const getClient = () => {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
};

const getPublicBaseUrl = () =>
  requireEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");

const uploadFile = async (client, bucket, key, filePath) => {
  const body = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : "application/octet-stream";

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
};

const ensureExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const migrateItemImages = async (client, bucket, publicBaseUrl) => {
  const images = await prisma.itemImage.findMany();
  let migrated = 0;
  for (const image of images) {
    if (!image.url || !image.url.startsWith("/items/")) continue;
    const fileName = image.url.replace("/items/", "");
    const filePath = path.join(ITEMS_DIR, fileName);
    if (!(await ensureExists(filePath))) continue;
    const key = `items/${fileName}`;
    await uploadFile(client, bucket, key, filePath);
    await prisma.itemImage.update({
      where: { id: image.id },
      data: { url: `${publicBaseUrl}/${key}` },
    });
    migrated += 1;
  }
  return migrated;
};

const migrateReviewImages = async (client, bucket, publicBaseUrl) => {
  const images = await prisma.reviewImage.findMany();
  let migrated = 0;
  for (const image of images) {
    if (!image.url || !image.url.startsWith("/reviews/")) continue;
    const fileName = image.url.replace("/reviews/", "");
    const filePath = path.join(REVIEWS_DIR, fileName);
    if (!(await ensureExists(filePath))) continue;
    const key = `reviews/${fileName}`;
    await uploadFile(client, bucket, key, filePath);
    await prisma.reviewImage.update({
      where: { id: image.id },
      data: { url: `${publicBaseUrl}/${key}` },
    });
    migrated += 1;
  }
  return migrated;
};

const migrateSpotlights = async (client, bucket, publicBaseUrl) => {
  const spotlights = await prisma.spotlight.findMany();
  let migrated = 0;
  for (const spotlight of spotlights) {
    if (!spotlight.imageUrl || !spotlight.imageUrl.startsWith("/spotlight/")) {
      continue;
    }
    const fileName = spotlight.imageUrl.replace("/spotlight/", "");
    const filePath = path.join(SPOTLIGHT_DIR, fileName);
    if (!(await ensureExists(filePath))) continue;
    const key = `spotlight/${fileName}`;
    await uploadFile(client, bucket, key, filePath);
    await prisma.spotlight.update({
      where: { id: spotlight.id },
      data: { imageUrl: `${publicBaseUrl}/${key}` },
    });
    migrated += 1;
  }
  return migrated;
};

async function main() {
  await loadEnv();
  const bucket = requireEnv("R2_BUCKET");
  const publicBaseUrl = getPublicBaseUrl();
  const client = getClient();

  const [items, reviews, spotlights] = await Promise.all([
    migrateItemImages(client, bucket, publicBaseUrl),
    migrateReviewImages(client, bucket, publicBaseUrl),
    migrateSpotlights(client, bucket, publicBaseUrl),
  ]);

  console.log("R2 migration complete.");
  console.log(`- items: ${items}`);
  console.log(`- reviews: ${reviews}`);
  console.log(`- spotlights: ${spotlights}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
