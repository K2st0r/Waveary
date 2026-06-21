import type { LocalTimeContext } from "../providers/interfaces.js";

export type LocalDayPart = "late_night" | "morning" | "afternoon" | "evening";

export interface LocalTimeGuidance {
  dayPart: LocalDayPart;
  hour: number;
}

export function resolveLocalTimeGuidance(
  localTime?: LocalTimeContext
): LocalTimeGuidance | undefined {
  if (!localTime) {
    return undefined;
  }

  const date = new Date(localTime.iso);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    ...(localTime.timeZone ? { timeZone: localTime.timeZone } : {})
  }).formatToParts(date);
  const hourPart = parts.find((part) => part.type === "hour")?.value;
  const hour = hourPart ? Number.parseInt(hourPart, 10) : Number.NaN;

  if (!Number.isFinite(hour)) {
    return undefined;
  }

  if (hour < 5) {
    return {
      dayPart: "late_night",
      hour
    };
  }

  if (hour < 12) {
    return {
      dayPart: "morning",
      hour
    };
  }

  if (hour < 18) {
    return {
      dayPart: "afternoon",
      hour
    };
  }

  return {
    dayPart: "evening",
    hour
  };
}

export function describeLocalDayPartTone(
  guidance?: LocalTimeGuidance
): string | undefined {
  if (!guidance) {
    return undefined;
  }

  if (guidance.dayPart === "late_night") {
    return "It is late at the user's local time. If the moment is quiet, tired, heavy, or intimate, let the reply soften, slow down, and feel gently present rather than energetic.";
  }

  if (guidance.dayPart === "morning") {
    return "It is morning at the user's local time. A lightly clear, steady, wakeful tone is appropriate unless the user is visibly distressed.";
  }

  if (guidance.dayPart === "afternoon") {
    return "It is daytime at the user's local time. Keep the tone grounded and natural without forcing extra sleepiness or latenight intimacy.";
  }

  return "It is evening at the user's local time. A warmer, more settled tone can be appropriate if it matches the user's mood.";
}
