import type { PendingLocalAction } from "./local-actions.js";

export type LocalActionAuditLocale = "zh" | "en";

export function buildLocalActionAuditNote(
  action: PendingLocalAction,
  resolution: "executed" | "dismissed",
  locale: LocalActionAuditLocale
): string {
  if (locale === "zh") {
    return resolution === "executed"
      ? buildExecutedZhNote(action)
      : buildDismissedZhNote(action);
  }

  return resolution === "executed"
    ? buildExecutedEnNote(action)
    : buildDismissedEnNote(action);
}

export function buildLocalActionFailureNote(
  action: PendingLocalAction,
  locale: LocalActionAuditLocale,
  errorMessage?: string
): string {
  const detail = errorMessage?.trim();

  if (locale === "zh") {
    const prefix =
      action.kind === "browser_extract_text"
        ? "\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u8bfb\u53d6\u5f53\u524d\u9875\u9762"
        : action.kind === "browser_search_text"
          ? `\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u5728\u5f53\u524d\u9875\u9762\u91cc\u627e\u201c${action.targetLabel}\u201d`
          : action.kind === "browser_list_clickable"
            ? "\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u770b\u770b\u5f53\u524d\u9875\u9762\u80fd\u70b9\u4ec0\u4e48"
            : action.kind === "browser_click_text"
              ? `\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u70b9\u201c${action.targetLabel}\u201d`
              : action.kind === "browser_fill_text"
                ? `\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u586b\u5199\u201c${action.targetLabel}\u201d`
                : action.kind === "browser_fill_submit_text"
                  ? `\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u586b\u5199\u5e76\u63d0\u4ea4\u201c${action.targetLabel}\u201d`
                  : action.kind === "browser_open_first_result"
                    ? action.targetLabel === "__first_visible_result__"
                      ? "\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u70b9\u5f00\u5f53\u524d\u7b2c\u4e00\u4e2a\u7ed3\u679c"
                      : `\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u70b9\u5f00\u548c\u201c${action.targetLabel}\u201d\u6700\u8d34\u7684\u7ed3\u679c`
                    : action.kind === "open_folder"
                      ? `\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u6253\u5f00 ${action.targetLabel} \u6587\u4ef6\u5939`
                      : action.kind === "launch_app"
                        ? `\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u542f\u52a8 ${action.targetLabel}`
                        : `\u6211\u521a\u521a\u8bd5\u7740\u66ff\u4f60\u6253\u5f00 ${action.targetLabel}`;

    return detail
      ? `${prefix}\uff0c\u4f46\u8fd9\u6b21\u6ca1\u80fd\u6210\u529f\uff1a${detail}`
      : `${prefix}\uff0c\u4f46\u8fd9\u6b21\u6ca1\u80fd\u6210\u529f\u3002`;
  }

  const prefix =
    action.kind === "browser_extract_text"
      ? "I just tried to read the current page for you"
      : action.kind === "browser_search_text"
        ? `I just tried to search the current page for "${action.targetLabel}"`
        : action.kind === "browser_list_clickable"
          ? "I just tried to inspect the clickable items on the current page for you"
          : action.kind === "browser_click_text"
            ? `I just tried to click "${action.targetLabel}" for you`
            : action.kind === "browser_fill_text"
              ? `I just tried to fill "${action.targetLabel}" for you`
              : action.kind === "browser_fill_submit_text"
                ? `I just tried to fill and submit "${action.targetLabel}" for you`
                : action.kind === "browser_open_first_result"
                  ? action.targetLabel === "__first_visible_result__"
                    ? "I just tried to open the first visible result for you"
                    : `I just tried to open the closest visible result for "${action.targetLabel}"`
                  : action.kind === "open_folder"
                    ? `I just tried to open the ${action.targetLabel} folder for you`
                    : action.kind === "launch_app"
                      ? `I just tried to launch ${action.targetLabel} for you`
                      : `I just tried to open ${action.targetLabel} for you`;

  return detail
    ? `${prefix}, but it did not work this time: ${detail}`
    : `${prefix}, but it did not work this time.`;
}

function buildExecutedZhNote(action: PendingLocalAction): string {
  if (action.kind === "browser_extract_text") {
    return "\u6211\u5df2\u7ecf\u66ff\u4f60\u8bfb\u4e86\u8bfb\u5f53\u524d\u9875\u9762\u3002\u5982\u679c\u4f60\u613f\u610f\uff0c\u6211\u53ef\u4ee5\u7ee7\u7eed\u966a\u4f60\u5f80\u4e0b\u770b\u3002";
  }

  if (action.kind === "browser_search_text") {
    return `\u6211\u5df2\u7ecf\u66ff\u4f60\u5728\u5f53\u524d\u9875\u9762\u91cc\u627e\u201c${action.targetLabel}\u201d\u4e86\u3002\u5982\u679c\u4f60\u613f\u610f\uff0c\u6211\u53ef\u4ee5\u7ee7\u7eed\u5f80\u4e0b\u5e2e\u4f60\u770b\u3002`;
  }

  if (action.kind === "browser_list_clickable") {
    return "\u6211\u5df2\u7ecf\u66ff\u4f60\u770b\u8fc7\u5f53\u524d\u9875\u9762\u80fd\u70b9\u4ec0\u4e48\u4e86\u3002\u4f60\u8981\u662f\u60f3\u7ee7\u7eed\uff0c\u6211\u5c31\u63a5\u7740\u966a\u4f60\u5f80\u4e0b\u8d70\u3002";
  }

  if (action.kind === "browser_click_text") {
    return `\u6211\u5df2\u7ecf\u66ff\u4f60\u70b9\u4e86\u201c${action.targetLabel}\u201d\u3002\u5982\u679c\u4f60\u60f3\u7ee7\u7eed\u4e0b\u4e00\u6b65\uff0c\u6211\u4e5f\u53ef\u4ee5\u63a5\u7740\u6765\u3002`;
  }

  if (action.kind === "browser_fill_text") {
    return `\u6211\u5df2\u7ecf\u66ff\u4f60\u5728\u201c${action.targetLabel}\u201d\u91cc\u586b\u597d\u4e86\u5185\u5bb9\u3002\u5982\u679c\u4f60\u60f3\uff0c\u6211\u4e5f\u53ef\u4ee5\u7ee7\u7eed\u66ff\u4f60\u5f80\u4e0b\u64cd\u4f5c\u3002`;
  }

  if (action.kind === "browser_fill_submit_text") {
    return `\u6211\u5df2\u7ecf\u66ff\u4f60\u586b\u597d\u201c${action.targetLabel}\u201d\uff0c\u4e5f\u5e2e\u4f60\u4e00\u8d77\u63d0\u4ea4\u4e86\u3002\u5982\u679c\u4f60\u60f3\uff0c\u6211\u53ef\u4ee5\u7ee7\u7eed\u966a\u4f60\u770b\u4e0b\u53bb\u3002`;
  }

  if (action.kind === "browser_open_first_result") {
    return action.targetLabel === "__first_visible_result__"
      ? "\u6211\u5df2\u7ecf\u66ff\u4f60\u70b9\u5f00\u4e86\u5f53\u524d\u7ed3\u679c\u9875\u91cc\u7684\u7b2c\u4e00\u4e2a\u7ed3\u679c\u3002\u5982\u679c\u4f60\u60f3\uff0c\u6211\u53ef\u4ee5\u7ee7\u7eed\u966a\u4f60\u770b\u4e0b\u53bb\u3002"
      : `\u6211\u5df2\u7ecf\u66ff\u4f60\u70b9\u5f00\u4e86\u548c\u201c${action.targetLabel}\u201d\u6700\u8d34\u7684\u7ed3\u679c\u3002\u5982\u679c\u4f60\u60f3\uff0c\u6211\u53ef\u4ee5\u7ee7\u7eed\u966a\u4f60\u770b\u4e0b\u53bb\u3002`;
  }

  if (action.kind === "open_url") {
    return `\u6211\u5df2\u7ecf\u66ff\u4f60\u6253\u5f00 ${action.targetLabel} \u4e86\u3002\u4f60\u8981\u662f\u60f3\u7ee7\u7eed\u770b\u4ec0\u4e48\uff0c\u6211\u4e5f\u53ef\u4ee5\u966a\u4f60\u4e00\u8d77\u6162\u6162\u627e\u3002`;
  }

  if (action.kind === "open_folder") {
    return `\u6211\u5df2\u7ecf\u66ff\u4f60\u6253\u5f00 ${action.targetLabel} \u6587\u4ef6\u5939\u4e86\u3002\u4f60\u63a5\u4e0b\u6765\u8981\u627e\u4ec0\u4e48\uff0c\u6211\u4e5f\u53ef\u4ee5\u7ee7\u7eed\u966a\u7740\u4f60\u3002`;
  }

  return `\u6211\u5df2\u7ecf\u66ff\u4f60\u542f\u52a8 ${action.targetLabel} \u4e86\u3002\u8981\u662f\u4f60\u8fd8\u60f3\u7ee7\u7eed\u505a\u4e0b\u4e00\u6b65\uff0c\u5c31\u76f4\u63a5\u544a\u8bc9\u6211\u3002`;
}

function buildDismissedZhNote(action: PendingLocalAction): string {
  if (action.kind === "browser_extract_text") {
    return "\u8fd9\u6b21\u6211\u5148\u4e0d\u53bb\u8bfb\u53d6\u5f53\u524d\u9875\u9762\u3002\u4f60\u60f3\u7ee7\u7eed\u7684\u65f6\u5019\uff0c\u518d\u8ba9\u6211\u6765\u5c31\u597d\u3002";
  }

  if (action.kind === "browser_search_text") {
    return `\u8fd9\u6b21\u6211\u5148\u4e0d\u66ff\u4f60\u5728\u5f53\u524d\u9875\u9762\u91cc\u627e\u201c${action.targetLabel}\u201d\u3002\u4f60\u60f3\u7ee7\u7eed\u7684\u65f6\u5019\uff0c\u518d\u53eb\u6211\u3002`;
  }

  if (action.kind === "browser_list_clickable") {
    return "\u8fd9\u6b21\u6211\u5148\u4e0d\u53bb\u770b\u5f53\u524d\u9875\u9762\u6709\u54ea\u4e9b\u53ef\u70b9\u51fb\u9879\u3002\u4f60\u60f3\u7ee7\u7eed\u7684\u65f6\u5019\uff0c\u518d\u8ba9\u6211\u6765\u3002";
  }

  if (action.kind === "browser_click_text") {
    return `\u8fd9\u6b21\u6211\u5148\u4e0d\u66ff\u4f60\u70b9\u201c${action.targetLabel}\u201d\u3002\u7b49\u4f60\u786e\u5b9a\u4e86\uff0c\u6211\u518d\u7ee7\u7eed\u3002`;
  }

  if (action.kind === "browser_fill_text") {
    return `\u8fd9\u6b21\u6211\u5148\u4e0d\u66ff\u4f60\u586b\u5199\u201c${action.targetLabel}\u201d\u3002\u7b49\u4f60\u786e\u5b9a\u4e86\uff0c\u6211\u518d\u7ee7\u7eed\u3002`;
  }

  if (action.kind === "browser_fill_submit_text") {
    return `\u8fd9\u6b21\u6211\u5148\u4e0d\u66ff\u4f60\u586b\u5199\u5e76\u63d0\u4ea4\u201c${action.targetLabel}\u201d\u3002\u7b49\u4f60\u786e\u5b9a\u4e86\uff0c\u6211\u518d\u7ee7\u7eed\u3002`;
  }

  if (action.kind === "browser_open_first_result") {
    return action.targetLabel === "__first_visible_result__"
      ? "\u8fd9\u6b21\u6211\u5148\u4e0d\u53bb\u70b9\u5f00\u5f53\u524d\u7b2c\u4e00\u4e2a\u7ed3\u679c\u3002\u7b49\u4f60\u786e\u5b9a\u4e86\uff0c\u6211\u518d\u7ee7\u7eed\u3002"
      : `\u8fd9\u6b21\u6211\u5148\u4e0d\u53bb\u70b9\u5f00\u548c\u201c${action.targetLabel}\u201d\u6700\u8d34\u7684\u7ed3\u679c\u3002\u7b49\u4f60\u786e\u5b9a\u4e86\uff0c\u6211\u518d\u7ee7\u7eed\u3002`;
  }

  if (action.kind === "open_url") {
    return `\u8fd9\u6b21\u6211\u5148\u4e0d\u66ff\u4f60\u6253\u5f00 ${action.targetLabel}\u3002\u7b49\u4f60\u60f3\u8981\u7684\u65f6\u5019\uff0c\u518d\u53eb\u6211\u4e00\u58f0\u5c31\u597d\u3002`;
  }

  if (action.kind === "open_folder") {
    return `\u8fd9\u6b21\u6211\u5148\u4e0d\u66ff\u4f60\u6253\u5f00 ${action.targetLabel} \u6587\u4ef6\u5939\u3002\u4f60\u786e\u5b9a\u4e86\uff0c\u518d\u8ba9\u6211\u6765\u3002`;
  }

  return `\u8fd9\u6b21\u6211\u5148\u4e0d\u66ff\u4f60\u542f\u52a8 ${action.targetLabel}\u3002\u7b49\u4f60\u70b9\u5934\u4e86\uff0c\u6211\u518d\u7ee7\u7eed\u3002`;
}

function buildExecutedEnNote(action: PendingLocalAction): string {
  if (action.kind === "browser_extract_text") {
    return "I read the current page for you. If you want, I can stay with you and keep going.";
  }

  if (action.kind === "browser_search_text") {
    return `I searched the current page for "${action.targetLabel}" for you. If you want, I can keep following that thread.`;
  }

  if (action.kind === "browser_list_clickable") {
    return "I checked what can be clicked on the current page for you. Tell me where you want to go next.";
  }

  if (action.kind === "browser_click_text") {
    return `I clicked "${action.targetLabel}" for you. If you want, I can keep going from here too.`;
  }

  if (action.kind === "browser_fill_text") {
    return `I filled "${action.targetLabel}" for you. If you want, I can keep going from there too.`;
  }

  if (action.kind === "browser_fill_submit_text") {
    return `I filled and submitted "${action.targetLabel}" for you. If you want, I can keep going from there too.`;
  }

  if (action.kind === "browser_open_first_result") {
    return action.targetLabel === "__first_visible_result__"
      ? "I opened the first visible result for you. If you want, I can keep going from there too."
      : `I opened the closest visible result for "${action.targetLabel}" for you. If you want, I can keep going from there too.`;
  }

  if (action.kind === "open_url") {
    return `I opened ${action.targetLabel} for you. If you want, I can stay with you and help with the next step too.`;
  }

  if (action.kind === "open_folder") {
    return `I opened the ${action.targetLabel} folder for you. If you want, I can help you keep going from here.`;
  }

  return `I launched ${action.targetLabel} for you. If you want to keep going, just tell me what comes next.`;
}

function buildDismissedEnNote(action: PendingLocalAction): string {
  if (action.kind === "browser_extract_text") {
    return "I did not read the current page this time. Ask me again when you want me to.";
  }

  if (action.kind === "browser_search_text") {
    return `I did not search the current page for "${action.targetLabel}" this time. Ask me again when you want me to.`;
  }

  if (action.kind === "browser_list_clickable") {
    return "I did not inspect the clickable items on the current page this time. Ask me again when you want me to.";
  }

  if (action.kind === "browser_click_text") {
    return `I did not click "${action.targetLabel}" this time. Ask me again when you want me to.`;
  }

  if (action.kind === "browser_fill_text") {
    return `I did not fill "${action.targetLabel}" this time. Ask me again when you want me to.`;
  }

  if (action.kind === "browser_fill_submit_text") {
    return `I did not fill and submit "${action.targetLabel}" this time. Ask me again when you want me to.`;
  }

  if (action.kind === "browser_open_first_result") {
    return action.targetLabel === "__first_visible_result__"
      ? "I did not open the first visible result this time. Ask me again when you want me to."
      : `I did not open the closest visible result for "${action.targetLabel}" this time. Ask me again when you want me to.`;
  }

  if (action.kind === "open_url") {
    return `I did not open ${action.targetLabel} this time. Ask me again when you want it, and I will stay right here.`;
  }

  if (action.kind === "open_folder") {
    return `I did not open the ${action.targetLabel} folder this time. Ask me again when you want it.`;
  }

  return `I did not launch ${action.targetLabel} this time. Ask me again when you want it.`;
}
