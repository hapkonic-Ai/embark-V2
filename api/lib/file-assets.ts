import { eq } from "drizzle-orm";
import { fileAssets, type FileAsset } from "@db/schema";
import { getDb, type DbClient } from "../queries/connection";

export const ACCEPTED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const DATA_URL_RE = /^data:([a-zA-Z0-9/+.=-]+);base64,([A-Za-z0-9+/=]+)$/;
const ASSET_REF_RE = /^asset:(\d+)$/;

export function isDataUrl(value: string): boolean {
  return DATA_URL_RE.test(value);
}

export function parseDataUrl(value: string): { mimeType: string; base64: string } | null {
  const match = DATA_URL_RE.exec(value);
  if (!match) return null;
  return { mimeType: match[1]!, base64: match[2]! };
}

export function isAssetRef(value: string): boolean {
  return ASSET_REF_RE.test(value);
}

export function assetRef(id: number): string {
  return `asset:${id}`;
}

export function parseAssetRef(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = ASSET_REF_RE.exec(value);
  return match ? Number(match[1]) : null;
}

export function buildDataUrl(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

interface SaveOptions {
  mimeTypes?: string[];
  maxBytes?: number;
  fileName?: string;
  db?: DbClient;
}

export function approxBase64Bytes(base64: string): number {
  return Math.floor(base64.length * 0.75);
}

export async function saveBase64Asset(
  ownerId: number,
  dataUrlOrBase64: string,
  options: SaveOptions = {},
): Promise<FileAsset> {
  const db = options.db ?? getDb();
  const mimeTypes = options.mimeTypes ?? ACCEPTED_IMAGE_MIMES;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_IMAGE_BYTES;

  const parsed = parseDataUrl(dataUrlOrBase64);
  const mimeType = parsed?.mimeType ?? "application/octet-stream";
  const base64 = parsed?.base64 ?? dataUrlOrBase64;

  if (parsed && !mimeTypes.includes(parsed.mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Accepted: ${mimeTypes.join(", ")}.`);
  }

  const size = approxBase64Bytes(base64);
  if (size > maxBytes) {
    throw new Error(`File too large — maximum ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }

  const [inserted] = await db
    .insert(fileAssets)
    .values({
      ownerId,
      fileName: options.fileName ?? `upload.${mimeType.split("/").pop() ?? "bin"}`,
      mimeType,
      size,
      provider: "database",
      url: buildDataUrl(mimeType, base64),
      data: base64,
    })
    .$returningId();

  const rows = await db.select().from(fileAssets).where(eq(fileAssets.id, inserted.id)).limit(1);
  return rows[0]!;
}

export async function resolveAssetUrl(
  value: string | null | undefined,
  db?: DbClient,
): Promise<string | null | undefined> {
  if (!value) return value;
  if (!isAssetRef(value)) return value;

  const id = parseAssetRef(value);
  if (!id) return value;

  const conn = db ?? getDb();
  const rows = await conn.select().from(fileAssets).where(eq(fileAssets.id, id)).limit(1);
  const asset = rows[0];
  if (!asset) return null;
  if (asset.data) return buildDataUrl(asset.mimeType, asset.data);
  return asset.url ?? null;
}

// Resolve multiple fields on a plain object by returning a new object.
export async function resolveAssetFields<T extends Record<string, unknown>>(
  record: T,
  fields: (keyof T)[],
  db?: DbClient,
): Promise<T> {
  const resolved = { ...record };
  for (const field of fields) {
    resolved[field] = (await resolveAssetUrl(resolved[field] as string | null | undefined, db)) as T[keyof T];
  }
  return resolved;
}
