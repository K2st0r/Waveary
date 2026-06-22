import type { EmotionState, RelationshipProfile } from "@waveary/core";

export interface CompanionDeliveryHint {
  style?: "soft" | "warm" | "concerned" | "quiet" | "bright" | "playful" | "steady";
  pace?: "slower" | "steady" | "lighter";
  closeness?: "careful" | "present" | "close";
  expressiveness?: "restrained" | "natural" | "open";
  voiceStyle?: string;
  instruction?: string;
  summary?: string;
}

export function buildCompanionDeliveryHint(
  relationship: RelationshipProfile,
  emotion?: EmotionState
): CompanionDeliveryHint {
  const relationshipStage = relationship.stage.toLowerCase();
  const primaryEmotion = emotion?.primaryEmotion?.toLowerCase() ?? "calm";
  const modifiers = emotion?.modifiers?.map((modifier: string) => modifier.toLowerCase()) ?? [];

  let style: NonNullable<CompanionDeliveryHint["style"]> = "soft";
  let pace: NonNullable<CompanionDeliveryHint["pace"]> = "steady";
  let closeness: NonNullable<CompanionDeliveryHint["closeness"]> =
    relationshipStage === "growing" ? "close" : relationshipStage === "warming" ? "present" : "careful";
  let expressiveness: NonNullable<CompanionDeliveryHint["expressiveness"]> = "natural";

  if (matchesAny(primaryEmotion, ["protective", "concerned", "attentive"])) {
    style = "concerned";
    pace = "slower";
    expressiveness = "restrained";
  } else if (matchesAny(primaryEmotion, ["soft", "sad", "hurt", "longing"])) {
    style = "quiet";
    pace = "slower";
    expressiveness = "restrained";
  } else if (matchesAny(primaryEmotion, ["playful"])) {
    style = "playful";
    pace = "lighter";
    expressiveness = "open";
  } else if (matchesAny(primaryEmotion, ["happy", "joyful", "joy"])) {
    style = "bright";
    pace = "lighter";
    expressiveness = "open";
  } else if (matchesAny(primaryEmotion, ["fond", "warm", "relieved"])) {
    style = "warm";
    expressiveness = "natural";
  } else if (matchesAny(primaryEmotion, ["settled", "calm"])) {
    style = "steady";
    expressiveness = "restrained";
  }

  if (modifiers.includes("careful")) {
    closeness = "careful";
  } else if (
    modifiers.includes("close") ||
    modifiers.includes("closer") ||
    modifiers.includes("tender") ||
    relationshipStage === "growing"
  ) {
    closeness = "close";
  } else if (modifiers.includes("present") || relationshipStage === "warming") {
    closeness = "present";
  }

  if (modifiers.includes("quiet") || modifiers.includes("steady")) {
    expressiveness = "restrained";
  } else if (
    modifiers.includes("bright") ||
    modifiers.includes("teasing") ||
    modifiers.includes("open")
  ) {
    expressiveness = "open";
  }

  return {
    style,
    pace,
    closeness,
    expressiveness,
    voiceStyle: `companion-${style}`,
    instruction: buildDeliveryInstruction(style, pace, closeness, expressiveness),
    summary: `${style}/${pace}/${closeness}/${expressiveness}`
  };
}

function buildDeliveryInstruction(
  style: NonNullable<CompanionDeliveryHint["style"]>,
  pace: NonNullable<CompanionDeliveryHint["pace"]>,
  closeness: NonNullable<CompanionDeliveryHint["closeness"]>,
  expressiveness: NonNullable<CompanionDeliveryHint["expressiveness"]>
): string {
  const styleText =
    style === "concerned"
      ? "Speak with reassuring concern."
      : style === "quiet"
        ? "Speak softly and quietly."
        : style === "bright"
          ? "Let the voice feel lightly bright."
          : style === "playful"
            ? "Let the voice feel gently playful."
            : style === "warm"
              ? "Let the voice feel warm and close."
              : style === "steady"
                ? "Keep the voice calm and settled."
                : "Keep the voice soft and gentle.";
  const paceText =
    pace === "slower"
      ? "Take it a little slower than ordinary conversation."
      : pace === "lighter"
        ? "Use a slightly lighter, quicker rhythm."
        : "Keep a natural everyday pace.";
  const closenessText =
    closeness === "careful"
      ? "Do not sound too intimate yet."
      : closeness === "close"
        ? "It can sound personally close and familiar."
        : "Sound present and personally attentive.";
  const expressivenessText =
    expressiveness === "restrained"
      ? "Keep the expression restrained and grounded."
      : expressiveness === "open"
        ? "Allow a little more lift and emotional openness."
        : "Keep the expression natural and human.";

  return `${styleText} ${paceText} ${closenessText} ${expressivenessText}`;
}

function matchesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}
