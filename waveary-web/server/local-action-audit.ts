import type { PendingLocalAction } from "./local-actions.js";

export type LocalActionAuditLocale = "zh" | "en";

export function buildLocalActionAuditNote(
  action: PendingLocalAction,
  resolution: "executed" | "dismissed",
  locale: LocalActionAuditLocale
): string {
  if (locale === "zh") {
    if (resolution === "executed") {
      if (action.kind === "browser_extract_text") {
        return "我已经替你读了读当前页面。如果你愿意，我可以继续陪你往下看。";
      }

      if (action.kind === "browser_search_text") {
        return `我已经替你在当前页面里找过“${action.targetLabel}”了。如果你愿意，我可以继续往下帮你看。`;
      }

      if (action.kind === "browser_list_clickable") {
        return "我已经替你看过当前页面能点什么了。你要是想继续，我就接着陪你往下走。";
      }

      if (action.kind === "browser_click_text") {
        return `我已经替你点了“${action.targetLabel}”。如果你想继续下一步，我也可以接着来。`;
      }

      if (action.kind === "browser_fill_text") {
        return `我已经替你在“${action.targetLabel}”里填好了内容。如果你想，我也可以继续替你往下操作。`;
      }

      if (action.kind === "browser_fill_submit_text") {
        return `我已经替你填好“${action.targetLabel}”，也帮你一起提交了。如果你想，我可以继续陪你看下去。`;
      }

      if (action.kind === "open_url") {
        return `我已经替你打开 ${action.targetLabel} 了。你要是想继续看什么，我也可以陪你一起慢慢找。`;
      }

      if (action.kind === "open_folder") {
        return `我已经替你打开 ${action.targetLabel} 文件夹了。你接下来要找什么，我也可以继续陪着你。`;
      }

      return `我已经替你启动 ${action.targetLabel} 了。要是你还想继续做下一步，就直接告诉我。`;
    }

    if (action.kind === "browser_extract_text") {
      return "这次我先不去读取当前页面。你想继续的时候，再让我来就好。";
    }

    if (action.kind === "browser_search_text") {
      return `这次我先不替你在当前页面里找“${action.targetLabel}”。你想继续的时候，再叫我。`;
    }

    if (action.kind === "browser_list_clickable") {
      return "这次我先不去看当前页面有哪些可点击项。你想继续的时候，再让我来。";
    }

    if (action.kind === "browser_click_text") {
      return `这次我先不替你点“${action.targetLabel}”。等你确定了，我再继续。`;
    }

    if (action.kind === "browser_fill_text") {
      return `这次我先不替你填写“${action.targetLabel}”。等你确定了，我再继续。`;
    }

    if (action.kind === "browser_fill_submit_text") {
      return `这次我先不替你填写并提交“${action.targetLabel}”。等你确定了，我再继续。`;
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

    if (action.kind === "open_url") {
      return `I opened ${action.targetLabel} for you. If you want, I can stay with you and help with the next step too.`;
    }

    if (action.kind === "open_folder") {
      return `I opened the ${action.targetLabel} folder for you. If you want, I can help you keep going from here.`;
    }

    return `I launched ${action.targetLabel} for you. If you want to keep going, just tell me what comes next.`;
  }

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
      action.kind === "browser_extract_text"
        ? "我刚刚试着替你读取当前页面"
        : action.kind === "browser_search_text"
          ? `我刚刚试着替你在当前页面里找“${action.targetLabel}”`
          : action.kind === "browser_list_clickable"
            ? "我刚刚试着替你看看当前页面能点什么"
            : action.kind === "browser_click_text"
            ? `我刚刚试着替你点“${action.targetLabel}”`
            : action.kind === "browser_fill_text"
              ? `我刚刚试着替你填写“${action.targetLabel}”`
            : action.kind === "browser_fill_submit_text"
              ? `我刚刚试着替你填写并提交“${action.targetLabel}”`
            : action.kind === "open_folder"
              ? `我刚刚试着替你打开 ${action.targetLabel} 文件夹`
                : action.kind === "launch_app"
                  ? `我刚刚试着替你启动 ${action.targetLabel}`
                  : `我刚刚试着替你打开 ${action.targetLabel}`;

    return detail ? `${prefix}，但这次没能成功：${detail}` : `${prefix}，但这次没能成功。`;
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
          : action.kind === "open_folder"
            ? `I just tried to open the ${action.targetLabel} folder for you`
              : action.kind === "launch_app"
                ? `I just tried to launch ${action.targetLabel} for you`
                : `I just tried to open ${action.targetLabel} for you`;

  return detail
    ? `${prefix}, but it did not work this time: ${detail}`
    : `${prefix}, but it did not work this time.`;
}
