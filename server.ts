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

  // CORS middleware for Gemini MCP connector
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
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
        if (toolName === "staging_get_pricing") {
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

          const pricingRef = doc(db, "pricing", "global");
          await setDoc(pricingRef, updatePayload, { merge: true });

          toolResult = {
            success: true,
            hasGarments: Boolean(args.garments),
            hasCatalogGarments: Array.isArray(args.catalogGarments),
            message: "Staging pricing/global successfully updated with { merge: true }."
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
