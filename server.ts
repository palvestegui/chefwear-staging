import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./src/firebase";

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

  // Higher payload limit for full catalog matrices
  app.use(express.json({ limit: "5mb" }));

  // CORS middleware for Precios sync and Gemini MCP connector
  app.use((req: Request, res: Response, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Direct pricing sync ingestion endpoint
  app.post("/api/pricing/sync", async (req: Request, res: Response) => {
    try {
      const { garments, catalogGarments, lastSyncedAt } = (req.body || {}) as {
        garments?: Record<string, unknown>;
        catalogGarments?: unknown;
        lastSyncedAt?: number;
      };

      if (!garments && !catalogGarments) {
        return res.status(400).json({
          success: false,
          error: "Payload missing garments or catalogGarments"
        });
      }

      const payload: Record<string, unknown> = {
        lastSyncedAt: lastSyncedAt || Date.now()
      };
      if (garments) payload.garments = garments;
      if (catalogGarments) payload.catalogGarments = catalogGarments;

      // Direct write using Ventas' own authenticated Firestore instance
      await setDoc(doc(db, "pricing", "global"), payload, { merge: true });

      return res.json({
        success: true,
        message: "Pricing snapshot successfully synchronized into Ventas",
        updatedAt: payload.lastSyncedAt
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error syncing pricing to Ventas:", message);
      return res.status(500).json({ success: false, error: message });
    }
  });

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
          const docRef = doc(db, "pricing", "global");
          const docSnap = await getDoc(docRef);
          const currentData = docSnap.exists() ? docSnap.data() : {};

          if (args.garments && typeof args.garments === "object") {
            currentData.garments = args.garments;
          }
          if (Array.isArray(args.catalogGarments)) {
            currentData.catalogGarments = args.catalogGarments;
          }
          currentData.lastSyncedAt = Date.now();

          await setDoc(docRef, currentData);

          toolResult = {
            success: true,
            message: "Staging pricing/global successfully refreshed. Garments map replaced cleanly."
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
