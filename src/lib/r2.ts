"use server";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import { Readable } from "node:stream";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} env var for R2 upload.`);
  }
  return value;
};

const getR2Client = () => {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const getBucketName = (override?: string) => {
  if (override) return override;
  return getRequiredEnv("R2_BUCKET");
};

async function streamToBuffer(body: unknown) {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === "string") return Buffer.from(body);
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  if (typeof (body as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    const buffer = await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
    return Buffer.from(buffer);
  }
  return Buffer.alloc(0);
}

const parseDataUrl = (imageData: string) => {
  if (!imageData.startsWith("data:image")) return null;
  const [header, base64] = imageData.split(",", 2);
  if (!base64) return null;
  const mimeMatch = header.match(/data:(image\/[a-zA-Z0-9+.-]+);base64/);
  const contentType = mimeMatch ? mimeMatch[1] : "image/png";
  return { base64, contentType };
};

export async function uploadImageDataToR2(
  imageData: string,
  opts: { prefix: string; baseName: string }
) {
  const parsed = parseDataUrl(imageData);
  if (!parsed) return null;

  const bucket = getBucketName();
  const publicBaseUrl = getRequiredEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");

  const extension = parsed.contentType.split("/")[1] || "png";
  const safeName = slugify(opts.baseName || "image");
  const random = crypto.randomBytes(8).toString("hex");
  const key = `${opts.prefix}/${safeName}-${Date.now()}-${random}.${extension}`;

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(parsed.base64, "base64"),
      ContentType: parsed.contentType,
    })
  );

  return `${publicBaseUrl}/${key}`;
}

export async function uploadBufferToR2(opts: {
  key: string;
  body: Buffer;
  contentType: string;
  bucket?: string;
}) {
  const client = getR2Client();
  const bucket = getBucketName(opts.bucket);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
    })
  );
  return opts.key;
}

export async function downloadBufferFromR2(opts: { key: string; bucket?: string }) {
  const client = getR2Client();
  const bucket = getBucketName(opts.bucket);
  const result = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: opts.key,
    })
  );
  return streamToBuffer(result.Body);
}

export async function getSignedUrlForKey(opts: {
  key: string;
  expiresInSeconds?: number;
  bucket?: string;
}) {
  const client = getR2Client();
  const bucket = getBucketName(opts.bucket);
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: opts.key,
  });
  return getSignedUrl(client, command, {
    expiresIn: opts.expiresInSeconds ?? 3600,
  });
}
