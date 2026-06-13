---
description: Get energy consumption data for a site
argument-hint: [site name or ID, and date range]
---
Retrieve energy consumption for this site from Nectar:
1. Call list_sites if needed to find the site ID
2. Call get_site_usage for the date range
3. Summarize by meter type, show monthly trend, flag gaps
$ARGUMENTS
