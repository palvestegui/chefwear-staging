import crypto from "node:crypto";
import type { Request } from "express";

export function normalizeCatalogGarmentsMap(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (Array.isArray(raw)) {
    const mapped: Record<string, unknown> = {};
    raw.forEach((item, index) => {
      if (item && typeof item === "object") {
        const entry = item as { name?: unknown; sku?: unknown; id?: unknown };
        const key = String(entry.name || entry.sku || entry.id || `item_${index}`);
        mapped[key] = item;
      }
    });
    return mapped;
  }
  return {};
}

export function verifySharedSecret(provided: string, expected: string): boolean {
  const cleanProvided = provided.trim();
  const cleanExpected = expected.trim();
  if (!cleanExpected || !cleanProvided) return false;
  const a = Buffer.from(cleanProvided, "utf8");
  const b = Buffer.from(cleanExpected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function extractHeaderKey(req: Request, headerNames: string[]): string {
  for (const name of headerNames) {
    const val = req.headers[name.toLowerCase()];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return "";
}

export function isAuthorizedSyncRequest(req: Request): boolean {
  const expected = (process.env.SYNC_API_KEY || "").trim();
  const provided = extractHeaderKey(req, ["x-sync-api-key", "x-pulse-key"]);
  return verifySharedSecret(provided, expected);
}

export function isAuthorizedPulseRequest(req: Request): boolean {
  const expected = (process.env.AZAFRAN_PULSE_KEY || process.env.SYNC_API_KEY || "").trim();
  const provided = extractHeaderKey(req, ["x-pulse-key", "x-sync-api-key"]);
  return verifySharedSecret(provided, expected);
}
