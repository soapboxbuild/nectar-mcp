# nectar-mcp

MCP server for the [Nectar Climate](https://nectarclimate.com) utility data API (v2).

Exposes utility bill parsing, meter data, and ENERGY STAR Portfolio Manager export as MCP tools.

## Tools

| Tool | Description |
|---|---|
| `list_sites` | List all sites/properties, optionally filtered by company |
| `get_site_usage` | Energy consumption data for a site over a date range |
| `get_meters` | All meters (utility accounts) for a site |
| `get_meter_usage` | Usage data for a specific meter with demand/supply breakdown |
| `get_bills` | Parsed utility bills (documents) for a site |
| `submit_bills` | Upload a PDF utility bill for OCR parsing |
| `export_to_energy_star` | Push data to ENERGY STAR Portfolio Manager |
| `get_interval_data` | High-resolution interval data for a utility connection |

## Auth

Set your Nectar API key as a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your-nectar-api-key>
```

The server forwards this as an `X-API-Key` header to the Nectar API.

## Running locally

```bash
npm install
npm run dev     # development (tsx)
npm run build   # compile TypeScript
npm start       # run compiled output
```

## Deploy to Railway

```bash
railway link    # link to your Railway project
railway up      # deploy
```

## MCP endpoint

```
POST /mcp
```

Stateless streamable HTTP transport. No session management required.

## Health check

```
GET /health
```

Returns `{"status":"ok","service":"nectar-mcp"}`.
