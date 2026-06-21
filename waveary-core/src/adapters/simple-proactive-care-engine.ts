import type { ProactiveCareDecision, ProactiveIntent } from "../domain/proactive-care.js";
import type { ProactiveCareEngine, ProactiveCareEngineInput } from "../providers/interfaces.js";

const ABSENCE_GAP_HOURS = 36;
const CARE_CHECKIN_GAP_HOURS = 6;
const SLEEP_CARE_GAP_HOURS = 14;

export class SimpleProactiveCareEngine implements ProactiveCareEngine {
  async evaluate(input: ProactiveCareEngineInput): Promise<ProactiveCareDecision> {
    const reasons: string[] = [];

    if (!input.policy.enabled) {
      return decline(input.now, ["policy_disabled"]);
    }

    if (input.careState.dailyReachoutsSent >= input.policy.maxDailyReachouts) {
      return decline(input.now, ["daily_reachout_limit_reached"]);
    }

    if (input.careState.unansweredReachoutCount > 0) {
      return decline(input.now, ["awaiting_user_response"]);
    }

    if (
      isWithinQuietHours(input.now, input.policy.quietHoursStart, input.policy.quietHoursEnd)
    ) {
      return decline(input.now, ["quiet_hours_active"]);
    }

    if (input.relationship.stage === "new") {
      return decline(input.now, ["relationship_not_ready"]);
    }

    const gapHours = measureInteractionGapHours(input.history, input.now);
    const recentSadness = hasRecentSadness(input.history);
    const concernedCompanion =
      input.emotion?.primaryEmotion === "concerned" ||
      input.emotion?.detectedUserEmotion === "sadness";

    if (
      concernedCompanion &&
      recentSadness &&
      gapHours !== undefined &&
      gapHours >= CARE_CHECKIN_GAP_HOURS
    ) {
      reasons.push("companion_concern_detected", "recent_user_sadness", "care_gap_elapsed");
      return reachOut(input.now, "stress_followup", reasons, "high", 15);
    }

    if (
      input.policy.allowAbsenceCheckins &&
      gapHours !== undefined &&
      gapHours >= ABSENCE_GAP_HOURS
    ) {
      reasons.push("long_absence_gap", "relationship_continuity_check");
      return reachOut(input.now, "absence_reachout", reasons, "medium", 30);
    }

    if (
      input.policy.allowSleepCare &&
      gapHours !== undefined &&
      gapHours >= SLEEP_CARE_GAP_HOURS &&
      isSleepWindow(input.now)
    ) {
      reasons.push("late_hour_window", "rest_rhythm_check");
      return reachOut(input.now, "sleep_care", reasons, "low", 20);
    }

    if (
      input.policy.allowMealCare &&
      gapHours !== undefined &&
      gapHours >= CARE_CHECKIN_GAP_HOURS &&
      isMealWindow(input.now)
    ) {
      reasons.push("meal_window", "light_daily_care");
      return reachOut(input.now, "meal_care", reasons, "low", 15);
    }

    return decline(input.now, ["no_trigger_met"]);
  }
}

function decline(evaluatedAt: string, reasons: string[]): ProactiveCareDecision {
  return {
    shouldReachOut: false,
    reasons,
    evaluatedAt
  };
}

function reachOut(
  evaluatedAt: string,
  intent: ProactiveIntent,
  reasons: string[],
  urgency: NonNullable<ProactiveCareDecision["urgency"]>,
  suggestedDelayMinutes: number
): ProactiveCareDecision {
  return {
    shouldReachOut: true,
    intent,
    reasons,
    urgency,
    suggestedDelayMinutes,
    evaluatedAt
  };
}

function measureInteractionGapHours(history: Array<{ timestamp: string }>, currentTimestamp: string): number | undefined {
  const latestMessage = [...history]
    .filter((message) => typeof message.timestamp === "string")
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];

  if (!latestMessage) {
    return undefined;
  }

  const previous = Date.parse(latestMessage.timestamp);
  const current = Date.parse(currentTimestamp);

  if (Number.isNaN(previous) || Number.isNaN(current) || current <= previous) {
    return undefined;
  }

  return (current - previous) / (1000 * 60 * 60);
}

function hasRecentSadness(history: Array<{ role?: string; content?: string }>): boolean {
  return [...history]
    .reverse()
    .filter((message) => message.role === "user")
    .slice(0, 4)
    .some((message) =>
      /sad|upset|worried|stressed|tired|难过|伤心|焦虑|担心|压力|累/i.test(message.content ?? "")
    );
}

function isMealWindow(timestamp: string): boolean {
  const hour = getHour(timestamp);
  return hour !== undefined && ((hour >= 11 && hour < 14) || (hour >= 17 && hour < 20));
}

function isSleepWindow(timestamp: string): boolean {
  const hour = getHour(timestamp);
  return hour !== undefined && (hour >= 22 || hour < 1);
}

function isWithinQuietHours(
  timestamp: string,
  quietHoursStart?: string,
  quietHoursEnd?: string
): boolean {
  const hour = getHour(timestamp);
  const start = parseHour(quietHoursStart);
  const end = parseHour(quietHoursEnd);

  if (hour === undefined || start === undefined || end === undefined) {
    return false;
  }

  if (start === end) {
    return false;
  }

  if (start < end) {
    return hour >= start && hour < end;
  }

  return hour >= start || hour < end;
}

function getHour(timestamp: string): number | undefined {
  const date = new Date(timestamp);
  const hour = date.getHours();
  return Number.isNaN(date.getTime()) ? undefined : hour;
}

function parseHour(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());

  if (!match) {
    return undefined;
  }

  return Number.parseInt(match[1] ?? "", 10);
}
