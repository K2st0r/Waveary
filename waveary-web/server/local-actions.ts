import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  clickManagedBrowserElementByText,
  extractManagedBrowserPageText,
  fillAndSubmitManagedBrowserInputByText,
  fillManagedBrowserInputByText,
  getManagedBrowserPageInfo,
  listManagedBrowserClickableElements,
  openManagedBrowserFirstVisibleLink,
  openManagedBrowserNthVisibleLink,
  openManagedBrowserPage,
  searchManagedBrowserPageText,
  type BrowserClickableElement,
  type BrowserPageInfo
} from "./browser-automation.js";

export type LocalActionKind =
  | "open_url"
  | "open_folder"
  | "launch_app"
  | "browser_extract_text"
  | "browser_search_text"
  | "browser_list_clickable"
  | "browser_click_text"
  | "browser_fill_text"
  | "browser_fill_submit_text"
  | "browser_open_first_result"
  | "browser_open_result_at_index"
  | "browser_open_bilibili_video";
export type LocalActionPermissionLevel = "allow" | "ask" | "deny";
export type LocalActionLocale = "zh" | "en";

export interface PendingLocalAction {
  id: string;
  kind: LocalActionKind;
  label: string;
  target: string;
  targetLabel: string;
  summary: string;
  value?: string;
  resultIndex?: number;
}

export interface ExecutedLocalAction {
  status: "executed";
  message: string;
  assistantNote?: string;
}

type LocalActionExecutor = (
  action: PendingLocalAction,
  locale?: LocalActionLocale
) => Promise<ExecutedLocalAction>;

interface BrowserOpenResultInstruction {
  query?: string;
  resultIndex: number;
}

const KNOWN_URLS: Array<{
  pattern: RegExp;
  target: string;
  label: string;
}> = [
  {
    pattern: /(\bbilibili\b|哔哩哔哩|哔站|b站)/i,
    target: "https://www.bilibili.com/",
    label: "Bilibili"
  },
  { pattern: /\bgithub\b/i, target: "https://github.com/", label: "GitHub" },
  { pattern: /(\bbing\b|必应)/i, target: "https://www.bing.com/", label: "Bing" },
  { pattern: /(\bgoogle\b|谷歌)/i, target: "https://www.bing.com/", label: "Bing" },
  { pattern: /知乎/i, target: "https://www.zhihu.com/", label: "知乎" },
  { pattern: /(\bweibo\b|微博)/i, target: "https://weibo.com/", label: "微博" },
  { pattern: /(\bwechat\b|微信)/i, target: "https://weixin.qq.com/", label: "WeChat" },
  { pattern: /(\bqq\b|QQ)/i, target: "https://im.qq.com/", label: "QQ" },
  { pattern: /\byoutube\b/i, target: "https://www.youtube.com/", label: "YouTube" }
];

const KNOWN_FOLDERS: Array<{
  pattern: RegExp;
  target: string;
  label: string;
}> = [
  { pattern: /(download(s)?|下载)/i, target: join(homedir(), "Downloads"), label: "Downloads" },
  { pattern: /(desktop|桌面)/i, target: join(homedir(), "Desktop"), label: "Desktop" },
  { pattern: /(document(s)?|文档)/i, target: join(homedir(), "Documents"), label: "Documents" },
  { pattern: /(picture(s)?|photo(s)?|图片|照片)/i, target: join(homedir(), "Pictures"), label: "Pictures" },
  { pattern: /(music|音乐)/i, target: join(homedir(), "Music"), label: "Music" },
  { pattern: /(video(s)?|视频)/i, target: join(homedir(), "Videos"), label: "Videos" },
  { pattern: /(project|repo|workspace|仓库|项目)/i, target: process.cwd(), label: "Waveary workspace" }
];

const KNOWN_APPS: Array<{
  pattern: RegExp;
  target: string;
  label: string;
}> = [
  { pattern: /(notepad|记事本)/i, target: "notepad.exe", label: "Notepad" },
  { pattern: /(calculator|calc|计算器)/i, target: "calc.exe", label: "Calculator" },
  { pattern: /(paint|mspaint|画图)/i, target: "mspaint.exe", label: "Paint" },
  { pattern: /(explorer|文件资源管理器)/i, target: "explorer.exe", label: "File Explorer" }
];

let localActionExecutor: LocalActionExecutor = executeLocalAction;

export async function detectPendingLocalAction(message: string): Promise<PendingLocalAction | null> {
  const trimmed = message.trim();

  if (!trimmed) {
    return null;
  }

  const browserSearchQuery = extractBrowserSearchQuery(trimmed);

  if (browserSearchQuery) {
    return buildPendingLocalAction(
      "browser_search_text",
      browserSearchQuery,
      browserSearchQuery,
      `Search the current page for ${browserSearchQuery}`
    );
  }

  const bilibiliFollowupQuery = await extractBilibiliFollowupQuery(trimmed);
  if (bilibiliFollowupQuery) {
    return buildPendingLocalAction(
      "browser_open_bilibili_video",
      bilibiliFollowupQuery,
      bilibiliFollowupQuery,
      `Find and open a Bilibili video about ${bilibiliFollowupQuery}`
    );
  }

  const normalized = trimmed.toLowerCase();

  if (looksLikeBrowserClickableListIntent(trimmed)) {
    return buildPendingLocalAction(
      "browser_list_clickable",
      "__current_page__",
      "current page",
      "Inspect clickable items on the current page"
    );
  }

  const browserClickTarget = extractBrowserClickTarget(trimmed);
  if (browserClickTarget) {
    return buildPendingLocalAction(
      "browser_click_text",
      browserClickTarget,
      browserClickTarget,
      `Click ${browserClickTarget} on the current page`
    );
  }

  const browserFillTarget = extractBrowserFillInstruction(trimmed);
  if (browserFillTarget) {
    return buildPendingLocalAction(
      browserFillTarget.submitAfterFill
        ? "browser_fill_submit_text"
        : "browser_fill_text",
      browserFillTarget.field,
      browserFillTarget.field,
      browserFillTarget.submitAfterFill
        ? `Fill ${browserFillTarget.field} and submit on the current page`
        : `Fill ${browserFillTarget.field} on the current page`,
      browserFillTarget.value
    );
  }

  const browserOpenResultTarget = extractBrowserOpenResultInstruction(trimmed);
  if (browserOpenResultTarget) {
    if (browserOpenResultTarget.resultIndex > 1) {
      const targetLabel = browserOpenResultTarget.query ?? "__nth_visible_result__";
      return buildPendingLocalAction(
        "browser_open_result_at_index",
        targetLabel,
        targetLabel,
        browserOpenResultTarget.query
          ? `Open the ${formatVisibleResultOrdinal(browserOpenResultTarget.resultIndex, "en")} visible result for ${browserOpenResultTarget.query}`
          : `Open the ${formatVisibleResultOrdinal(browserOpenResultTarget.resultIndex, "en")} visible result`,
        undefined,
        browserOpenResultTarget.resultIndex
      );
    }

    const targetLabel = browserOpenResultTarget.query ?? "__first_visible_result__";
    return buildPendingLocalAction(
      "browser_open_first_result",
      targetLabel,
      targetLabel,
      browserOpenResultTarget.query
        ? `Open the first visible result for ${browserOpenResultTarget.query}`
        : "Open the first visible result"
    );
  }

  if (looksLikeBrowserReadIntent(trimmed)) {
    return buildPendingLocalAction(
      "browser_extract_text",
      "__current_page__",
      "current page",
      "Read the current page"
    );
  }

  if (!looksLikeOpenIntent(normalized)) {
    return null;
  }

  const explicitUrlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
  if (explicitUrlMatch) {
    const target = explicitUrlMatch[0];
    return buildPendingLocalAction("open_url", target, target, `Open ${target}`);
  }

  for (const entry of KNOWN_URLS) {
    if (entry.pattern.test(trimmed)) {
      return buildPendingLocalAction("open_url", entry.target, entry.label, `Open ${entry.label}`);
    }
  }

  for (const entry of KNOWN_FOLDERS) {
    if (entry.pattern.test(trimmed) && existsSync(entry.target)) {
      return buildPendingLocalAction(
        "open_folder",
        entry.target,
        entry.label,
        `Open ${entry.label} folder`
      );
    }
  }

  for (const entry of KNOWN_APPS) {
    if (entry.pattern.test(trimmed)) {
      return buildPendingLocalAction(
        "launch_app",
        entry.target,
        entry.label,
        `Launch ${entry.label}`
      );
    }
  }

  return null;
}

export async function runPendingLocalAction(input: {
  action: PendingLocalAction;
  permission: LocalActionPermissionLevel;
  approved?: boolean;
  locale?: LocalActionLocale;
}): Promise<ExecutedLocalAction> {
  if (input.permission === "deny") {
    throw new Error("Local action execution is denied by the current permission setting.");
  }

  if (input.permission === "ask" && input.approved !== true) {
    throw new Error("This local action still requires explicit approval.");
  }

  return localActionExecutor(input.action, input.locale ?? "en");
}

export function setLocalActionExecutorForTests(executor: LocalActionExecutor | null): void {
  localActionExecutor = executor ?? executeLocalAction;
}

function looksLikeOpenIntent(normalized: string): boolean {
  return (
    normalized.includes("打开") ||
    normalized.includes("帮我打开") ||
    normalized.includes("给我打开") ||
    normalized.includes("替我打开") ||
    normalized.includes("open ") ||
    normalized.startsWith("open") ||
    normalized.includes("launch ") ||
    normalized.includes("run ") ||
    normalized.includes("start ")
  );
}

function looksLikeBrowserReadIntent(message: string): boolean {
  return (
    /(read|extract|scan|summari[sz]e).*(page|site)|what does (this|the) page say|read (this|the) page/i.test(
      message
    ) ||
    /(读取|提取|看看|读一下).*(当前页面|这个页面|网页).*(文字|内容|写了什么|说了什么)?/.test(message) ||
    /(当前页面|这个页面|网页).*(写了什么|说了什么|内容|文字)/.test(message)
  );
}

function looksLikeBrowserClickableListIntent(message: string): boolean {
  return (
    /(what can i click|what can be clicked|clickable elements|clickable things|buttons? on (this|the) page|links? on (this|the) page)/i.test(
      message
    ) ||
    /(当前页面|这个页面|网页).*(能点什么|可以点什么|有哪些.*(按钮|链接)|有什么.*能点)/.test(message) ||
    /(看看|列出).*(当前页面|这个页面|网页).*(按钮|链接|可点击)/.test(message)
  );
}

function extractBrowserSearchQuery(message: string): string | null {
  const englishPatterns = [
    /search (?:this|the) page for ["“]?(.+?)["”]?$/i,
    /find ["“]?(.+?)["”]? on (?:this|the) page$/i,
    /look for ["“]?(.+?)["”]? on (?:this|the) page$/i
  ];
  const chinesePatterns = [
    /(?:在|帮我在)?(?:当前页面|这个页面|网页)(?:里|中|上)?(?:搜索|查找)["“]?(.+?)["”]?$/,
    /(?:搜索|查找)(?:当前页面|这个页面|网页)(?:里|中|上)?的["“]?(.+?)["”]?$/,
    /(?:搜索|查找)["“]?(.+?)["”]?(?:在|于)(?:当前页面|这个页面|网页)(?:里|中|上)?$/
  ];

  for (const pattern of [...englishPatterns, ...chinesePatterns]) {
    const match = message.match(pattern);
    const query = match?.[1]?.trim();

    if (query) {
      return stripTrailingPunctuation(query);
    }
  }

  return null;
}

function extractBrowserClickTarget(message: string): string | null {
  const englishPatterns = [
    /^click(?: on)? ["“]?(.+?)["”]?(?: button| link)?$/i,
    /^press ["“]?(.+?)["”]?$/i
  ];
  const chinesePatterns = [
    /^点击["“]?(.+?)["”]?(?:按钮|链接)?$/,
    /^帮我点击["“]?(.+?)["”]?(?:按钮|链接)?$/,
    /^点一下["“]?(.+?)["”]?(?:按钮|链接)?$/
  ];

  for (const pattern of [...englishPatterns, ...chinesePatterns]) {
    const match = message.match(pattern);
    const target = match?.[1]?.trim();

    if (target) {
      return stripTrailingPunctuation(target);
    }
  }

  return null;
}

function extractBrowserFillInstruction(
  message: string
): { field: string; value: string; submitAfterFill: boolean } | null {
  const englishPatterns = [
    {
      pattern:
        /^(?:fill|type in|enter)\s+["“]?(.+?)["”]?\s+(?:with|as)\s+["“]?(.+?)["”]?\s+(?:and\s+)?(?:submit|press enter)$/i,
      submitAfterFill: true
    },
    {
      pattern:
        /^(?:set)\s+["“]?(.+?)["”]?\s+to\s+["“]?(.+?)["”]?\s+(?:and\s+)?(?:submit|press enter)$/i,
      submitAfterFill: true
    },
    {
      pattern:
        /^(?:fill|type in|enter)\s+["“]?(.+?)["”]?\s+(?:with|as)\s+["“]?(.+?)["”]?$/i,
      submitAfterFill: false
    },
    {
      pattern: /^(?:set)\s+["“]?(.+?)["”]?\s+to\s+["“]?(.+?)["”]?$/i,
      submitAfterFill: false
    }
  ];
  const chinesePatterns = [
    {
      pattern:
        /^在["“]?(.+?)["”]?(?:里|中)?(?:输入|填写)["“]?(.+?)["”]?(?:然后|再)?(?:提交|回车|按回车)$/,
      submitAfterFill: true
    },
    {
      pattern:
        /^把["“]?(.+?)["”]?(?:设置为|改成|填成)["“]?(.+?)["”]?(?:然后|再)?(?:提交|回车|按回车)$/,
      submitAfterFill: true
    },
    {
      pattern:
        /^给["“]?(.+?)["”]?(?:输入|填写)["“]?(.+?)["”]?(?:然后|再)?(?:提交|回车|按回车)$/,
      submitAfterFill: true
    },
    {
      pattern: /^在["“]?(.+?)["”]?(?:里|中)?(?:输入|填写)["“]?(.+?)["”]?$/,
      submitAfterFill: false
    },
    {
      pattern: /^把["“]?(.+?)["”]?(?:设置为|改成|填成)["“]?(.+?)["”]?$/,
      submitAfterFill: false
    },
    {
      pattern: /^给["“]?(.+?)["”]?(?:输入|填写)["“]?(.+?)["”]?$/,
      submitAfterFill: false
    }
  ];

  for (const entry of [...englishPatterns, ...chinesePatterns]) {
    const match = message.match(entry.pattern);
    const field = match?.[1]?.trim();
    const value = match?.[2]?.trim();

    if (field && value) {
      return {
        field: stripTrailingPunctuation(field),
        value: stripTrailingPunctuation(value),
        submitAfterFill: entry.submitAfterFill
      };
    }
  }

  return null;
}

function extractBrowserOpenResultInstruction(message: string): BrowserOpenResultInstruction | null {
  const englishPatterns: Array<{
    pattern: RegExp;
    resultIndex: number;
  }> = [
    {
      pattern:
        /^(?:open|click)\s+(?:the\s+)?(?:1st|first)\s+(?:search\s+)?result(?:\s+for\s+["“]?(.+?)["”]?)?$/i,
      resultIndex: 1
    },
    {
      pattern:
        /^(?:open|click)\s+(?:the\s+)?(?:2nd|second)\s+(?:search\s+)?result(?:\s+for\s+["“]?(.+?)["”]?)?$/i,
      resultIndex: 2
    },
    {
      pattern:
        /^(?:open|click)\s+(?:the\s+)?(?:3rd|third)\s+(?:search\s+)?result(?:\s+for\s+["“]?(.+?)["”]?)?$/i,
      resultIndex: 3
    },
    {
      pattern: /^(?:open|click)\s+(?:the\s+)?first\s+(?:search\s+)?result(?:\s+for\s+["“]?(.+?)["”]?)?$/i,
      resultIndex: 1
    },
    {
      pattern: /^(?:open|click)\s+(?:the\s+)?result\s+for\s+["“]?(.+?)["”]?$/i,
      resultIndex: 1
    }
  ];
  const chinesePatterns: Array<{
    pattern: RegExp;
    resultIndex: number;
  }> = [
    {
      pattern: /^打开(?:第(?:1|一)|第一个)?(?:搜索)?结果(?:，|,| )?(?:关于|有关)?["“]?(.+?)["”]?$/,
      resultIndex: 1
    },
    {
      pattern: /^打开第(?:2|二)个(?:搜索)?结果(?:，|,| )?(?:关于|有关)?["“]?(.+?)["”]?$/,
      resultIndex: 2
    },
    {
      pattern: /^打开第(?:3|三)个(?:搜索)?结果(?:，|,| )?(?:关于|有关)?["“]?(.+?)["”]?$/,
      resultIndex: 3
    },
    {
      pattern: /^点开(?:第(?:1|一)|第一个)?(?:搜索)?结果(?:，|,| )?(?:关于|有关)?["“]?(.+?)["”]?$/,
      resultIndex: 1
    },
    {
      pattern: /^点开第(?:2|二)个(?:搜索)?结果(?:，|,| )?(?:关于|有关)?["“]?(.+?)["”]?$/,
      resultIndex: 2
    },
    {
      pattern: /^点开第(?:3|三)个(?:搜索)?结果(?:，|,| )?(?:关于|有关)?["“]?(.+?)["”]?$/,
      resultIndex: 3
    },
    {
      pattern: /^打开第一个结果$/,
      resultIndex: 1
    },
    {
      pattern: /^点开第一个结果$/,
      resultIndex: 1
    }
  ];

  for (const entry of englishPatterns) {
    const match = message.match(entry.pattern);
    const query = match?.[1]?.trim();

    if (match) {
      return query
        ? {
            query: stripTrailingPunctuation(query),
            resultIndex: entry.resultIndex
          }
        : {
            resultIndex: entry.resultIndex
          };
    }
  }

  for (const entry of chinesePatterns) {
    const match = message.match(entry.pattern);
    const query = match?.[1]?.trim();

    if (match) {
      return query
        ? {
            query: stripTrailingPunctuation(query),
            resultIndex: entry.resultIndex
          }
        : {
            resultIndex: entry.resultIndex
          };
    }
  }

  return null;
}

async function extractBilibiliFollowupQuery(message: string): Promise<string | null> {
  const match =
    message.match(/^(?:看|搜|找|查)(.+)$/) ||
    message.match(/^(?:看看|搜搜|找找)(.+)$/) ||
    message.match(/^(?:watch|search|find)\s+(.+)$/i);

  const query = match?.[1]?.trim();
  if (!query) {
    return null;
  }

  const page = await getManagedBrowserPageInfo();
  if (!page?.url || !/bilibili\.com/i.test(page.url)) {
    return null;
  }

  return stripTrailingPunctuation(query);
}

function buildPendingLocalAction(
  kind: LocalActionKind,
  target: string,
  targetLabel: string,
  summary: string,
  value?: string,
  resultIndex?: number
): PendingLocalAction {
  return {
    id: `local-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    label: summarizeKind(kind),
    target,
    targetLabel,
    summary,
    ...(resultIndex !== undefined ? { resultIndex } : {}),
    ...(value !== undefined ? { value } : {})
  };
}

function summarizeKind(kind: LocalActionKind): string {
  if (kind === "open_url") {
    return "Open link";
  }

  if (kind === "open_folder") {
    return "Open folder";
  }

  if (kind === "launch_app") {
    return "Launch app";
  }

  if (kind === "browser_extract_text") {
    return "Read page";
  }

  if (kind === "browser_search_text") {
    return "Search page";
  }

  if (kind === "browser_list_clickable") {
    return "Inspect clickable items";
  }

  if (kind === "browser_fill_text") {
    return "Fill page input";
  }

  if (kind === "browser_fill_submit_text") {
    return "Fill and submit page input";
  }

  if (kind === "browser_open_first_result") {
    return "Open page result";
  }

  if (kind === "browser_open_result_at_index") {
    return "Open page result";
  }

  if (kind === "browser_open_bilibili_video") {
    return "Open Bilibili video";
  }

  return "Click page item";
}

async function executeLocalAction(
  action: PendingLocalAction,
  locale: LocalActionLocale = "en"
): Promise<ExecutedLocalAction> {
  if (action.kind === "open_url") {
    await openManagedBrowserPage(action.target);

    return {
      status: "executed",
      message: locale === "zh" ? `已打开 ${action.targetLabel}。` : `Opened ${action.targetLabel}.`
    };
  }

  if (action.kind === "open_folder") {
    if (!existsSync(action.target)) {
      throw new Error("The requested folder is no longer available.");
    }

    spawn("explorer.exe", [action.target], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    }).unref();

    return {
      status: "executed",
      message: locale === "zh" ? `已打开 ${action.targetLabel}。` : `Opened ${action.targetLabel}.`
    };
  }

  if (action.kind === "launch_app") {
    spawn(action.target, [], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    }).unref();

    return {
      status: "executed",
      message: locale === "zh" ? `已启动 ${action.targetLabel}。` : `Launched ${action.targetLabel}.`
    };
  }

  if (action.kind === "browser_extract_text") {
    const result = await extractManagedBrowserPageText({
      maxChars: 1200
    });

    return {
      status: "executed",
      message: locale === "zh" ? "已读取当前页面。" : "Read the current page.",
      assistantNote: buildBrowserExtractAssistantNote(result.page, result.text, locale)
    };
  }

  if (action.kind === "browser_search_text") {
    const result = await searchManagedBrowserPageText(action.target, {
      maxSnippets: 3,
      snippetRadius: 48
    });

    return {
      status: "executed",
      message:
        locale === "zh"
          ? `已在当前页面搜索“${action.targetLabel}”。`
          : `Searched the current page for "${action.targetLabel}".`,
      assistantNote: buildBrowserSearchAssistantNote(
        result.page,
        action.targetLabel,
        result.totalMatches,
        result.snippets,
        locale
      )
    };
  }

  if (action.kind === "browser_list_clickable") {
    const result = await listManagedBrowserClickableElements({
      maxElements: 8
    });

    return {
      status: "executed",
      message:
        locale === "zh" ? "已查看当前页面可点击项。" : "Checked clickable items on the current page.",
      assistantNote: buildBrowserClickableListAssistantNote(result.page, result.elements, locale)
    };
  }

  if (action.kind === "browser_click_text") {
    const result = await clickManagedBrowserElementByText(action.target, {
      timeoutMs: 4000
    });

    return {
      status: "executed",
      message:
        locale === "zh"
          ? `已点击“${result.matchedText}”。`
          : `Clicked "${result.matchedText}".`,
      assistantNote: buildBrowserClickAssistantNote(result.page, result.matchedText, locale)
    };
  }

  if (action.kind === "browser_fill_text") {
    const nextValue = action.value?.trim();

    if (!nextValue) {
      throw new Error("No input value was provided for this page field.");
    }

    const result = await fillManagedBrowserInputByText(action.target, nextValue, {
      timeoutMs: 4000
    });

    return {
      status: "executed",
      message:
        locale === "zh"
          ? `已在“${result.matchedText}”中填写内容。`
          : `Filled "${result.matchedText}".`,
      assistantNote: buildBrowserFillAssistantNote(
        result.page,
        result.matchedText,
        result.value,
        locale
      )
    };
  }

  if (action.kind === "browser_fill_submit_text") {
    const nextValue = action.value?.trim();

    if (!nextValue) {
      throw new Error("No input value was provided for this page field.");
    }

    const result = await fillAndSubmitManagedBrowserInputByText(
      action.target,
      nextValue,
      {
        timeoutMs: 4000
      }
    );

    return {
      status: "executed",
      message:
        locale === "zh"
          ? `已填写并提交“${result.matchedText}”。`
          : `Filled and submitted "${result.matchedText}".`,
      assistantNote: buildBrowserFillSubmitAssistantNote(
        result.page,
        result.matchedText,
        result.value,
        locale
      )
    };
  }

  if (action.kind === "browser_open_first_result") {
    const result = await openManagedBrowserFirstVisibleLink({
      hrefIncludes: "",
      ...(action.target !== "__first_visible_result__"
        ? { textIncludes: action.target }
        : {}),
      timeoutMs: 4000
    });

    return {
      status: "executed",
      message:
        locale === "zh"
          ? action.target === "__first_visible_result__"
            ? "已替你打开当前页面里的第一个结果。"
            : `已替你打开和“${action.targetLabel}”最贴近的结果。`
          : action.target === "__first_visible_result__"
            ? "Opened the first visible result."
            : `Opened the closest visible result for "${action.targetLabel}".`,
      assistantNote: buildBrowserOpenResultAssistantNote(
        result.page,
        result.matchedText,
        action.targetLabel,
        locale
      )
    };
  }

  if (action.kind === "browser_open_result_at_index") {
    const resultIndex = action.resultIndex ?? 2;
    const result = await openManagedBrowserNthVisibleLink({
      hrefIncludes: "",
      ...(action.target !== "__nth_visible_result__"
        ? { textIncludes: action.target }
        : {}),
      resultIndex,
      timeoutMs: 4000
    });

    return {
      status: "executed",
      message:
        locale === "zh"
          ? `已打开第${resultIndex}个可见结果。`
          : `Opened the ${formatVisibleResultOrdinal(resultIndex, "en")} visible result.`,
      assistantNote: buildBrowserOpenResultAssistantNote(
        result.page,
        result.matchedText,
        action.targetLabel,
        locale,
        result.resultIndex ?? resultIndex
      )
    };
  }

  if (action.kind === "browser_open_bilibili_video") {
    const query = action.targetLabel;
    const searchUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(query)}`;
    await openManagedBrowserPage(searchUrl);
    const result = await openManagedBrowserFirstVisibleLink({
      hrefIncludes: "/video/"
    });

    return {
      status: "executed",
      message:
        locale === "zh"
          ? `已替你找一个和“${query}”有关的 Bilibili 视频并打开了。`
          : `Found and opened a Bilibili video about "${query}".`,
      assistantNote: buildBilibiliOpenAssistantNote(result.page, result.matchedText, query, locale)
    };
  }

  throw new Error("Unsupported local action kind.");
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[。！!？?,，.]+$/u, "").trim();
}

function buildBrowserExtractAssistantNote(
  page: BrowserPageInfo,
  text: string,
  locale: LocalActionLocale
): string {
  const pageRef = describePage(page, locale);
  const excerpt = clipText(text, 140);

  if (!excerpt) {
    return locale === "zh"
      ? `我看了一下${pageRef}，但这一屏还没有特别清晰的可读文字。`
      : `I checked ${pageRef} for you, but there is not much clearly readable text visible right now.`;
  }

  return locale === "zh"
    ? `我已经替你看了看${pageRef}。现在最显眼的内容大致是：“${excerpt}” 如果你愿意，我也可以继续帮你找某一句。`
    : `I read ${pageRef} for you. The most visible part right now begins like: "${excerpt}" If you want, I can keep looking for a specific line too.`;
}

function buildBrowserSearchAssistantNote(
  page: BrowserPageInfo,
  query: string,
  totalMatches: number,
  snippets: string[],
  locale: LocalActionLocale
): string {
  const pageRef = describePage(page, locale);

  if (totalMatches <= 0 || snippets.length === 0) {
    return locale === "zh"
      ? `我替你在${pageRef}里找过“${query}”了，但目前没有看到明显匹配的内容。`
      : `I searched ${pageRef} for "${query}", but I could not see a clear match right now.`;
  }

  const snippetPreview = snippets
    .slice(0, 2)
    .map((snippet) => `“${clipText(snippet, 80)}”`)
    .join(locale === "zh" ? "、" : "; ");

  return locale === "zh"
    ? `我替你在${pageRef}里找了“${query}”。现在能看到 ${totalMatches} 处匹配，比较靠前的是 ${snippetPreview}。如果你愿意，我也可以继续替你点进去。`
    : `I searched ${pageRef} for "${query}" and found ${totalMatches} visible match${totalMatches === 1 ? "" : "es"}. The clearest ones right now are ${snippetPreview}. If you want, I can keep going from there too.`;
}

function buildBrowserClickableListAssistantNote(
  page: BrowserPageInfo,
  elements: BrowserClickableElement[],
  locale: LocalActionLocale
): string {
  const pageRef = describePage(page, locale);

  if (elements.length === 0) {
    return locale === "zh"
      ? `我看了一下${pageRef}，但这一屏暂时没有特别明确的可点击项。`
      : `I checked ${pageRef} for you, but I cannot clearly see any clickable items on this view yet.`;
  }

  const visibleItems = elements.slice(0, 5).map((element) => `“${clipText(element.text, 36)}”`);
  const extraCount = Math.max(0, elements.length - visibleItems.length);
  const itemText = visibleItems.join(locale === "zh" ? "、" : ", ");

  return locale === "zh"
    ? `我替你看了看${pageRef}。现在比较清楚能点的有 ${itemText}${extraCount > 0 ? `，另外还有 ${extraCount} 个` : ""}。你告诉我想点哪一个，我就继续。`
    : `I checked ${pageRef} for you. The clearest clickable options right now are ${itemText}${extraCount > 0 ? `, plus ${extraCount} more` : ""}. Tell me which one you want next, and I will keep going.`;
}

function buildBrowserClickAssistantNote(
  page: BrowserPageInfo,
  matchedText: string,
  locale: LocalActionLocale
): string {
  const pageRef = describePage(page, locale);

  return locale === "zh"
    ? `我已经替你点了“${matchedText}”。现在页面来到了${pageRef}，如果你想，我可以继续陪你往下走。`
    : `I clicked "${matchedText}" for you. The page is now at ${pageRef}, and I can keep going with you if you want.`;
}

function buildBrowserFillAssistantNote(
  page: BrowserPageInfo,
  matchedText: string,
  value: string,
  locale: LocalActionLocale
): string {
  const pageRef = describePage(page, locale);

  return locale === "zh"
    ? `我已经替你在${pageRef}里的“${matchedText}”填上了“${clipText(value, 40)}”。如果你愿意，我还可以继续帮你点下一步。`
    : `I filled "${matchedText}" on ${pageRef} with "${clipText(value, 40)}". If you want, I can keep going and handle the next step too.`;
}

function buildBrowserFillSubmitAssistantNote(
  page: BrowserPageInfo,
  matchedText: string,
  value: string,
  locale: LocalActionLocale
): string {
  const pageRef = describePage(page, locale);

  return locale === "zh"
    ? `我已经替你在${pageRef}里的“${matchedText}”填上了“${clipText(value, 40)}”，并顺手提交出去了。如果你愿意，我可以继续陪你看结果。`
    : `I filled "${matchedText}" on ${pageRef} with "${clipText(value, 40)}" and submitted it for you. If you want, I can stay with you and look at the result next.`;
}

function buildBrowserOpenResultAssistantNote(
  page: BrowserPageInfo,
  matchedText: string,
  targetLabel: string,
  locale: LocalActionLocale,
  resultIndex?: number
): string {
  const pageRef = describePage(page, locale);
  const isGenericFirstResult = targetLabel === "__first_visible_result__";
  const isGenericNthResult = targetLabel === "__nth_visible_result__";
  const visibleResultIndex = resultIndex ?? 1;
  const ordinal = formatVisibleResultOrdinal(visibleResultIndex, locale);

  return locale === "zh"
    ? isGenericFirstResult && visibleResultIndex === 1
      ? `我已经替你点开了当前结果页里最先出现的那一项，打开的是「${matchedText}」。现在页面来到${pageRef}，如果你愿意，我可以继续陪你往下看。`
      : `我已经替你点开了第${visibleResultIndex}个可见结果，打开的是「${matchedText}」。现在页面来到${pageRef}，如果你愿意，我可以继续陪你往下看。`
    : visibleResultIndex === 1
      ? isGenericFirstResult
        ? `I opened the first visible result for you, and it led to "${matchedText}". We are at ${pageRef} now, and I can keep going with you if you want.`
        : `I opened the visible result that best matched "${targetLabel}" for you, and it led to "${matchedText}". We are at ${pageRef} now, and I can keep going with you if you want.`
      : isGenericFirstResult
        ? `I opened the ${ordinal} visible result for you, and it led to "${matchedText}". We are at ${pageRef} now, and I can keep going with you if you want.`
        : isGenericNthResult
          ? `I opened the ${ordinal} visible result for you, and it led to "${matchedText}". We are at ${pageRef} now, and I can keep going with you if you want.`
          : `I opened the ${ordinal} visible result that best matched "${targetLabel}" for you, and it led to "${matchedText}". We are at ${pageRef} now, and I can keep going with you if you want.`;
}

function formatVisibleResultOrdinal(value: number, locale: LocalActionLocale): string {
  const normalized = Math.max(1, Math.floor(value));

  if (locale === "zh") {
    return `第${normalized}`;
  }

  const suffix =
    normalized % 100 >= 11 && normalized % 100 <= 13
      ? "th"
      : normalized % 10 === 1
        ? "st"
        : normalized % 10 === 2
          ? "nd"
          : normalized % 10 === 3
            ? "rd"
            : "th";

  return `${normalized}${suffix}`;
}

function buildBilibiliOpenAssistantNote(
  page: BrowserPageInfo,
  matchedText: string,
  query: string,
  locale: LocalActionLocale
): string {
  const pageRef = describePage(page, locale);

  return locale === "zh"
    ? `我已经替你在 Bilibili 里顺着“${query}”找了一个视频，并打开了「${matchedText}」。现在就在${pageRef}，如果你愿意，我还能继续陪你往下挑。`
    : `I followed "${query}" on Bilibili and opened "${matchedText}" for you. We are at ${pageRef} now, and I can keep browsing with you if you want.`;
}

function describePage(page: BrowserPageInfo, locale: LocalActionLocale): string {
  if (page.title?.trim()) {
    return locale === "zh" ? `「${page.title.trim()}」` : `"${page.title.trim()}"`;
  }

  if (page.url?.trim()) {
    return page.url.trim();
  }

  return locale === "zh" ? "当前页面" : "the current page";
}

function clipText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
