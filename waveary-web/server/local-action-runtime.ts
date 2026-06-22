import {
  PersistentChatSessionState,
  type ChatReplyPayload,
  type ChatSessionSnapshot
} from "./chat-session-store.js";
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

    persistentState.replaceLatestInsights(clearPendingLocalAction(latestInsights));

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
}): ResolveLocalActionResult {
  const persistentState = new PersistentChatSessionState(input.sessionId);

  try {
    const latestInsights = persistentState.getLatestInsights();
    const pending = latestInsights?.pendingLocalAction;

    if (!pending || pending.id !== input.actionId) {
      throw new Error("The requested local action is no longer available.");
    }

    persistentState.replaceLatestInsights(clearPendingLocalAction(latestInsights));

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

function clearPendingLocalAction(latestInsights: ChatReplyPayload): ChatReplyPayload {
  return {
    ...latestInsights,
    pendingLocalAction: null
  };
}
