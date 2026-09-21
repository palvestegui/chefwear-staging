import type { Express } from 'express';
import {
  getSummaryData,
  getReportsData,
  getSellersData,
  getBottlenecksData,
  getOrdersData,
  getQuotesData,
  getDirectoryData,
  handleActionRevertOrder,
  handleActionDeleteQuote,
  handleActionMergeContacts,
  handleActionCreateQuote
} from './pulseService';

export function setupMcpRoutes(app: Express, PULSE_KEY: string | undefined, firebaseConfig: any) {
  app.get('/mcp', (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(`event: endpoint\ndata: /mcp\n\n`);
    } else {
      res.json({ status: "ok", protocol: "mcp", version: "2024-11-05", server: "azafran-erp" });
    }
  });

  app.post('/mcp', async (req, res) => {
    const { jsonrpc, id, method, params } = req.body;
    if (jsonrpc !== "2.0") {
      res.status(400).json({ error: "Invalid JSON-RPC version" });
      return;
    }

    const key = req.query['x-pulse-key'] || req.headers['x-pulse-key'] || req.query.key;
    if (key && key !== PULSE_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      if (method === "initialize") {
        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "azafran-erp", version: "1.0.0" }
          }
        });
        return;
      }

      if (method === "notifications/initialized") {
        res.status(200).send();
        return;
      }

      if (method === "tools/list") {
        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            tools: [
              {
                name: "azafran_get_summary",
                description: "Get high-level business pulse: active orders count, quote count, collected cash, and pending balances.",
                inputSchema: { type: "object", properties: {} }
              },
              {
                name: "azafran_get_bottlenecks",
                description: "Scan active orders for workshop bottlenecks, delivery risks (>15 days), trapped receivables, and payment anomalies.",
                inputSchema: { type: "object", properties: {} }
              },
              {
                name: "azafran_get_reports",
                description: "Get executive financial and garment demand analytics: gross revenue, average ticket, top garments, and collection efficiency.",
                inputSchema: { type: "object", properties: {} }
              },
              {
                name: "azafran_get_sellers",
                description: "Get sales performance metrics, quote conversion rates, and revenue generated per seller.",
                inputSchema: { type: "object", properties: {} }
              },
              {
                name: "azafran_get_orders",
                description: "List all active workshop production orders with client names, garments, stages, and balances.",
                inputSchema: { type: "object", properties: {} }
              },
              {
                name: "azafran_get_quotes",
                description: "List all active quotations in the sales pipeline.",
                inputSchema: { type: "object", properties: {} }
              },
              {
                name: "azafran_get_directory",
                description: "List all CRM directory contacts, company affiliations, and phone numbers.",
                inputSchema: { type: "object", properties: {} }
              },
              {
                name: "azafran_create_quote",
                description: "Create a new quotation directly in the Azafrán ERP database.",
                inputSchema: {
                  type: "object",
                  properties: {
                    customer: { type: "string", description: "Full client name" },
                    phone: { type: "string" },
                    email: { type: "string" },
                    companyName: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          qty: { type: "number" },
                          price: { type: "number" },
                          fabric: { type: "string" }
                        },
                        required: ["name", "qty", "price"]
                      }
                    },
                    totalPrice: { type: "number" },
                    notes: { type: "string" },
                    sellerName: { type: "string" }
                  },
                  required: ["customer", "items", "totalPrice"]
                }
              },
              {
                name: "azafran_revert_order",
                description: "Revert an accidental or premature order back into an editable quote.",
                inputSchema: {
                  type: "object",
                  properties: {
                    orderId: { type: "string", description: "The order ID (e.g., #ORD-00025)" }
                  },
                  required: ["orderId"]
                }
              },
              {
                name: "azafran_delete_quote",
                description: "Permanently delete or cancel a quotation by ID.",
                inputSchema: {
                  type: "object",
                  properties: {
                    quoteId: { type: "string", description: "The quote ID to delete" }
                  },
                  required: ["quoteId"]
                }
              },
              {
                name: "azafran_merge_contacts",
                description: "Merge a duplicate CRM contact into a master contact, reassigning all order histories.",
                inputSchema: {
                  type: "object",
                  properties: {
                    sourceContactId: { type: "string" },
                    targetContactId: { type: "string" }
                  },
                  required: ["sourceContactId", "targetContactId"]
                }
              }
            ]
          }
        });
        return;
      }

      if (method === "tools/call") {
        const toolName = params?.name;
        const args = params?.arguments || {};
        
        if (!firebaseConfig) {
          res.json({ jsonrpc: "2.0", id, error: { code: -32603, message: 'Firebase config missing' } });
          return;
        }
        
        let toolExecutionResult: any = null;

        if (toolName === "azafran_get_summary") {
          toolExecutionResult = await getSummaryData();
        } else if (toolName === "azafran_get_bottlenecks") {
          toolExecutionResult = await getBottlenecksData();
        } else if (toolName === "azafran_get_reports") {
          toolExecutionResult = await getReportsData();
        } else if (toolName === "azafran_get_sellers") {
          toolExecutionResult = await getSellersData();
        } else if (toolName === "azafran_get_orders") {
          toolExecutionResult = await getOrdersData();
        } else if (toolName === "azafran_get_quotes") {
          toolExecutionResult = await getQuotesData();
        } else if (toolName === "azafran_get_directory") {
          toolExecutionResult = await getDirectoryData();
        } else if (toolName === "azafran_create_quote") {
          toolExecutionResult = await handleActionCreateQuote(args);
        } else if (toolName === "azafran_revert_order") {
          toolExecutionResult = await handleActionRevertOrder(args.orderId);
        } else if (toolName === "azafran_delete_quote") {
          toolExecutionResult = await handleActionDeleteQuote(args.quoteId);
        } else if (toolName === "azafran_merge_contacts") {
          toolExecutionResult = await handleActionMergeContacts(args.sourceContactId, args.targetContactId);
        } else {
          res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Tool not found" } });
          return;
        }

        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              { type: "text", text: JSON.stringify(toolExecutionResult, null, 2) }
            ]
          }
        });
        return;
      }

      res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
    } catch (err: any) {
      res.json({ jsonrpc: "2.0", id, error: { code: -32603, message: err.message } });
    }
  });
}
