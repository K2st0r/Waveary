import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

import { getWavearyDataDir } from "./data-dir.js";

let browserContextPromise: Promise<BrowserContext> | null = null;

export interface BrowserOpenResult {
  status: "opened";
  url: string;
  title?: string;
}

export async function openManagedBrowserPage(url: string): Promise<BrowserOpenResult> {
  const context = await getBrowserContext();
  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.bringToFront();
    const title = await safelyReadTitle(page);

    return {
      status: "opened",
      url: page.url(),
      ...(title ? { title } : {})
    };
  } catch (error) {
    await page.close().catch(() => undefined);
    throw error;
  }
}

export async function closeManagedBrowserAutomation(): Promise<void> {
  if (!browserContextPromise) {
    return;
  }

  const context = await browserContextPromise.catch(() => null);
  browserContextPromise = null;

  if (context) {
    await context.close().catch(() => undefined);
  }
}

async function getBrowserContext(): Promise<BrowserContext> {
  if (!browserContextPromise) {
    browserContextPromise = chromium.launchPersistentContext(getBrowserProfileDir(), {
      headless: false,
      viewport: {
        width: 1440,
        height: 960
      }
    });
  }

  return browserContextPromise;
}

function getBrowserProfileDir(): string {
  const dir = join(getWavearyDataDir(), "browser-profile");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function safelyReadTitle(page: Page): Promise<string | undefined> {
  try {
    const title = await page.title();
    const normalized = title.trim();
    return normalized || undefined;
  } catch {
    return undefined;
  }
}
