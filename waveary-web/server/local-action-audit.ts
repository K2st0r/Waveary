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
        return `已经帮你打开 ${action.targetLabel} 了。你要是想继续看什么，我也可以陪你一起慢慢挑。`;
      }

      if (action.kind === "open_folder") {
        return `已经帮你打开 ${action.targetLabel} 文件夹了。你接下来要找什么，我也可以继续陪着你。`;
      }

      return `已经帮你启动 ${action.targetLabel} 了。要是你还想继续做下一步，就直接告诉我。`;
    }

    if (action.kind === "open_url") {
      return `这次我先不替你打开 ${action.targetLabel}。等你想要的时候，再叫我一声就好。`;
    }

    if (action.kind === "open_folder") {
      return `这次我先不替你打开 ${action.targetLabel} 文件夹。你确定了，再让我来。`;
    }

    return `这次我先不替你启动 ${action.targetLabel}。等你点头了，我再继续。`;
  }

  if (resolution === "executed") {
    if (action.kind === "open_url") {
      return `I opened ${action.targetLabel} for you. If you want, I can stay with you and help with the next step too.`;
    }

    if (action.kind === "open_folder") {
      return `I opened the ${action.targetLabel} folder for you. If you want, I can help you keep going from here.`;
    }

    return `I launched ${action.targetLabel} for you. If you want to keep going, just tell me what comes next.`;
  }

  if (action.kind === "open_url") {
    return `I did not open ${action.targetLabel} this time. Ask me again when you want it, and I will stay right here.`;
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
        ? `我刚刚试着替你打开 ${action.targetLabel} 文件夹`
        : action.kind === "launch_app"
          ? `我刚刚试着替你启动 ${action.targetLabel}`
          : `我刚刚试着替你打开 ${action.targetLabel}`;

    return detail
      ? `${prefix}，但这次没能成功：${detail}`
      : `${prefix}，但这次没能成功。`;
  }

  const prefix =
    action.kind === "open_folder"
      ? `I just tried to open the ${action.targetLabel} folder for you`
      : action.kind === "launch_app"
        ? `I just tried to launch ${action.targetLabel} for you`
        : `I just tried to open ${action.targetLabel} for you`;

  return detail
    ? `${prefix}, but it did not work this time: ${detail}`
    : `${prefix}, but it did not work this time.`;
}
