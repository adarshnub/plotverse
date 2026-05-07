import "server-only";

import type { ScrapeSource } from "@/lib/types";
import { parseListingText } from "@/lib/scrapers/parsing";
import type { RawScrapeCandidate } from "@/lib/ingestion";

export interface SourceAdapterResult {
  sourceId: string;
  candidates: RawScrapeCandidate[];
  errors: string[];
}

export interface SourceAdapter {
  key: string;
  run(source: ScrapeSource): Promise<SourceAdapterResult>;
}

async function getPageText(source: ScrapeSource) {
  const errors: string[] = [];
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    });
    await page.goto(source.searchUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1200);
    const text = await page.locator("body").innerText({ timeout: 10000 });
    await browser.close();
    return { text, errors };
  } catch (error) {
    errors.push(`${source.name}: Playwright failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const response = await fetch(source.searchUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { text: await response.text(), errors };
  } catch (error) {
    errors.push(`${source.name}: fetch fallback failed: ${error instanceof Error ? error.message : String(error)}`);
    return { text: "", errors };
  }
}

function createGenericAdapter(key: string): SourceAdapter {
  return {
    key,
    async run(source) {
      const page = await getPageText(source);
      return {
        sourceId: source.id,
        candidates: page.text ? parseListingText(page.text, source) : [],
        errors: page.errors,
      };
    },
  };
}

export const sourceAdapters: Record<string, SourceAdapter> = {
  "magicbricks-kottayam-plots": createGenericAdapter("magicbricks-kottayam-plots"),
  "housing-kottayam-plots": createGenericAdapter("housing-kottayam-plots"),
  "olx-kottayam-land": createGenericAdapter("olx-kottayam-land"),
  "99acres-kottayam-plots": createGenericAdapter("99acres-kottayam-plots"),
  "nobroker-kottayam-plots": createGenericAdapter("nobroker-kottayam-plots"),
  "keralarealty-kottayam-land": createGenericAdapter("keralarealty-kottayam-land"),
  "kerala-rera-reference": createGenericAdapter("kerala-rera-reference"),
};
