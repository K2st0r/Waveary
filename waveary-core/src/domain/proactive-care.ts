import type { Timestamp } from "./common.js";
import type { EmotionState } from "./emotion.js";
import type { RelationshipProfile } from "./relationship.js";
import type { Message } from "./session.js";
import type { TimelineEvent } from "./timeline.js";

export type ProactiveIntent =
  | "check_in"
  | "meal_care"
  | "sleep_care"
  | "stress_followup"
  | "absence_reachout"
  | "milestone_recall"
  | "gentle_reminder"
  | "celebration"
  | "comfort";

export type ProactiveUrgency = "low" | "medium" | "high";

export interface ProactiveCarePolicy {
  enabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  maxDailyReachouts: number;
  allowMealCare: boolean;
  allowSleepCare: boolean;
  allowAbsenceCheckins: boolean;
}

export interface ProactiveCareState {
  dailyReachoutsSent: number;
  unansweredReachoutCount: number;
  lastReachOutAt?: Timestamp;
}

export interface ProactiveCareDecision {
  shouldReachOut: boolean;
  reasons: string[];
  evaluatedAt: Timestamp;
  intent?: ProactiveIntent;
  urgency?: ProactiveUrgency;
  suggestedDelayMinutes?: number;
}

export interface ProactiveCareContext {
  history: Message[];
  relationship: RelationshipProfile;
  timeline: TimelineEvent[];
  emotion?: EmotionState;
}

export function createDefaultProactiveCarePolicy(): ProactiveCarePolicy {
  return {
    enabled: true,
    quietHoursStart: "23:00",
    quietHoursEnd: "08:00",
    maxDailyReachouts: 2,
    allowMealCare: true,
    allowSleepCare: true,
    allowAbsenceCheckins: true
  };
}

export function resolveProactiveCarePolicy(
  policy?: Partial<ProactiveCarePolicy>
): ProactiveCarePolicy {
  return {
    ...createDefaultProactiveCarePolicy(),
    ...policy
  };
}

export function createDefaultProactiveCareState(): ProactiveCareState {
  return {
    dailyReachoutsSent: 0,
    unansweredReachoutCount: 0
  };
}

export function resolveProactiveCareState(
  state?: Partial<ProactiveCareState>
): ProactiveCareState {
  return {
    ...createDefaultProactiveCareState(),
    ...state
  };
}
