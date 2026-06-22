import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { openManagedBrowserPage } from "./browser-automation.js";

export type LocalActionKind = "open_url" | "open_folder" | "launch_app";
export type LocalActionPermissionLevel = "allow" | "ask" | "deny";

export interface PendingLocalAction {
  id: string;
  kind: LocalActionKind;
  label: string;
  target: string;
  targetLabel: string;
  summary: string;
}

export interface ExecutedLocalAction {
  status: "executed";
  message: string;
}

type LocalActionExecutor = (action: PendingLocalAction) => Promise<ExecutedLocalAction>;

const KNOWN_URLS: Array<{
  pattern: RegExp;
  target: string;
  label: string;
}> = [
  {
    pattern: /(\bbilibili\b|哔哩哔哩|哔哩|b站|bilibili站|哔站)/i,
    target: "https://www.bilibili.com/",
    label: "Bilibili"
  },
  { pattern: /\bgithub\b/i, target: "https://github.com/", label: "GitHub" },
  { pattern: /(\bgoogle\b|谷歌)/i, target: "https://www.google.com/", label: "Google" },
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

export function detectPendingLocalAction(message: string): PendingLocalAction | null {
  const trimmed = message.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();

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
}): Promise<ExecutedLocalAction> {
  if (input.permission === "deny") {
    throw new Error("Local action execution is denied by the current permission setting.");
  }

  if (input.permission === "ask" && input.approved !== true) {
    throw new Error("This local action still requires explicit approval.");
  }

  return localActionExecutor(input.action);
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

function buildPendingLocalAction(
  kind: LocalActionKind,
  target: string,
  targetLabel: string,
  summary: string
): PendingLocalAction {
  return {
    id: `local-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    label: summarizeKind(kind),
    target,
    targetLabel,
    summary
  };
}

function summarizeKind(kind: LocalActionKind): string {
  if (kind === "open_url") {
    return "Open link";
  }

  if (kind === "open_folder") {
    return "Open folder";
  }

  return "Launch app";
}

async function executeLocalAction(action: PendingLocalAction): Promise<ExecutedLocalAction> {
  if (action.kind === "open_url") {
    await openManagedBrowserPage(action.target);

    return {
      status: "executed",
      message: `Opened ${action.targetLabel}.`
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
      message: `Opened ${action.targetLabel}.`
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
      message: `Launched ${action.targetLabel}.`
    };
  }

  throw new Error("Unsupported local action kind.");
}
