import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";

const NECTAR_BASE_URL = "https://external.nectarclimate.com/v2";

// --- Nectar API helper ---

async function nectarFetch(
  apiKey: string,
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const url = `${NECTAR_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Nectar API error ${res.status}: ${text}`);
  }

  return res.json();
}

// --- MCP Server factory (one per request, stateless) ---

function createNectarServer(apiKey: string): McpServer {
  const server = new McpServer({
    name: "nectar-climate",
    version: "0.1.0",
  });

  // 1. list_sites
  server.tool(
    "list_sites",
    "List all sites/properties. Optionally filter by companyId.",
    {
      companyId: z.string().optional().describe("Filter by company ID"),
      limit: z.number().default(100).describe("Max results to return"),
      offset: z.number().default(0).describe("Pagination offset"),
    },
    async ({ companyId, limit, offset }) => {
      const path = companyId
        ? `/companies/${companyId}/sites?limit=${limit}&offset=${offset}`
        : `/sites?limit=${limit}&offset=${offset}`;
      const data = await nectarFetch(apiKey, path);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // 2. get_site_usage
  server.tool(
    "get_site_usage",
    "Get energy consumption data for a site over a date range.",
    {
      siteId: z.string().describe("Site ID"),
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format"),
      dateType: z
        .enum(["BILL_DATE", "USAGE_PERIOD"])
        .default("USAGE_PERIOD")
        .describe("How to interpret the date range"),
    },
    async ({ siteId, startDate, endDate, dateType }) => {
      const params = new URLSearchParams({ startDate, endDate, dateType });
      const data = await nectarFetch(
        apiKey,
        `/sites/${siteId}/usage-data?${params}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // 3. get_meters
  server.tool(
    "get_meters",
    "Get all meters (utility accounts) for a site.",
    {
      siteId: z.string().describe("Site ID"),
    },
    async ({ siteId }) => {
      const data = await nectarFetch(apiKey, `/sites/${siteId}/meters`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // 4. get_meter_usage
  server.tool(
    "get_meter_usage",
    "Get usage data for a specific meter, including demand/supply breakdown.",
    {
      meterId: z.string().describe("Meter ID"),
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format"),
    },
    async ({ meterId, startDate, endDate }) => {
      const params = new URLSearchParams({ startDate, endDate });
      const data = await nectarFetch(
        apiKey,
        `/meters/${meterId}/usage-data?${params}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // 5. get_bills
  server.tool(
    "get_bills",
    "Get parsed utility bills (documents) for a site.",
    {
      siteId: z.string().describe("Site ID"),
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
      limit: z.number().default(12).describe("Max bills to return"),
    },
    async ({ siteId, startDate, endDate, limit }) => {
      const params = new URLSearchParams({ startDate, limit: String(limit) });
      if (endDate) params.set("endDate", endDate);
      const data = await nectarFetch(
        apiKey,
        `/sites/${siteId}/documents?${params}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // 6. submit_bills
  server.tool(
    "submit_bills",
    "Upload a utility bill PDF (base64-encoded) for OCR parsing.",
    {
      base64Pdf: z.string().describe("Base64-encoded PDF content"),
      filename: z.string().describe("Filename for the uploaded PDF"),
      siteId: z
        .string()
        .optional()
        .describe("Site ID to associate the bill with"),
    },
    async ({ base64Pdf, filename, siteId }) => {
      const pdfBuffer = Buffer.from(base64Pdf, "base64");
      const formData = new FormData();
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      formData.append("file", blob, filename);
      if (siteId) formData.append("siteId", siteId);

      const res = await fetch(`${NECTAR_BASE_URL}/jobs/documents`, {
        method: "POST",
        headers: { "X-API-Key": apiKey },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Nectar API error ${res.status}: ${text}`);
      }

      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // 7. export_to_energy_star
  server.tool(
    "export_to_energy_star",
    "Push utility data to ENERGY STAR Portfolio Manager via a configured integration.",
    {
      integrationId: z
        .string()
        .describe("Integration ID for the Portfolio Manager connection"),
      startDate: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
    },
    async ({ integrationId, startDate, endDate }) => {
      const body: Record<string, string> = { integrationId };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;

      const data = await nectarFetch(apiKey, `/exports/integration`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // 8. get_interval_data
  server.tool(
    "get_interval_data",
    "Get high-resolution interval (sub-hourly or hourly) data for a utility connection.",
    {
      connectionId: z.string().describe("Connection ID"),
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format"),
      limit: z.number().default(100).describe("Max records to return"),
    },
    async ({ connectionId, startDate, endDate, limit }) => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        limit: String(limit),
      });
      const data = await nectarFetch(
        apiKey,
        `/connections/${connectionId}/intervals?${params}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  return server;
}

// --- Hono HTTP app ---

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok", service: "nectar-mcp" }));

app.post("/mcp", async (c) => {
  // Extract API key from Authorization: Bearer <token>
  const authHeader = c.req.header("authorization") ?? "";
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!apiKey) {
    return c.json({ error: "Missing Authorization header" }, 401);
  }

  const server = createNectarServer(apiKey);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  await server.connect(transport);

  const response = await transport.handleRequest(c.req.raw);
  return response;
});

app.get("/mcp", (c) =>
  c.json(
    { error: "Method not allowed. Use POST /mcp for MCP requests." },
    405
  )
);

const port = parseInt(process.env["PORT"] ?? "3000", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`nectar-mcp listening on port ${port}`);
});
