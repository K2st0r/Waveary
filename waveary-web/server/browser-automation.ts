import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

import { getWavearyDataDir } from "./data-dir.js";

let browserContextPromise: Promise<BrowserContext> | null = null;
let browserContextListenersAttached = false;
let activeManagedPage: Page | null = null;

const pageLifecycleMetadata = new WeakMap<
  Page,
  {
    openedAt: string;
    lastActiveAt: string;
  }
>();

type BrowserAutomationOverrides = {
  openPage?: (url: string) => Promise<BrowserOpenResult>;
  getPageInfo?: () => Promise<BrowserPageInfo | null>;
  extractPageText?: (
    options?: BrowserTextExtractOptions
  ) => Promise<BrowserTextExtractResult>;
  searchPageText?: (
    query: string,
    options?: BrowserPageSearchOptions
  ) => Promise<BrowserPageSearchResult>;
  listClickableElements?: (
    options?: BrowserClickableElementListOptions
  ) => Promise<BrowserClickableElementListResult>;
  clickByText?: (
    text: string,
    options?: BrowserClickByTextOptions
  ) => Promise<BrowserClickByTextResult>;
  close?: () => Promise<void>;
};

let browserAutomationOverrides: BrowserAutomationOverrides | null = null;

export interface BrowserOpenResult {
  status: "opened";
  url: string;
  title?: string;
}

export interface BrowserPageInfo {
  url: string;
  title?: string;
  openedAt?: string;
  lastActiveAt?: string;
}

export interface BrowserTextExtractOptions {
  maxChars?: number;
}

export interface BrowserTextExtractResult {
  page: BrowserPageInfo;
  text: string;
  truncated: boolean;
  extractedAt: string;
}

export interface BrowserPageSearchOptions {
  maxSnippets?: number;
  snippetRadius?: number;
}

export interface BrowserPageSearchResult {
  page: BrowserPageInfo;
  query: string;
  totalMatches: number;
  snippets: string[];
  searchedAt: string;
}

export interface BrowserClickableElement {
  text: string;
  tagName: string;
  role?: string;
  href?: string;
  ariaLabel?: string;
}

export interface BrowserClickableElementListOptions {
  maxElements?: number;
}

export interface BrowserClickableElementListResult {
  page: BrowserPageInfo;
  elements: BrowserClickableElement[];
  scannedAt: string;
}

export interface BrowserClickByTextOptions {
  exact?: boolean;
  timeoutMs?: number;
}

export interface BrowserClickByTextResult {
  page: BrowserPageInfo;
  matchedText: string;
  exact: boolean;
  clickedAt: string;
}

export async function openManagedBrowserPage(url: string): Promise<BrowserOpenResult> {
  if (browserAutomationOverrides?.openPage) {
    return browserAutomationOverrides.openPage(url);
  }

  const context = await getBrowserContext();
  const page = await context.newPage();
  registerManagedPage(page);

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await safelyBringToFront(page);
    markPageActive(page);
    const pageInfo = await describePage(page);

    return {
      status: "opened",
      url: pageInfo.url,
      ...(pageInfo.title ? { title: pageInfo.title } : {})
    };
  } catch (error) {
    await page.close().catch(() => undefined);
    throw error;
  }
}

export async function getManagedBrowserPageInfo(): Promise<BrowserPageInfo | null> {
  if (browserAutomationOverrides?.getPageInfo) {
    return browserAutomationOverrides.getPageInfo();
  }

  const page = await resolveManagedPageOrNull();
  if (!page) {
    return null;
  }

  return describePage(page);
}

export async function extractManagedBrowserPageText(
  options: BrowserTextExtractOptions = {}
): Promise<BrowserTextExtractResult> {
  if (browserAutomationOverrides?.extractPageText) {
    return browserAutomationOverrides.extractPageText(options);
  }

  const page = await requireManagedPage();
  const pageInfo = await describePage(page);
  const maxChars = normalizePositiveInteger(options.maxChars, 12000);
  const fullText = await readVisiblePageText(page);
  const truncated = fullText.length > maxChars;

  return {
    page: pageInfo,
    text: truncated ? `${fullText.slice(0, maxChars).trimEnd()}...` : fullText,
    truncated,
    extractedAt: new Date().toISOString()
  };
}

export async function searchManagedBrowserPageText(
  query: string,
  options: BrowserPageSearchOptions = {}
): Promise<BrowserPageSearchResult> {
  if (browserAutomationOverrides?.searchPageText) {
    return browserAutomationOverrides.searchPageText(query, options);
  }

  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error("A non-empty browser search query is required.");
  }

  const page = await requireManagedPage();
  const pageInfo = await describePage(page);
  const text = await readVisiblePageText(page);

  return {
    page: pageInfo,
    query: normalizedQuery,
    totalMatches: countSearchMatches(text, normalizedQuery),
    snippets: collectSearchSnippets(
      text,
      normalizedQuery,
      normalizePositiveInteger(options.maxSnippets, 5),
      normalizePositiveInteger(options.snippetRadius, 90)
    ),
    searchedAt: new Date().toISOString()
  };
}

export async function listManagedBrowserClickableElements(
  options: BrowserClickableElementListOptions = {}
): Promise<BrowserClickableElementListResult> {
  if (browserAutomationOverrides?.listClickableElements) {
    return browserAutomationOverrides.listClickableElements(options);
  }

  const page = await requireManagedPage();
  const pageInfo = await describePage(page);
  const maxElements = normalizePositiveInteger(options.maxElements, 20);
  const elements = await page.evaluate((limit) => {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        "a, button, [role='button'], [role='link'], input[type='button'], input[type='submit'], summary"
      )
    );

    const results: Array<{
      text: string;
      tagName: string;
      role?: string;
      href?: string;
      ariaLabel?: string;
    }> = [];

    for (const element of candidates) {
      if (results.length >= limit) {
        break;
      }

      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const text = (
        element.innerText ||
        element.textContent ||
        element.getAttribute("aria-label") ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim();

      if (!text) {
        continue;
      }

      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        style.visibility === "hidden" ||
        style.display === "none"
      ) {
        continue;
      }

      const role = element.getAttribute("role") || undefined;
      const href =
        element instanceof HTMLAnchorElement ? element.href || undefined : undefined;
      const ariaLabel = element.getAttribute("aria-label") || undefined;
      const entry = {
        text,
        tagName: element.tagName.toLowerCase(),
        ...(role ? { role } : {}),
        ...(href ? { href } : {}),
        ...(ariaLabel ? { ariaLabel } : {})
      };

      if (
        !results.some(
          (existing) =>
            existing.text === entry.text &&
            existing.tagName === entry.tagName &&
            existing.href === entry.href
        )
      ) {
        results.push(entry);
      }
    }

    return results;
  }, maxElements);

  return {
    page: pageInfo,
    elements,
    scannedAt: new Date().toISOString()
  };
}

export async function clickManagedBrowserElementByText(
  text: string,
  options: BrowserClickByTextOptions = {}
): Promise<BrowserClickByTextResult> {
  if (browserAutomationOverrides?.clickByText) {
    return browserAutomationOverrides.clickByText(text, options);
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error("A non-empty click target text is required.");
  }

  const page = await requireManagedPage();
  const exact = options.exact ?? false;
  const timeoutMs = normalizePositiveInteger(options.timeoutMs, 5000);

  const clicked = await page.evaluate(
    async ({ targetText, exactMatch, timeout }) => {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          "a, button, [role='button'], [role='link'], input[type='button'], input[type='submit'], summary"
        )
      );

      const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
      const wanted = normalize(targetText).toLowerCase();

      const matches = candidates.filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const textValue = normalize(
          element.innerText ||
            element.textContent ||
            element.getAttribute("aria-label") ||
            ""
        ).toLowerCase();

        if (!textValue) {
          return false;
        }

        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          style.visibility === "hidden" ||
          style.display === "none"
        ) {
          return false;
        }

        return exactMatch ? textValue === wanted : textValue.includes(wanted);
      });

      const target = matches[0];
      if (!target) {
        return null;
      }

      target.scrollIntoView({
        behavior: "instant",
        block: "center",
        inline: "center"
      });

      await new Promise((resolve) => window.setTimeout(resolve, 60));
      target.click();

      await new Promise((resolve) => window.setTimeout(resolve, Math.min(timeout, 300)));

      return normalize(
        target.innerText ||
          target.textContent ||
          target.getAttribute("aria-label") ||
          target.tagName
      );
    },
    {
      targetText: normalizedText,
      exactMatch: exact,
      timeout: timeoutMs
    }
  );

  if (!clicked) {
    throw new Error(`No clickable element matched "${normalizedText}".`);
  }

  markPageActive(page);
  const pageInfo = await describePage(page);

  return {
    page: pageInfo,
    matchedText: clicked,
    exact,
    clickedAt: new Date().toISOString()
  };
}

export async function closeManagedBrowserAutomation(): Promise<void> {
  if (browserAutomationOverrides?.close) {
    await browserAutomationOverrides.close();
    return;
  }

  if (!browserContextPromise) {
    return;
  }

  const context = await browserContextPromise.catch(() => null);
  browserContextPromise = null;
  browserContextListenersAttached = false;
  activeManagedPage = null;

  if (context) {
    await context.close().catch(() => undefined);
  }
}

export function setBrowserAutomationOverridesForTests(
  overrides: BrowserAutomationOverrides | null
): void {
  browserAutomationOverrides = overrides;
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

  const context = await browserContextPromise;

  if (!browserContextListenersAttached) {
    browserContextListenersAttached = true;
    context.on("page", (page) => {
      registerManagedPage(page);
    });
  }

  for (const page of context.pages()) {
    registerManagedPage(page);
  }

  return context;
}

function getBrowserProfileDir(): string {
  const dir = join(getWavearyDataDir(), "browser-profile");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function registerManagedPage(page: Page): void {
  if (!pageLifecycleMetadata.has(page)) {
    const now = new Date().toISOString();
    pageLifecycleMetadata.set(page, {
      openedAt: now,
      lastActiveAt: now
    });
  }

  markPageActive(page);

  page.on("close", () => {
    if (activeManagedPage === page) {
      activeManagedPage = null;
    }
  });

  page.on("load", () => {
    markPageActive(page);
  });
}

function markPageActive(page: Page): void {
  activeManagedPage = page;
  const metadata = pageLifecycleMetadata.get(page);

  if (metadata) {
    metadata.lastActiveAt = new Date().toISOString();
    return;
  }

  const now = new Date().toISOString();
  pageLifecycleMetadata.set(page, {
    openedAt: now,
    lastActiveAt: now
  });
}

async function requireManagedPage(): Promise<Page> {
  const page = await resolveManagedPageOrNull();

  if (!page) {
    throw new Error("No managed browser page is currently open.");
  }

  return page;
}

async function resolveManagedPageOrNull(): Promise<Page | null> {
  const context = await getBrowserContext();
  const candidatePages = context.pages().filter((page) => !page.isClosed());
  const page =
    (activeManagedPage && !activeManagedPage.isClosed() ? activeManagedPage : null) ??
    candidatePages[candidatePages.length - 1] ??
    null;

  if (!page) {
    return null;
  }

  markPageActive(page);
  await safelyBringToFront(page);
  return page;
}

async function describePage(page: Page): Promise<BrowserPageInfo> {
  const title = await safelyReadTitle(page);
  const metadata = pageLifecycleMetadata.get(page);

  return {
    url: page.url(),
    ...(title ? { title } : {}),
    ...(metadata?.openedAt ? { openedAt: metadata.openedAt } : {}),
    ...(metadata?.lastActiveAt ? { lastActiveAt: metadata.lastActiveAt } : {})
  };
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

async function safelyBringToFront(page: Page): Promise<void> {
  try {
    await page.bringToFront();
  } catch {
    // Ignore focus errors and keep the session usable.
  }
}

async function readVisiblePageText(page: Page): Promise<string> {
  const text = await page.evaluate(() => {
    const source =
      document.querySelector("main")?.textContent ||
      document.body?.innerText ||
      document.documentElement?.innerText ||
      "";

    return source;
  });

  return normalizeVisibleText(text);
}

function normalizeVisibleText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function countSearchMatches(text: string, query: string): number {
  const matcher = new RegExp(escapeRegExp(query), "gi");
  let count = 0;

  while (matcher.exec(text)) {
    count += 1;
  }

  return count;
}

function collectSearchSnippets(
  text: string,
  query: string,
  maxSnippets: number,
  snippetRadius: number
): string[] {
  const normalizedText = text.trim();
  const lowerText = normalizedText.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const snippets: string[] = [];
  let startIndex = 0;

  while (snippets.length < maxSnippets) {
    const matchIndex = lowerText.indexOf(lowerQuery, startIndex);
    if (matchIndex < 0) {
      break;
    }

    const snippetStart = Math.max(0, matchIndex - snippetRadius);
    const snippetEnd = Math.min(
      normalizedText.length,
      matchIndex + query.length + snippetRadius
    );
    const snippetCore = normalizedText
      .slice(snippetStart, snippetEnd)
      .replace(/\s+/g, " ")
      .trim();

    if (snippetCore && !snippets.includes(snippetCore)) {
      snippets.push(
        `${snippetStart > 0 ? "..." : ""}${snippetCore}${snippetEnd < normalizedText.length ? "..." : ""}`
      );
    }

    startIndex = matchIndex + Math.max(query.length, 1);
  }

  return snippets;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || !value || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}
