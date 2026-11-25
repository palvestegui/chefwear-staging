import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./src/firebase";
import { adminDb, isAdminDbAvailable } from "./src/server/adminDb";
import { persistCatalogMediaDocs, splitCatalogMedia, CatalogMediaWriteItem } from "./src/server/catalogMediaSync";
import {
  isAuthorizedPulseRequest,
  isAuthorizedSyncRequest,
  normalizeCatalogGarmentsMap,
} from "./src/server/syncAuth";

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Higher payload limit for full catalog matrices (including rich descriptions and images)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS middleware for Precios sync, local testing, and Gemini MCP connector
  app.use((req: Request, res: Response, next) => {
    const origin = req.headers.origin || "*";
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-sync-api-key, x-pulse-key");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  const writePricingGlobal = async (payload: Record<string, unknown>): Promise<"admin" | "client"> => {
    if (isAdminDbAvailable) {
      try {
        await adminDb.collection("pricing").doc("global").set(payload, { merge: true });
        return "admin";
      } catch (adminErr: unknown) {
        console.warn("[Sync] adminDb error, falling back to client Firestore SDK:", adminErr instanceof Error ? adminErr.message : String(adminErr));
      }
    }
    await setDoc(doc(db, "pricing", "global"), payload, { merge: true });
    return "client";
  };

  // Direct pricing sync ingestion endpoint (supports aliases: /api/pricing/sync, /api/sync-to-ventas, /api/sync-pricing, /sync)
  const handleCatalogSync = async (req: Request, res: Response) => {
    if (!isAuthorizedSyncRequest(req)) {
      return res.status(401).json({ success: false, error: "Unauthorized: invalid or missing SYNC_API_KEY" });
    }
    try {
      const payload: Record<string, unknown> = {
        lastSyncedAt: typeof req.body?.lastSyncedAt === "number" ? req.body.lastSyncedAt : Date.now(),
        updatedAt: typeof req.body?.updatedAt === "string" && req.body.updatedAt.trim()
          ? req.body.updatedAt
          : new Date().toISOString()
      };
      let syncedGarmentsCount = 0;
      if (req.body?.garments && typeof req.body.garments === "object" && !Array.isArray(req.body.garments)) {
        const garmentsObj = req.body.garments as Record<string, unknown>;
        payload.garments = garmentsObj;
        syncedGarmentsCount = Object.keys(garmentsObj).length;
      }
      let syncedCatalogCount = 0;
      let mediaItems: CatalogMediaWriteItem[] = [];
      if (req.body?.catalogGarments !== undefined) {
        const normalizedCatalog = normalizeCatalogGarmentsMap(req.body.catalogGarments);
        const split = splitCatalogMedia(normalizedCatalog, String(payload.updatedAt));
        payload.catalogGarments = split.lightweightCatalog;
        mediaItems = split.mediaItems;
        syncedCatalogCount = Object.keys(split.lightweightCatalog).length;
      }
      // Write with { merge: true } — preserve services, specialPresets, and discountRulesByTier
      const syncedVia = await writePricingGlobal(payload);
      await persistCatalogMediaDocs(mediaItems, isAdminDbAvailable ? adminDb : null, db);

      return res.json({
        success: true,
        syncedVia,
        syncedGarmentsCount,
        syncedCatalogCount,
        syncedMediaCount: mediaItems.length,
        message: "Ventas Staging pricing/global successfully updated"
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error syncing pricing to Ventas:", message);
      return res.status(500).json({ success: false, error: message });
    }
  };

  app.post("/api/pricing/sync", handleCatalogSync);
  app.post("/api/sync-to-ventas", handleCatalogSync);
  app.post("/api/sync-pricing", handleCatalogSync);
  app.post("/sync", handleCatalogSync);

  app.get("/mcp", (_req: Request, res: Response) => res.json({ status: "ok", server: "azafran-ventas-staging", protocol: "mcp" }));
  app.post("/mcp", async (req: Request, res: Response) => {
    const { id, method, params } = req.body as JsonRpcRequest;
    if (!isAuthorizedPulseRequest(req)) {
      return res.status(401).json({ jsonrpc: "2.0", id: id ?? null, error: { code: -32001, message: "Unauthorized: invalid or missing AZAFRAN_PULSE_KEY / SYNC_API_KEY" } });
    }

    if (method === "initialize") {
      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "azafran-ventas-staging", version: "1.0.0" }
        }
      });
    }

    if (method === "notifications/initialized") {
      return res.status(200).json({});
    }

    if (method === "tools/list") {
      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "staging_get_bundle",
              description: "Aggregated bundle fetching pricing/global, active orders, and active quotes in a single call",
              inputSchema: { type: "object", properties: {} }
            },
            {
              name: "staging_get_pricing",
              description: "Inspect pricing/global document in Staging Firestore",
              inputSchema: { type: "object", properties: {} }
            },
            {
              name: "staging_get_orders",
              description: "List all active orders in Staging Firestore",
              inputSchema: { type: "object", properties: {} }
            },
            {
              name: "staging_get_quotes",
              description: "List all active quotes in Staging Firestore",
              inputSchema: { type: "object", properties: {} }
            },
            {
              name: "staging_update_pricing_matrix",
              description: "Updates garments (Tarifario Base) and catalogGarments (Catálogo Maestro) in Staging pricing/global with { merge: true }",
              inputSchema: {
                type: "object",
                properties: {
                  garments: {
                    type: "object",
                    description: "Multi-fabric pricing dictionary: { [garment]: { [fabric]: { priceRaleo, priceB2B } } }"
                  },
                  catalogGarments: {
                    type: "object",
                    description: "Map of finished catalog garments keyed by garment name"
                  }
                }
              }
            }
          ]
        }
      });
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};
      let toolResult: unknown;

      try {
        if (toolName === "staging_get_bundle") {
          const [pricingSnap, ordersSnap, quotesSnap] = await Promise.all([
            getDoc(doc(db, "pricing", "global")),
            getDocs(collection(db, "orders")),
            getDocs(collection(db, "quotes"))
          ]);

          const pricing = pricingSnap.exists() ? pricingSnap.data() : null;
          const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const activeOrders = allOrders.filter(
            (o: Record<string, unknown>) => o.status !== "Cancelado"
          );
          const quotes = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const lastSyncedAt = typeof pricing?.lastSyncedAt === "number" ? pricing.lastSyncedAt : Date.now();

          toolResult = {
            pricing,
            orders: activeOrders,
            quotes,
            summary: {
              activeOrdersCount: activeOrders.length,
              quotesCount: quotes.length,
              lastSyncedAt
            }
          };
        } else if (toolName === "staging_get_pricing") {
          const docRef = doc(db, "pricing", "global");
          const docSnap = await getDoc(docRef);
          toolResult = docSnap.exists() ? docSnap.data() : { error: "pricing/global not found" };
        } else if (toolName === "staging_get_orders") {
          const snap = await getDocs(collection(db, "orders"));
          toolResult = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else if (toolName === "staging_get_quotes") {
          const snap = await getDocs(collection(db, "quotes"));
          toolResult = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else if (toolName === "staging_update_pricing_matrix") {
          const updatePayload: Record<string, unknown> = {
            lastSyncedAt: Date.now(),
            updatedAt: new Date().toISOString()
          };
          if (args.garments && typeof args.garments === "object" && !Array.isArray(args.garments)) {
            updatePayload.garments = args.garments;
          }
          if (args.catalogGarments !== undefined) {
            updatePayload.catalogGarments = normalizeCatalogGarmentsMap(args.catalogGarments);
          }

          await writePricingGlobal(updatePayload);

          toolResult = {
            success: true,
            message: "Staging pricing/global successfully refreshed via Admin SDK with merge: true."
          };
        } else {
          toolResult = `Tool ${toolName} not found.`;
        }

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(toolResult, null, 2) }]
          }
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return res.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32000, message }
        });
      }
    }

    return res.status(404).json({ error: "Method not found" });
  });

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Vite middleware in development / static dist in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Staging Server] Running at http://0.0.0.0:${PORT}`);
    console.log(`[Staging MCP] JSON-RPC endpoint active at /mcp`);
  });
}

startServer().catch(console.error);
