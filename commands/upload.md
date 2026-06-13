---
description: Upload utility bill PDFs to Nectar for parsing
argument-hint: [file path or "use uploaded PDF"]
---
Upload utility bills to Nectar Climate for automatic parsing:
1. Encode the PDF as base64 and call submit_bills
2. Wait for processing, then call get_bills to confirm extraction
3. Show: billing period, total usage, total cost, rate per unit
$ARGUMENTS
