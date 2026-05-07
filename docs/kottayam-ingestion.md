# Kottayam Ingestion

Plotverse now includes a Kottayam-focused plot sourcing pipeline.

## What It Does

- Runs public-page source adapters for Kottayam district plot/land listings.
- Stores scraped candidates in a review queue.
- Normalizes plot facts such as locality, price, area, unit, sqft, and price per cent.
- Optionally uses OpenAI to enrich scraped plot or lead facts when `OPENAI_API_KEY` is configured.
- Records token usage and estimated model cost for AI-assisted normalization.
- Imports approved plot candidates into `properties`.
- Imports approved buyer/broker demand candidates into `clients`.
- Never sends outreach and never auto-imports scraped records.

## Source Policy

V1 sources are public-page only:

- MagicBricks Kottayam plots
- Housing Kottayam plots
- OLX Kottayam land/plots
- 99acres Kottayam plots
- NoBroker Kottayam plots
- KeralaRealty Kottayam land
- Kerala RERA as reference/verification

The scraper does not automate login, paid phone reveal, CAPTCHA bypass, or hidden contact extraction. Contacts are stored only if visibly public in scraped text.

## How To Use

1. Open `/ingestion`.
2. Select enabled sources.
3. Click `Run scraper`.
4. Review candidates.
5. Import useful plot or lead items.
6. Run matching from `/matches`.

## Review Statuses

- `review`: needs your decision.
- `duplicate`: likely already seen or imported.
- `imported`: approved and converted into a property/client.
- `rejected`: discarded.

## Implementation Notes

- Source adapters live in `lib/scrapers/adapters.ts`.
- Pure listing parsing lives in `lib/scrapers/parsing.ts`.
- Unit conversion and approval conversion live in `lib/ingestion.ts`.
- Scrape workflow orchestration lives in `lib/scrapers/run.ts`.
- Supabase tables are defined in `supabase/schema.sql`.
