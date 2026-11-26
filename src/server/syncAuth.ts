import crypto from "node:crypto";
import type { Request } from "express";
import { App, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const DEFAULT_PRECIOS_PROJECT_ID = "gen-lang-client-0346242663";

const AUTHORIZED_SYNC_ADMIN_EMAILS = new Set([
  "palvestegui@gmail.com",
  "doris@azafran.bo",
  "doriscampos@alvestegui.com",
]);

function getAllowedAdminEmails(): Set<string> {
  const allowed = new Set(AUTHORIZED_SYNC_ADMIN_EMAILS);
  const extra = (process.env.SYNC_ADMIN_EMAILS || "").trim();
  if (extra) {
    extra
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .forEach((email) => allowed.add(email));
  }
  return allowed;
}

function getAllowedFirebaseProjectIds(): Set<string> {
  const preciosProjectId = (process.env.PRECIOS_FIREBASE_PROJECT_ID || DEFAULT_PRECIOS_PROJECT_ID).trim();
  return new Set([firebaseConfig.projectId, preciosProjectId].filter(Boolean));
}

function getAuthVerifierApp(projectId: string): App {
  const appName = `sync-auth-${projectId}`;
  const existing = getApps().find((a) => a.name === appName);
  return existing ?? initializeApp({ projectId }, appName);
}

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

export function extractFirebaseIdToken(req: Request): string {
  const explicit = req.headers["x-firebase-id-token"];
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return "";
}

export function peekJwtAudience(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(payloadJson) as { aud?: unknown };
    return typeof parsed.aud === "string" && parsed.aud.trim() ? parsed.aud.trim() : null;
  } catch {
    return null;
  }
}

export async function verifyAuthorizedSyncRequest(req: Request): Promise<boolean> {
  if (isAuthorizedSyncRequest(req)) {
    return true;
  }

  const idToken = extractFirebaseIdToken(req);
  if (!idToken) return false;

  const aud = peekJwtAudience(idToken);
  if (!aud || !getAllowedFirebaseProjectIds().has(aud)) {
    return false;
  }

  try {
    const decoded = await getAuth(getAuthVerifierApp(aud)).verifyIdToken(idToken);
    const email = (decoded.email || "").trim().toLowerCase();
    return Boolean(decoded.email_verified === true && email && getAllowedAdminEmails().has(email));
  } catch {
    return false;
  }
}

export function isAuthorizedPulseRequest(req: Request): boolean {
  const expected = (process.env.AZAFRAN_PULSE_KEY || process.env.SYNC_API_KEY || "").trim();
  const provided = extractHeaderKey(req, ["x-pulse-key", "x-sync-api-key"]);
  return verifySharedSecret(provided, expected);
}
