import crypto from "node:crypto";
import { doc, Firestore, setDoc } from "firebase/firestore";

export interface CatalogMediaWriteItem {
  docId: string;
  garmentName: string;
  sku?: string;
  imageUrl?: string;
  backImageUrl?: string;
  updatedAt: string;
}

interface AdminFirestoreWriter {
  collection: (name: string) => {
    doc: (id: string) => {
      set: (data: Record<string, unknown>, opt?: { merge: boolean }) => Promise<unknown>;
    };
  };
}

const BULKY_URL_THRESHOLD = 2048;

export function toMediaDocId(garmentName: string): string {
  const clean = garmentName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  const hash = crypto.createHash("sha1").update(garmentName).digest("hex").slice(0, 6);
  return `media__${clean || "item"}_${hash}`;
}

export function splitCatalogMedia(
  catalogGarments: Record<string, unknown>,
  updatedAt: string
): { lightweightCatalog: Record<string, unknown>; mediaItems: CatalogMediaWriteItem[] } {
  const lightweightCatalog: Record<string, unknown> = {};
  const mediaItems: CatalogMediaWriteItem[] = [];

  for (const [key, rawVal] of Object.entries(catalogGarments)) {
    if (!rawVal || typeof rawVal !== "object" || Array.isArray(rawVal)) {
      lightweightCatalog[key] = rawVal;
      continue;
    }

    const entry = rawVal as Record<string, unknown>;
    const copy: Record<string, unknown> = { ...entry };
    const front =
      (typeof entry.imageUrl === "string" && entry.imageUrl.trim()) ||
      (typeof entry.frontImage === "string" && entry.frontImage.trim()) ||
      (typeof entry.image === "string" && entry.image.trim()) ||
      "";
    const back =
      (typeof entry.backImageUrl === "string" && entry.backImageUrl.trim()) ||
      (typeof entry.backImage === "string" && entry.backImage.trim()) ||
      "";

    const hasBulkyFront = front.length > BULKY_URL_THRESHOLD;
    const hasBulkyBack = back.length > BULKY_URL_THRESHOLD;

    if (hasBulkyFront || hasBulkyBack) {
      if (hasBulkyFront) {
        delete copy.imageUrl;
        delete copy.frontImage;
        delete copy.image;
      }
      if (hasBulkyBack) {
        delete copy.backImageUrl;
        delete copy.backImage;
      }
      mediaItems.push({
        docId: toMediaDocId(String(entry.name || key)),
        garmentName: String(entry.name || key),
        ...(typeof entry.sku === "string" && entry.sku ? { sku: entry.sku } : {}),
        ...(front ? { imageUrl: front } : {}),
        ...(back ? { backImageUrl: back } : {}),
        updatedAt,
      });
    }

    lightweightCatalog[key] = copy;
  }

  return { lightweightCatalog, mediaItems };
}

export async function persistCatalogMediaDocs(
  mediaItems: CatalogMediaWriteItem[],
  adminDbOrNull: AdminFirestoreWriter | null,
  clientDb: Firestore
): Promise<void> {
  if (mediaItems.length === 0) return;

  const BATCH_SIZE = 6;
  for (let i = 0; i < mediaItems.length; i += BATCH_SIZE) {
    const chunk = mediaItems.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (item) => {
        const docPayload: Record<string, unknown> = {
          garmentName: item.garmentName,
          updatedAt: item.updatedAt,
          ...(item.sku ? { sku: item.sku } : {}),
          ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
          ...(item.backImageUrl ? { backImageUrl: item.backImageUrl } : {}),
        };
        if (adminDbOrNull) {
          try {
            await adminDbOrNull.collection("pricing").doc(item.docId).set(docPayload, { merge: true });
            return;
          } catch {
            // Fall through to client SDK
          }
        }
        await setDoc(doc(clientDb, "pricing", item.docId), docPayload, { merge: true });
      })
    );
  }
}
