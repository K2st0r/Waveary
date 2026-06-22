import {
  PersistentChatSessionState,
  type ChatSessionSnapshot
} from "./chat-session-store.js";
import { resetChatRuntimeSession } from "./chat-runtime.js";
import {
  buildLocalActionAuditNote,
  type LocalActionAuditLocale
} from "./local-action-audit.js";
import {
  runPendingLocalAction,
  type ExecutedLocalAction,
  type LocalActionPermissionLevel
} from "./local-actions.js";

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
      locale: input.locale ?? "en",
      ...(input.approved !== undefined ? { approved: input.approved } : {})
    });

    persistentState.recordLocalActionResolution({
      pendingAction: pending,
      resolution: "executed",
      note:
        result.assistantNote ??
        buildLocalActionAuditNote(pending, "executed", input.locale ?? "en")
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
      note: buildLocalActionAuditNote(pending, "dismissed", input.locale ?? "en")
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
