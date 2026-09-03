import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { env } from "./env";

const s3 = new S3Client({
  region: env.s3.region,
  endpoint: env.s3.endpoint,
  credentials: {
    accessKeyId: env.s3.accessKey,
    secretAccessKey: env.s3.secretKey,
  },
  forcePathStyle: true,
});

let initPromise: Promise<void> | null = null;

export async function ensureBucketExists(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: env.s3.bucket }));
    } catch (err: unknown) {
      const notFound =
        err instanceof Error &&
        (err.name === "NotFound" ||
          err.message?.includes("NoSuchBucket") ||
          err.message?.includes("does not exist"));
      if (!notFound) {
        console.warn("[s3] HeadBucket failed, will attempt to create bucket:", err);
      }

      try {
        await s3.send(
          new CreateBucketCommand({
            Bucket: env.s3.bucket,
          }),
        );
        console.log(`[s3] Created bucket: ${env.s3.bucket}`);
      } catch (createErr: unknown) {
        if (createErr instanceof Error && createErr.name === "BucketAlreadyExists") {
          // continue to apply policy
        } else {
          console.error("[s3] Failed to create bucket:", createErr);
          throw createErr;
        }
      }
    }

    // Ensure public read access so uploaded images can be served directly.
    try {
      await s3.send(
        new PutBucketPolicyCommand({
          Bucket: env.s3.bucket,
          Policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "PublicReadGetObject",
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource: `arn:aws:s3:::${env.s3.bucket}/*`,
              },
            ],
          }),
        }),
      );
    } catch (policyErr: unknown) {
      console.error("[s3] Failed to set bucket policy:", policyErr);
      throw policyErr;
    }
  })();
  return initPromise;
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await ensureBucketExists();
  await s3.send(
    new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  const publicUrl = env.s3.publicUrl.replace(/\/$/, "");
  return `${publicUrl}/${env.s3.bucket}/${key}`;
}

export function getPublicUrl(key: string): string {
  const publicUrl = env.s3.publicUrl.replace(/\/$/, "");
  return `${publicUrl}/${env.s3.bucket}/${key}`;
}
