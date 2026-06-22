import type { PendingLocalAction } from "./local-actions.js";

export type LocalActionAuditLocale = "zh" | "en";

export function buildLocalActionAuditNote(
  action: PendingLocalAction,
  resolution: "executed" | "dismissed",
  locale: LocalActionAuditLocale
): string {
  if (locale === "zh") {
    if (resolution === "executed") {
      if (action.kind === "open_url") {
        return `我已经替你打开了 ${action.targetLabel}。`;
      }

      if (action.kind === "open_folder") {
        return `我已经替你打开了 ${action.targetLabel} 文件夹。`;
      }

      return `我已经替你启动了 ${action.targetLabel}。`;
    }

    if (action.kind === "open_url") {
      return `这次我先不替你打开 ${action.targetLabel}，等你想要时再叫我。`;
    }

    if (action.kind === "open_folder") {
      return `这次我先不替你打开 ${action.targetLabel} 文件夹，等你确定时再叫我。`;
    }

    return `这次我先不替你启动 ${action.targetLabel}，等你确定时再叫我。`;
  }

  if (resolution === "executed") {
    if (action.kind === "open_url") {
      return `I opened ${action.targetLabel} for you.`;
    }

    if (action.kind === "open_folder") {
      return `I opened the ${action.targetLabel} folder for you.`;
    }

    return `I launched ${action.targetLabel} for you.`;
  }

  if (action.kind === "open_url") {
    return `I did not open ${action.targetLabel} this time. Ask me again when you want it.`;
  }

  if (action.kind === "open_folder") {
    return `I did not open the ${action.targetLabel} folder this time. Ask me again when you want it.`;
  }

  return `I did not launch ${action.targetLabel} this time. Ask me again when you want it.`;
}

export function buildLocalActionFailureNote(
  action: PendingLocalAction,
  locale: LocalActionAuditLocale,
  errorMessage?: string
): string {
  const detail = errorMessage?.trim();

  if (locale === "zh") {
    const prefix =
      action.kind === "open_folder"
        ? `我试着替你打开 ${action.targetLabel} 文件夹`
        : action.kind === "launch_app"
          ? `我试着替你启动 ${action.targetLabel}`
          : `我试着替你打开 ${action.targetLabel}`;

    return detail ? `${prefix}，但这次没有成功：${detail}` : `${prefix}，但这次没有成功。`;
  }

  const prefix =
    action.kind === "open_folder"
      ? `I tried to open the ${action.targetLabel} folder for you`
      : action.kind === "launch_app"
        ? `I tried to launch ${action.targetLabel} for you`
        : `I tried to open ${action.targetLabel} for you`;

  return detail ? `${prefix}, but it did not work this time: ${detail}` : `${prefix}, but it did not work this time.`;
}
