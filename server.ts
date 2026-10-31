import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./src/firebase";
import { db as adminDb } from "./src/server/adminDb";

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
  const PORT = process.env.NODE_ENV === "production" ? (Number(process.env.PORT) || 3000) : 3000;

  // Higher payload limit for full catalog matrices (including rich descriptions and images)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS middleware for Precios sync, local testing, and Gemini MCP connector
  app.use((req: Request, res: Response, next) => {
    const origin = req.headers.origin || "*";
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Direct pricing sync ingestion endpoint (supports aliases: /api/pricing/sync, /api/sync-to-ventas, /api/sync-pricing, /sync)
  const handleCatalogSync = async (req: Request, res: Response) => {
    try {
      const payload = {
        garments: (req.body?.garments || {}) as Record<string, unknown>,
        catalogGarments: (req.body?.catalogGarments || []) as unknown,
        lastSyncedAt: Date.now()
      };

      // Elevated permissions write via Admin SDK with { merge: true }
      // Zero Data Loss: NEVER overwrite or drop pricing.services, pricing.specialPresets, or discountRulesByTier
      await adminDb.collection('pricing').doc('global').set(payload, { merge: true });

      return res.json({
        success: true,
        syncedGarmentsCount: Object.keys(payload.garments || {}).length,
        syncedCatalogCount: Array.isArray(payload.catalogGarments)
          ? payload.catalogGarments.length
          : Object.keys(payload.catalogGarments || {}).length,
        message: 'Ventas Staging pricing/global successfully updated via Admin SDK'
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error syncing pricing to Ventas via Admin SDK:", message);
      return res.status(500).json({ success: false, error: message });
    }
  };

  app.post("/api/pricing/sync", handleCatalogSync);
  app.post("/api/sync-to-ventas", handleCatalogSync);
  app.post("/api/sync-pricing", handleCatalogSync);
  app.post("/sync", handleCatalogSync);

  // Health and ping on /mcp
  app.get("/mcp", (_req: Request, res: Response) => {
    res.json({ status: "ok", server: "azafran-ventas-staging", protocol: "mcp" });
  });

  // MCP JSON-RPC 2.0 Handler
  app.post("/mcp", async (req: Request, res: Response) => {
    const { id, method, params } = req.body as JsonRpcRequest;

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
                    type: "array",
                    description: "Array of finished catalog garments pinned to default fabrics"
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
            lastSyncedAt: Date.now()
          };
          if (args.garments && typeof args.garments === "object") {
            updatePayload.garments = args.garments;
          }
          if (Array.isArray(args.catalogGarments)) {
            updatePayload.catalogGarments = args.catalogGarments;
          }

          await adminDb.collection('pricing').doc('global').set(updatePayload, { merge: true });

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
