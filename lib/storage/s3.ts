import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env, features } from "@/lib/env";

/**
 * S3-compatible object storage: Cloudflare R2 in the cloud, MinIO in local Docker.
 * Objects are private; the app serves them through /media/* so access can be checked.
 */
let client: S3Client | undefined;

function s3(): S3Client {
  if (!features.storage()) throw new Error("Object storage is not configured");
  client ??= new S3Client({
    region: env().S3_REGION,
    endpoint: env().S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env().S3_ACCESS_KEY_ID!,
      secretAccessKey: env().S3_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  await s3().send(
    new PutObjectCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function getObject(key: string) {
  const res = await s3().send(new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
  return { body: res.Body, contentType: res.ContentType, contentLength: res.ContentLength };
}

export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
}
