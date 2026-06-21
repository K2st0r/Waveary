export type Locale = "zh" | "en";
export type PermissionLevel = "deny" | "ask" | "allow";

export interface WavearyPermissionProfile {
  browserNotifications: PermissionLevel;
  proactiveNotifications: PermissionLevel;
  timeAwareness: PermissionLevel;
  desktopPresence: PermissionLevel;
  localActions: PermissionLevel;
}

export interface ProactiveCareDecision {
  shouldReachOut: boolean;
  reasons: string[];
  evaluatedAt: string;
  intent?:
    | "check_in"
    | "meal_care"
    | "sleep_care"
    | "stress_followup"
    | "absence_reachout"
    | "milestone_recall"
    | "gentle_reminder"
    | "celebration"
    | "comfort";
  urgency?: "low" | "medium" | "high";
  suggestedDelayMinutes?: number;
}

export type ProactiveDayPart =
  | "late_night"
  | "morning"
  | "afternoon"
  | "evening";

export interface ProactiveMessageDraft {
  tone: "gentle" | "steady" | "warm" | "hold";
  deliveryKind: "check_in" | "care" | "comfort" | "wait";
  lead: string;
  title: string;
  body: string;
  suggestedMessage: string;
}

export function resolveNotificationDayPart(
  permissionProfile: WavearyPermissionProfile
): ProactiveDayPart | undefined {
  if (permissionProfile.timeAwareness !== "allow") {
    return undefined;
  }

  const hour = new Date().getHours();

  if (hour < 5) {
    return "late_night";
  }

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "evening";
}

export function buildProactiveMessageDraft(
  decision: ProactiveCareDecision,
  locale: Locale,
  dayPart: ProactiveDayPart | undefined
): ProactiveMessageDraft {
  if (decision.shouldReachOut) {
    if (locale === "zh") {
      if (dayPart === "late_night") {
        return {
          tone: "gentle",
          deliveryKind: decision.intent === "sleep_care" ? "care" : "check_in",
          lead:
            decision.intent === "sleep_care"
              ? "已经很晚了，我想轻轻提醒你照顾好自己。"
              : "夜已经深了，我只是想安静地来关心你一下。",
          title: "当前会话适合进行一次更克制、更轻一点的夜间关心。",
          body: "这次评估给出了正向建议。夜已经深了，更适合低打扰、轻提醒式的关怀，你可以参考意图、紧急程度和建议延迟来决定是否触达。",
          suggestedMessage:
            decision.intent === "sleep_care"
              ? "已经很晚了，别太勉强自己。如果你还醒着，记得照顾好自己。"
              : "夜深了，我只是想轻轻问一句，你现在还好吗？"
        };
      }

      if (dayPart === "morning") {
        return {
          tone: "steady",
          deliveryKind: decision.intent === "meal_care" ? "care" : "check_in",
          lead:
            decision.intent === "meal_care"
              ? "新的一天开始了，也别忘了先照顾好自己。"
              : "早上好，我想在今天刚开始的时候问问你状态怎么样。",
          title: "当前会话适合进行一次清醒而温和的主动关怀。",
          body: "这次评估给出了正向建议。早晨更适合简洁、稳妥的问候，你可以参考意图、紧急程度和建议延迟来决定是否现在触达。",
          suggestedMessage:
            decision.intent === "meal_care"
              ? "新的一天开始了，也别忘了先照顾好自己，记得吃点东西。"
              : "早上好，我想来问问你，今天开始得还顺利吗？"
        };
      }

      if (dayPart === "evening") {
        return {
          tone: "warm",
          deliveryKind: decision.intent === "comfort" ? "comfort" : "check_in",
          lead:
            decision.intent === "comfort"
              ? "到了晚上，如果你今天有点累，我想陪你缓一缓。"
              : "傍晚了，我想来看看你今天过得怎么样。",
          title: "当前会话适合进行一次更柔和的傍晚关怀。",
          body: "这次评估给出了正向建议。到了晚上，语气可以更缓一些，你可以参考意图、紧急程度和建议延迟来决定是否触达。",
          suggestedMessage:
            decision.intent === "comfort"
              ? "如果你今天有点累，我在。你不用立刻说很多，也可以先慢一点。"
              : "到晚上了，我想来看看，你今天过得还好吗？"
        };
      }

      return {
        tone: "warm",
        deliveryKind: "check_in",
        lead: "我想起你了，所以来轻轻问候一下。",
        title: "当前会话适合进行一次主动关怀。",
        body: "这次评估给出了正向建议，你可以参考意图、紧急程度和建议延迟来决定是否立即触达。",
        suggestedMessage: "我想起你了，所以想来问一句，你现在怎么样？"
      };
    }

    if (dayPart === "late_night") {
      return {
        tone: "gentle",
        deliveryKind: decision.intent === "sleep_care" ? "care" : "check_in",
        lead:
          decision.intent === "sleep_care"
            ? "It is getting late, and I wanted to gently remind you to take care of yourself."
            : "It is late where you are, and I just wanted to check in quietly.",
        title: "The active session is ready for a quieter late-night reachout.",
        body: "This evaluation returned a positive recommendation. Because it is late, a lower-pressure and gentler tone is likely the better fit. Use the intent, urgency, and suggested delay to decide whether to reach out now.",
        suggestedMessage:
          decision.intent === "sleep_care"
            ? "It is getting late. If you are still awake, please be gentle with yourself tonight."
            : "It is late where you are, so I just wanted to quietly ask if you are okay."
      };
    }

    if (dayPart === "morning") {
      return {
        tone: "steady",
        deliveryKind: decision.intent === "meal_care" ? "care" : "check_in",
        lead:
          decision.intent === "meal_care"
            ? "A new day is starting, so I wanted to gently nudge you to take care of yourself first."
            : "Good morning. I wanted to check how you are doing at the start of the day.",
        title: "The active session is ready for a calm morning reachout.",
        body: "This evaluation returned a positive recommendation. A morning follow-up should stay clear and steady. Use the intent, urgency, and suggested delay to decide whether to reach out now.",
        suggestedMessage:
          decision.intent === "meal_care"
            ? "A new day is starting, so please do not forget to take care of yourself and eat something."
            : "Good morning. I wanted to check how your day is starting."
      };
    }

    if (dayPart === "evening") {
      return {
        tone: "warm",
        deliveryKind: decision.intent === "comfort" ? "comfort" : "check_in",
        lead:
          decision.intent === "comfort"
            ? "It is evening now, and if today felt heavy, I wanted to stay a little closer."
            : "It is evening, and I wanted to see how your day has been.",
        title: "The active session is ready for a softer evening reachout.",
        body: "This evaluation returned a positive recommendation. Because it is evening, a warmer and more settled tone may fit better. Use the intent, urgency, and suggested delay to decide whether to reach out now.",
        suggestedMessage:
          decision.intent === "comfort"
            ? "If today felt heavy, I am here. You do not have to carry it all at once."
            : "It is evening, so I wanted to check how your day has been."
      };
    }

    return {
      tone: "warm",
      deliveryKind: "check_in",
      lead: "You came to mind, so I wanted to check in gently.",
      title: "The active session is ready for a proactive reachout.",
      body: "This evaluation returned a positive recommendation. Use the intent, urgency, and suggested delay to decide whether to reach out now.",
      suggestedMessage: "You came to mind, so I wanted to gently ask how you are doing."
    };
  }

  if (locale === "zh") {
    return {
      tone: "hold",
      deliveryKind: "wait",
      lead: "这次先不急着触达会更合适。",
      title: "当前会话暂时不适合主动触达。",
      body: "这次评估被当前策略或会话状态拦住了，下面的原因会解释为什么现在还应该继续等待。",
      suggestedMessage: "当前更适合等待，不建议现在主动发送关怀消息。"
    };
  }

  return {
    tone: "hold",
    deliveryKind: "wait",
    lead: "Waiting is the better move for this session right now.",
    title: "The active session is currently blocked from proactive outreach.",
    body: "This evaluation was blocked by the current policy or session state. The reasons below explain why outreach should wait.",
    suggestedMessage: "Waiting is the better move right now, so no proactive message draft is recommended."
  };
}

export function formatProactiveDraftTone(
  tone: ProactiveMessageDraft["tone"],
  locale: Locale
): string {
  const zhLabels: Record<ProactiveMessageDraft["tone"], string> = {
    gentle: "轻柔",
    steady: "稳妥",
    warm: "温和",
    hold: "等待"
  };
  const enLabels: Record<ProactiveMessageDraft["tone"], string> = {
    gentle: "Gentle",
    steady: "Steady",
    warm: "Warm",
    hold: "Hold"
  };

  return locale === "zh" ? zhLabels[tone] : enLabels[tone];
}
