import {
  PersistentChatSessionState,
  type ChatSessionSnapshot
} from "./chat-session-store.js";
import {
  runPendingLocalAction,
  type ExecutedLocalAction,
  type LocalActionPermissionLevel,
  type PendingLocalAction
} from "./local-actions.js";
import { resetChatRuntimeSession } from "./chat-runtime.js";

type LocalActionAuditLocale = "zh" | "en";

export interface ResolveLocalActionResult {
  session: ChatSessionSnapshot | null;
  result: ExecutedLocalAction | { status: "dismissed"; message: string };
}

export async function executeChatLocalAction(input: {
  sessionId: string;
  actionId: string;
  permission: LocalActionPermissionLevel;
  approved?: boolean;
  locale?: LocalActionAuditLocale;
}): Promise<ResolveLocalActionResult> {
  const persistentState = new PersistentChatSessionState(input.sessionId);

  try {
    const latestInsights = persistentState.getLatestInsights();
    const pending = latestInsights?.pendingLocalAction;

    if (!pending || pending.id !== input.actionId) {
      throw new Error("The requested local action is no longer available.");
    }

    const result = await runPendingLocalAction({
      action: pending,
      permission: input.permission,
      ...(input.approved !== undefined ? { approved: input.approved } : {})
    });

    persistentState.recordLocalActionResolution({
      pendingAction: pending,
      resolution: "executed",
      note: buildLocalActionAuditNote(
        pending,
        "executed",
        input.locale ?? "en"
      )
    });
    resetChatRuntimeSession(input.sessionId);

    return {
      session: persistentState.getSnapshot() ?? null,
      result
    };
  } finally {
    persistentState.close();
  }
}

export function dismissChatLocalAction(input: {
  sessionId: string;
  actionId: string;
  locale?: LocalActionAuditLocale;
}): ResolveLocalActionResult {
  const persistentState = new PersistentChatSessionState(input.sessionId);

  try {
    const latestInsights = persistentState.getLatestInsights();
    const pending = latestInsights?.pendingLocalAction;

    if (!pending || pending.id !== input.actionId) {
      throw new Error("The requested local action is no longer available.");
    }

    persistentState.recordLocalActionResolution({
      pendingAction: pending,
      resolution: "dismissed",
      note: buildLocalActionAuditNote(
        pending,
        "dismissed",
        input.locale ?? "en"
      )
    });
    resetChatRuntimeSession(input.sessionId);

    return {
      session: persistentState.getSnapshot() ?? null,
      result: {
        status: "dismissed",
        message: "Dismissed the pending local action."
      }
    };
  } finally {
    persistentState.close();
  }
}

function buildLocalActionAuditNote(
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
