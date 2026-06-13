---
name: nectar
description: Parse utility bills and aggregate consumption data via Nectar Climate. Retrieve bills, meter readings, and usage data for buildings, then export automatically to ENERGY STAR Portfolio Manager. Use when asked about utility bill parsing, submitting bills, energy consumption data, or ENERGY STAR data upload.
---

# Nectar Climate Utility Data

## Available Tools
- `list_sites` — List all sites/properties in the account
- `get_site_usage` — Energy consumption data for a site over a date range
- `get_meters` — List utility meters for a site (electricity, gas, water)
- `get_meter_usage` — Detailed usage data for a specific meter
- `get_bills` — Parsed utility bills with line-item breakdown
- `submit_bills` — Upload utility bill PDFs for automatic parsing (base64)
- `export_to_energy_star` — Push utility data directly to EPA Portfolio Manager
- `get_interval_data` — High-resolution interval readings for a connection

## Key Workflow
1. Submit bill PDFs via `submit_bills` → Nectar parses at 99%+ accuracy
2. Review with `get_bills` or `get_site_usage`
3. Export to ENERGY STAR with `export_to_energy_star`

## Authentication
Requires `NECTAR_API_KEY`. Get at nectarclimate.com.
In Soapbox: Settings → Plugins → Nectar Climate → Add key.
