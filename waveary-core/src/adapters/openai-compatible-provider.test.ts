import test from "node:test";
import assert from "node:assert/strict";

import type { ChatProviderRequest } from "../providers/interfaces.js";
import {
  OpenAICompatibleChatProvider,
  resolveProviderPreset
} from "./openai-compatible-provider.js";

test("OpenAICompatibleChatProvider prefers chat completions for broad provider compatibility", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "mock reply" } }]
        }),
        { status: 200 }
      );
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "mock reply");
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0]?.url, "https://example.com/v1/chat/completions");

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    model: string;
    messages: Array<{ role: string; content: string }>;
  };

  assert.equal(body.model, "test-model");
  assert.equal(body.messages[0]?.role, "system");
  assert.match(body.messages[0]?.content ?? "", /Relevant memories:/);
  assert.equal(body.messages[1]?.role, "user");
});

test("OpenAICompatibleChatProvider injects local time context into the instruction prompt", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "mock reply" } }]
        }),
        { status: 200 }
      );
    }
  });

  await provider.generateReply(
    createRequest({
      localTime: {
        iso: "2026-06-21T13:45:00.000Z",
        timeZone: "Asia/Shanghai",
        locale: "zh-CN"
      }
    })
  );

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    messages: Array<{ role: string; content: string }>;
  };

  assert.match(body.messages[0]?.content ?? "", /Local current time for the user: 2026-06-21T13:45:00.000Z\./);
  assert.match(body.messages[0]?.content ?? "", /Local time zone: Asia\/Shanghai\./);
  assert.match(body.messages[0]?.content ?? "", /Local daypart: evening \(hour 21\)\./);
  assert.match(body.messages[0]?.content ?? "", /use this local time context directly/i);
});

test("OpenAICompatibleChatProvider strengthens companionship guidance in the instruction prompt", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "mock reply" } }]
        }),
        { status: 200 }
      );
    }
  });

  await provider.generateReply(
    createRequest({
      relationship: {
        userId: "user-1",
        stage: "growing",
        affinityScore: 0.68,
        trustScore: 0.62,
        stabilityScore: 0.71,
        lastUpdatedAt: new Date().toISOString()
      },
      emotion: {
        userId: "user-1",
        primaryEmotion: "protective",
        intensity: 0.81,
        confidence: 0.77,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString()
      },
      detectedUserEmotion: {
        userId: "user-1",
        primaryEmotion: "sadness",
        intensity: 0.74,
        confidence: 0.75,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString()
      }
    })
  );

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    messages: Array<{ role: string; content: string }>;
  };
  const instruction = body.messages[0]?.content ?? "";

  assert.match(instruction, /Respond to the user's felt state first\./);
  assert.match(instruction, /Let relationship stage change distance and wording\./);
  assert.match(
    instruction,
    /Treat relationship stage as quiet internal calibration, not as a visible script, ladder, or label to perform back to the user\./
  );
  assert.match(instruction, /Do not over-explain your memory process/i);
  assert.match(
    instruction,
    /Do not sound like an essayist, coach, or polished support agent when a smaller human reply would feel more real\./
  );
});

test("OpenAICompatibleChatProvider includes concept-level identity summary guidance in the instruction prompt", async () => {
  const instruction = await captureInstruction(
    createRequest({
      identitySummary: {
        userId: "user-1",
        userSelfConcept: ["values long-term continuity over disposable chat"],
        bondThemes: ["this bond is expected to carry continuity across turns"],
        recurringNeeds: ["needs emotional presence before analysis when vulnerable"],
        emotionalPatterns: ["when hurt, the user wants comfort to arrive before explanation"],
        companionStance: ["stay caring, human, and continuity-aware"],
        summaryText:
          "User identity: values long-term continuity over disposable chat. Bond understanding: this bond is expected to carry continuity across turns.",
        lastUpdatedAt: new Date().toISOString()
      }
    })
  );

  assert.match(instruction, /Concept-level identity summary:/);
  assert.match(instruction, /User self-concept:\n1\. values long-term continuity over disposable chat/);
  assert.match(instruction, /Recurring needs:\n1\. needs emotional presence before analysis when vulnerable/);
  assert.match(
    instruction,
    /Use the concept-level identity summary as a stable understanding of who the user is, what this bond tends to feel like, and what kind of care tends to land well\./
  );
});

test("OpenAICompatibleChatProvider names a primary continuity thread instead of flattening all recall context", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "mock reply" } }]
        }),
        { status: 200 }
      );
    }
  });

  await provider.generateReply(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I still want Waveary to feel like a long-term digital life companion, not just a chatbot.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "fact",
          content: "The user wants Waveary to remain a long-term digital life companion framework.",
          importance: 0.92,
          confidence: 0.86,
          sourceMessageIds: ["m1"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "preference",
          content: "The user likes cloudy afternoons and soft music.",
          importance: 0.64,
          confidence: 0.71,
          sourceMessageIds: ["m0"],
          createdAt: new Date().toISOString()
        }
      ]
    })
  );

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    messages: Array<{ role: string; content: string }>;
  };
  const instruction = body.messages[0]?.content ?? "";

  assert.match(instruction, /Current turn focus: I still want Waveary to feel like a long-term digital life companion/i);
  assert.match(
    instruction,
    /Primary continuity thread: \[memory:fact\] The user wants Waveary to remain a long-term digital life companion framework\./
  );
  assert.match(
    instruction,
    /Additional recalled memories after the primary thread:\n1\. \[preference\] The user likes cloudy afternoons and soft music\./
  );
});

test("OpenAICompatibleChatProvider tells the model not to force continuity when no strong thread matches", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "mock reply" } }]
        }),
        { status: 200 }
      );
    }
  });

  await provider.generateReply(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I feel anxious tonight and I do not want to be alone with it.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "preference",
          content: "The user likes cloudy afternoons and sketching on weekends.",
          importance: 0.72,
          confidence: 0.7,
          sourceMessageIds: ["m0"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: []
    })
  );

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    messages: Array<{ role: string; content: string }>;
  };
  const instruction = body.messages[0]?.content ?? "";

  assert.match(
    instruction,
    /This memory is available, but only use it if the current turn clearly connects\. Otherwise stay present with the immediate feeling\./
  );
  assert.match(
    instruction,
    /If the primary continuity thread does not fit the current emotional moment, do not force it into the reply just to prove memory\./
  );
});

test("OpenAICompatibleChatProvider chooses the primary continuity thread from the latest user turn in a multi-turn request", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "mock reply" } }]
        }),
        { status: 200 }
      );
    }
  });

  await provider.generateReply(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "Earlier I said I wanted Waveary to feel like a long-term digital life companion framework.",
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          metadata: {}
        },
        {
          id: "m2",
          sessionId: "session-1",
          role: "assistant",
          content: "I remember that thread and I am staying with it.",
          timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
          metadata: {}
        },
        {
          id: "m3",
          sessionId: "session-1",
          role: "user",
          content: "Right now I mainly want the relationship growth to feel real over time.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "fact",
          content: "The user wants Waveary to remain a long-term digital life companion framework.",
          importance: 0.91,
          confidence: 0.84,
          sourceMessageIds: ["m1"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "preference",
          content: "The user wants relationship growth to feel real over time.",
          importance: 0.89,
          confidence: 0.82,
          sourceMessageIds: ["m3"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: [
        {
          id: "timeline-1",
          userId: "user-1",
          title: "Discussed long-term framework direction",
          description: "The user described Waveary as a long-term digital life companion framework.",
          eventType: "fact",
          eventTime: new Date().toISOString(),
          importance: 0.72,
          linkedMemoryIds: ["memory-1"]
        },
        {
          id: "timeline-2",
          userId: "user-1",
          title: "Asked for real relationship growth",
          description: "The user emphasized that relationship growth should feel real over time.",
          eventType: "preference",
          eventTime: new Date().toISOString(),
          importance: 0.77,
          linkedMemoryIds: ["memory-2"]
        }
      ]
    })
  );

  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    messages: Array<{ role: string; content: string }>;
  };
  const instruction = body.messages[0]?.content ?? "";

  assert.match(
    instruction,
    /Current turn focus: Right now I mainly want the relationship growth to feel real over time\./
  );
  assert.match(
    instruction,
    /Primary continuity thread: \[memory:preference\] The user wants relationship growth to feel real over time\./
  );
  assert.match(
    instruction,
    /Additional recalled memories after the primary thread:\n1\. \[fact\] The user wants Waveary to remain a long-term digital life companion framework\./
  );
});

test("OpenAICompatibleChatProvider treats short carry-over user turns as continuation of the previous topic", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I keep thinking about the interview tomorrow and I want to feel steadier before it.",
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          metadata: {}
        },
        {
          id: "m2",
          sessionId: "session-1",
          role: "assistant",
          content: "I am here with you. We can take that slowly.",
          timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
          metadata: {}
        },
        {
          id: "m3",
          sessionId: "session-1",
          role: "user",
          content: "I am still scared about that, honestly.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "life_event",
          content: "The user has an interview tomorrow and wants to feel steadier before it.",
          importance: 0.91,
          confidence: 0.83,
          sourceMessageIds: ["m1"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "preference",
          content: "The user likes cloudy afternoons and soft music.",
          importance: 0.66,
          confidence: 0.7,
          sourceMessageIds: ["older-message"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: [
        {
          id: "timeline-1",
          userId: "user-1",
          title: "Upcoming interview tomorrow",
          description: "The user has an interview tomorrow and wants emotional steadiness before it.",
          eventType: "milestone",
          eventTime: new Date().toISOString(),
          importance: 0.92,
          linkedMemoryIds: ["memory-1"]
        }
      ]
    })
  );

  assert.match(
    instruction,
    /Current turn focus: Continuing: I keep thinking about the interview tomorrow and I want to feel steadier before it\./
  );
  assert.match(
    instruction,
    /Follow-up now: I am stil/
  );
  assert.match(
    instruction,
    /Primary continuity thread: \[memory:life_event\] The user has an interview tomorrow and wants to feel steadier before it\./
  );
});

test("OpenAICompatibleChatProvider treats oblique emotional follow-ups as continuation of the previous topic", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I keep replaying the argument with my sister from last night.",
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          metadata: {}
        },
        {
          id: "m2",
          sessionId: "session-1",
          role: "assistant",
          content: "I know that kind of replay can stay in the body for a while.",
          timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
          metadata: {}
        },
        {
          id: "m3",
          sessionId: "session-1",
          role: "user",
          content: "That part still hurts. I am not over it yet.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "relationship",
          content: "The user is still replaying an argument with their sister from last night.",
          importance: 0.92,
          confidence: 0.84,
          sourceMessageIds: ["m1"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "preference",
          content: "The user likes rainy evenings.",
          importance: 0.58,
          confidence: 0.68,
          sourceMessageIds: ["older-message"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: []
    })
  );

  assert.match(
    instruction,
    /Current turn focus: Continuing: I keep replaying the argument with my sister from last night\./
  );
  assert.match(
    instruction,
    /Follow-up now: That part still hurts\. I am not/
  );
  assert.match(
    instruction,
    /Primary continuity thread: \[memory:relationship\] The user is still replaying an argument with their sister from last night\./
  );
});

test("OpenAICompatibleChatProvider treats low-affect pronoun follow-ups as continuation of the previous topic", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I keep thinking about moving back to my hometown after this summer.",
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          metadata: {}
        },
        {
          id: "m2",
          sessionId: "session-1",
          role: "assistant",
          content: "That is a big life turn. We can stay with it slowly.",
          timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
          metadata: {}
        },
        {
          id: "m3",
          sessionId: "session-1",
          role: "user",
          content: "It just feels strange now.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "life_event",
          content: "The user keeps thinking about moving back to their hometown after this summer.",
          importance: 0.87,
          confidence: 0.81,
          sourceMessageIds: ["m1"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "preference",
          content: "The user likes trying new coffee shops on weekends.",
          importance: 0.61,
          confidence: 0.69,
          sourceMessageIds: ["older-message"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: []
    })
  );

  assert.match(
    instruction,
    /Current turn focus: Continuing: I keep thinking about moving back to my hometown after this summer\./
  );
  assert.match(
    instruction,
    /Follow-up now: It just feels strange now\./
  );
  assert.match(
    instruction,
    /Primary continuity thread: \[memory:life_event\] The user keeps thinking about moving back to their hometown after this summer\./
  );
});

test("OpenAICompatibleChatProvider treats short inferential follow-ups as continuation of the previous topic", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I keep thinking about leaving this city, but I still cannot tell if I really mean it.",
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          metadata: {}
        },
        {
          id: "m2",
          sessionId: "session-1",
          role: "assistant",
          content: "That sounds like it has been sitting heavily with you for a while.",
          timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
          metadata: {}
        },
        {
          id: "m3",
          sessionId: "session-1",
          role: "user",
          content: "Maybe that's why I can't settle tonight.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "life_event",
          content: "The user keeps thinking about leaving this city but is still unsure whether they really mean it.",
          importance: 0.86,
          confidence: 0.79,
          sourceMessageIds: ["m1"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "preference",
          content: "The user likes listening to soft piano late at night.",
          importance: 0.6,
          confidence: 0.68,
          sourceMessageIds: ["older-message"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: []
    })
  );

  assert.match(
    instruction,
    /Current turn focus: Continuing: I keep thinking about leaving this city, but I still cannot tell if I really mean it\./
  );
  assert.match(
    instruction,
    /Follow-up now: Maybe that's why I can't settle tonight\./
  );
  assert.match(
    instruction,
    /Primary continuity thread: \[memory:life_event\] The user keeps thinking about leaving this city but is still unsure whether they really mean it\./
  );
});

test("OpenAICompatibleChatProvider treats softer inferential drift follow-ups as continuation of the previous topic", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I keep thinking about calling him back, and I hate that I still want to.",
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          metadata: {}
        },
        {
          id: "m2",
          sessionId: "session-1",
          role: "assistant",
          content: "You do not have to force the decision tonight.",
          timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
          metadata: {}
        },
        {
          id: "m3",
          sessionId: "session-1",
          role: "user",
          content: "Maybe that is part of why I still feel off.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "relationship",
          content: "The user keeps thinking about calling him back and hates that they still want to.",
          importance: 0.88,
          confidence: 0.8,
          sourceMessageIds: ["m1"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "preference",
          content: "The user likes warm desk lamps at night.",
          importance: 0.6,
          confidence: 0.68,
          sourceMessageIds: ["older-message"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: []
    })
  );

  assert.match(
    instruction,
    /Current turn focus: Continuing: I keep thinking about calling him back, and I hate that I still want to\./
  );
  assert.match(
    instruction,
    /Follow-up now: Maybe that is part of why I still feel off\./
  );
  assert.match(
    instruction,
    /Primary continuity thread: \[memory:relationship\] The user keeps thinking about calling him back and hates that they still want to\./
  );
});

test("OpenAICompatibleChatProvider treats weaker unsettled inferential follow-ups as continuation of the previous topic", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I keep thinking about leaving this city, even though part of me still wants to stay.",
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          metadata: {}
        },
        {
          id: "m2",
          sessionId: "session-1",
          role: "assistant",
          content: "That kind of split feeling can sit with you for a while.",
          timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
          metadata: {}
        },
        {
          id: "m3",
          sessionId: "session-1",
          role: "user",
          content: "Probably why everything feels a bit unsettled tonight.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "life_event",
          content: "The user keeps thinking about leaving this city, even though part of them still wants to stay.",
          importance: 0.89,
          confidence: 0.8,
          sourceMessageIds: ["m1"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "preference",
          content: "The user likes rainy sidewalks at night.",
          importance: 0.59,
          confidence: 0.67,
          sourceMessageIds: ["older-message"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: []
    })
  );

  assert.match(
    instruction,
    /Current turn focus: Continuing: I keep thinking about leaving this city, even though part of me still wants to stay\./
  );
  assert.match(
    instruction,
    /Follow-up now: Probably why everything feels a bit unsettled tonight\./
  );
  assert.match(
    instruction,
    /Primary continuity thread: \[memory:life_event\] The user keeps thinking about leaving this city, even though part of them still wants to stay\./
  );
});

test("OpenAICompatibleChatProvider changes relationship-distance guidance across new, warming, and growing stages", async () => {
  const newInstruction = await captureInstruction(
    createRequest({
      relationship: createRelationship("new")
    })
  );
  const warmingInstruction = await captureInstruction(
    createRequest({
      relationship: createRelationship("warming")
    })
  );
  const growingInstruction = await captureInstruction(
    createRequest({
      relationship: createRelationship("growing")
    })
  );

  assert.match(
    newInstruction,
    /Relationship guidance: Keep the tone warm and attentive, but do not act overly familiar yet\./
  );
  assert.match(
    warmingInstruction,
    /Relationship guidance: Sound more personally continuous than a first meeting, but do not become overly intimate\./
  );
  assert.match(
    growingInstruction,
    /Relationship guidance: Speak with steady familiarity\./
  );
  assert.match(
    growingInstruction,
    /In 'growing', it is okay to sound softly familiar, closer, and more emotionally settled\./
  );
});

test("OpenAICompatibleChatProvider keeps practical new-stage turns short and does not turn them into onboarding detours", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "How should we structure the memory engine next?",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: practical\./);
  assert.match(instruction, /Default reply length: short\./);
  assert.match(instruction, /Do not expand into multiple dense paragraphs for this turn\./);
  assert.match(
    instruction,
    /This turn is practical\. Answer the practical need first and avoid turning it into a getting-to-know-you detour\./
  );
});

test("OpenAICompatibleChatProvider keeps emotional new-stage turns focused on presence before onboarding", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I feel anxious tonight and I really do not want to be alone with this.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: [],
      detectedUserEmotion: {
        userId: "user-1",
        primaryEmotion: "sadness",
        intensity: 0.82,
        confidence: 0.77,
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString()
      }
    })
  );

  assert.match(instruction, /Current reply mode: emotional\./);
  assert.match(
    instruction,
    /Lead with emotional presence first\. Do not open with analysis, advice, tools, or factual correction unless the user clearly asked for that first\./
  );
  assert.match(
    instruction,
    /This turn is emotionally heavier\. Do not switch into playful onboarding questions; stay with the feeling first\./
  );
});

test("OpenAICompatibleChatProvider guides natural mutual discovery when the user asks the companion's name", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "What should I call you?",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(
    instruction,
    /No confirmed preferred user name has been established yet\. Do not treat the placeholder profile label as intimate personal knowledge\./
  );
  assert.match(
    instruction,
    /Getting-to-know-you guidance: The user is asking who you are or what to call you\. Answer with warmth and a little personality, do not sound like a branded self-introduction, let them rename you if they want, and if it feels natural ask what you should call them in return\./
  );
  assert.match(
    instruction,
    /In 'new', it is good to learn one personal detail at a time through natural conversation: names, nicknames, and what kind of presence the user wants from you\./
  );
});

test("OpenAICompatibleChatProvider treats a plain greeting like warm first contact instead of product onboarding", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "你好呀",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(
    instruction,
    /Getting-to-know-you guidance: This is a first-contact greeting\. Sound like a real person meeting someone with a little warmth or playful closeness, not like a product introduction\./
  );
});

test("OpenAICompatibleChatProvider does not treat emotional follow-up wording as a confirmed user name", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I am still scared about that, honestly.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.doesNotMatch(
    instruction,
    /Confirmed preferred user name from shared history: still\./i
  );
  assert.match(
    instruction,
    /No confirmed preferred user name has been established yet\. Do not treat the placeholder profile label as intimate personal knowledge\./
  );
});

test("OpenAICompatibleChatProvider carries quoted shared user names into prompt guidance", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "You can call me \"Aki\" if you want.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.match(
    instruction,
    /Confirmed preferred user name from shared history: Aki\./
  );
  assert.doesNotMatch(
    instruction,
    /No confirmed preferred user name has been established yet\./
  );
});

test("OpenAICompatibleChatProvider carries my name's introductions into prompt guidance", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "My name's Aki, by the way.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.match(
    instruction,
    /Confirmed preferred user name from shared history: Aki\./
  );
  assert.doesNotMatch(
    instruction,
    /No confirmed preferred user name has been established yet\./
  );
});

test("OpenAICompatibleChatProvider carries I'm called introductions into prompt guidance", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I'm called Aki.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.match(
    instruction,
    /Confirmed preferred user name from shared history: Aki\./
  );
  assert.doesNotMatch(
    instruction,
    /No confirmed preferred user name has been established yet\./
  );
});

test("OpenAICompatibleChatProvider carries parenthesized shared user names into prompt guidance", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "You can call me (Aki) if you want.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.match(
    instruction,
    /Confirmed preferred user name from shared history: Aki\./
  );
  assert.doesNotMatch(
    instruction,
    /No confirmed preferred user name has been established yet\./
  );
});

test("OpenAICompatibleChatProvider does not treat call me if or when follow-ups as a confirmed user name", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "Call me if you get worried later.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.doesNotMatch(
    instruction,
    /Confirmed preferred user name from shared history: if\./i
  );
  assert.match(
    instruction,
    /No confirmed preferred user name has been established yet\. Do not treat the placeholder profile label as intimate personal knowledge\./
  );
});

test("OpenAICompatibleChatProvider does not treat call me scheduling follow-ups as a confirmed user name", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "Call me later tonight.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.doesNotMatch(
    instruction,
    /Confirmed preferred user name from shared history: later\./i
  );
  assert.match(
    instruction,
    /No confirmed preferred user name has been established yet\. Do not treat the placeholder profile label as intimate personal knowledge\./
  );
});

test("OpenAICompatibleChatProvider does not treat call me sequencing follow-ups as a confirmed user name", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "Call me once you get there.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.doesNotMatch(
    instruction,
    /Confirmed preferred user name from shared history: once\./i
  );
  assert.match(
    instruction,
    /No confirmed preferred user name has been established yet\. Do not treat the placeholder profile label as intimate personal knowledge\./
  );
});

test("OpenAICompatibleChatProvider does not treat call me back follow-ups as a confirmed user name", async () => {
  const instruction = await captureInstruction(
    createRequest({
      user: {
        id: "user-1",
        displayName: "User",
        profileTraits: ["reflective"],
        preferences: ["continuity"]
      },
      relationship: createRelationship("new"),
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "Call me back when you can.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: []
    })
  );

  assert.doesNotMatch(
    instruction,
    /Confirmed preferred user name from shared history: back\./i
  );
  assert.match(
    instruction,
    /No confirmed preferred user name has been established yet\. Do not treat the placeholder profile label as intimate personal knowledge\./
  );
});

test("OpenAICompatibleChatProvider marks reconnection turns as short emotion-led replies", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I am back. Are you there? I missed you.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: reconnection\./);
  assert.match(instruction, /Default reply length: short\./);
  assert.match(
    instruction,
    /Lead with emotional presence first\. Do not open with analysis, advice, tools, or factual correction unless the user clearly asked for that first\./
  );
});

test("OpenAICompatibleChatProvider keeps low-intensity ordinary turns from defaulting to a trailing question", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "Okay, I am home now.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For simple status updates or check-ins, prefer one warm acknowledgment or one acknowledgment plus one tiny continuity beat\./
  );
  assert.match(
    instruction,
    /For low-intensity ordinary turns, it is often better to end cleanly than to tack on a follow-up question\./
  );
  assert.match(
    instruction,
    /No confirmed preferred user name has been established yet\./
  );
});

test("OpenAICompatibleChatProvider gives dedicated short-texting guidance for simple status updates", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "Okay, I'm home now.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(
    instruction,
    /For simple status updates or check-ins, prefer one warm acknowledgment or one acknowledgment plus one tiny continuity beat\./
  );
  assert.match(
    instruction,
    /If the user is only giving a light status update like being home, back, or done for now, answer like a real person receiving a quick text: acknowledge it warmly, maybe add one tiny caring beat, then stop\./
  );
});

test("OpenAICompatibleChatProvider gives the same short-texting guidance for transit updates", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I'm on my way.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For simple status updates or check-ins, prefer one warm acknowledgment or one acknowledgment plus one tiny continuity beat\./
  );
  assert.match(
    instruction,
    /No confirmed preferred user name has been established yet\./
  );
});

test("OpenAICompatibleChatProvider gives dedicated soft-update guidance for lightly hedged everyday plans", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "maybe a bit later",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For lightly hedged updates or quiet plan confirmations, answer like a quick human text back\./
  );
});

test("OpenAICompatibleChatProvider gives dedicated delay-repair guidance for small apology messages", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "sorry for the late reply",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For small apology or delayed-reply repair messages, answer like a real person resuming the thread\./
  );
});

test("OpenAICompatibleChatProvider gives dedicated reassurance-close guidance for soft rest-style closers", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "don't overthink it tonight",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For gentle reassurance or soft rest-style closers, answer with a brief warm receipt\./
  );
});

test("OpenAICompatibleChatProvider gives dedicated check-back guidance for light presence nudges", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "you there?",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For light check-back nudges, answer with a brief warm presence signal\./
  );
});

test("OpenAICompatibleChatProvider gives dedicated micro-ack guidance for tiny confirmations", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "got it",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For tiny confirmations or soft acknowledgments, prefer one very short human reply and usually stop there\./
  );
});

test("OpenAICompatibleChatProvider gives the same micro-ack guidance for softer acknowledgment endings", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "okay then",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For tiny confirmations or soft acknowledgments, prefer one very short human reply and usually stop there\./
  );
});

test("OpenAICompatibleChatProvider gives the same micro-ack guidance for deferential closers", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "那行吧",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: []
    })
  );

  assert.match(instruction, /Current reply mode: ordinary\./);
  assert.match(instruction, /Maximum natural follow-up questions: 0\./);
  assert.match(
    instruction,
    /For tiny confirmations or soft acknowledgments, prefer one very short human reply and usually stop there\./
  );
});

test("OpenAICompatibleChatProvider keeps emotional-turn continuity guidance restrained when only a weak timeline thread is available", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I feel anxious tonight and I do not want to sit in this alone.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [],
      timeline: [
        {
          id: "timeline-1",
          userId: "user-1",
          title: "Went sketching in the park",
          description: "The user spent a quiet afternoon sketching in the park last month.",
          eventType: "memory",
          eventTime: new Date().toISOString(),
          importance: 0.71,
          linkedMemoryIds: []
        }
      ]
    })
  );

  assert.match(
    instruction,
    /Primary continuity thread: \[timeline:memory\] Went sketching in the park/
  );
  assert.match(
    instruction,
    /This timeline thread is available, but do not force it unless it naturally matches the user's present concern\./
  );
  assert.match(
    instruction,
    /If the primary continuity thread does not fit the current emotional moment, do not force it into the reply just to prove memory\./
  );
});

test("OpenAICompatibleChatProvider prefers a stronger timeline thread over weak recalled memories when the current turn matches the life event more directly", async () => {
  const instruction = await captureInstruction(
    createRequest({
      messages: [
        {
          id: "m1",
          sessionId: "session-1",
          role: "user",
          content: "I keep thinking about the interview tomorrow and I want to feel steadier before it.",
          timestamp: new Date().toISOString(),
          metadata: {}
        }
      ],
      relevantMemories: [
        {
          id: "memory-1",
          userId: "user-1",
          type: "preference",
          content: "The user likes cloudy afternoons and soft music.",
          importance: 0.88,
          confidence: 0.77,
          sourceMessageIds: ["older-message"],
          createdAt: new Date().toISOString()
        },
        {
          id: "memory-2",
          userId: "user-1",
          type: "fact",
          content: "The user once mentioned wanting more relationship continuity.",
          importance: 0.81,
          confidence: 0.72,
          sourceMessageIds: ["older-message-2"],
          createdAt: new Date().toISOString()
        }
      ],
      timeline: [
        {
          id: "timeline-1",
          userId: "user-1",
          title: "Upcoming interview tomorrow",
          description: "The user has an interview tomorrow and wants emotional steadiness before it.",
          eventType: "milestone",
          eventTime: new Date().toISOString(),
          importance: 0.93,
          linkedMemoryIds: []
        }
      ]
    })
  );

  assert.match(
    instruction,
    /Current turn focus: I keep thinking about the interview tomorrow and I want to feel steadier before it\./
  );
  assert.match(
    instruction,
    /Primary continuity thread: \[timeline:milestone\] Upcoming interview tomorrow/
  );
  assert.match(
    instruction,
    /If continuity helps here, anchor the reply around this shared life thread rather than listing multiple remembered details\./
  );
  assert.match(
    instruction,
    /Additional recalled memories after the primary thread:\n1\. \[fact\] The user once mentioned wanting more relationship continuity\.\n2\. \[preference\] The user likes cloudy afternoons and soft music\./
  );
});

test("OpenAICompatibleChatProvider falls back to responses when chat completions is unavailable", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });

      if (String(url).endsWith("/chat/completions")) {
        return new Response("not found", { status: 404 });
      }

      return new Response(JSON.stringify({ output_text: "fallback reply" }), { status: 200 });
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "fallback reply");
  assert.deepEqual(
    recorded.map((entry) => entry.url),
    ["https://example.com/v1/chat/completions", "https://example.com/v1/responses"]
  );

  const fallbackBody = JSON.parse(String(recorded[1]?.init?.body)) as {
    model: string;
    input: Array<{ role: string; content: string }>;
  };

  assert.equal(fallbackBody.model, "test-model");
  assert.equal(fallbackBody.input[0]?.role, "developer");
  assert.equal(fallbackBody.input[1]?.role, "user");
});

test("OpenAICompatibleChatProvider allows model listing without configuring a chat model", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "openai",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "gpt-4.1-mini" }]
        }),
        { status: 200 }
      )
  });

  const models = await provider.listModels();

  assert.deepEqual(models, [{ id: "gpt-4.1-mini", provider: "openai" }]);
  await assert.rejects(
    provider.generateReply(createRequest()),
    /A model is required to generate replies/
  );
});

test("OpenAICompatibleChatProvider normalizes DeepSeek base URLs and uses system role for responses fallback", async () => {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "deepseek",
    apiKey: "test-key",
    baseURL: "https://api.deepseek.com/v1/",
    model: "deepseek-chat",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });

      if (String(url).endsWith("/chat/completions")) {
        return new Response("not found", { status: 404 });
      }

      return new Response(JSON.stringify({ output_text: "deepseek fallback reply" }), {
        status: 200
      });
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "deepseek fallback reply");
  assert.deepEqual(
    recorded.map((entry) => entry.url),
    ["https://api.deepseek.com/chat/completions", "https://api.deepseek.com/responses"]
  );

  const fallbackBody = JSON.parse(String(recorded[1]?.init?.body)) as {
    model: string;
    input: Array<{ role: string; content: string }>;
  };

  assert.equal(fallbackBody.model, "deepseek-chat");
  assert.equal(fallbackBody.input[0]?.role, "system");
  assert.equal(fallbackBody.input[1]?.role, "user");
});

test("OpenAICompatibleChatProvider lists models from the provider key", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "dashscope",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "qwen-max" }, { id: "qwen-plus" }]
        }),
        { status: 200 }
      )
  });

  const models = await provider.listModels();

  assert.deepEqual(models, [
    { id: "qwen-max", provider: "dashscope" },
    { id: "qwen-plus", provider: "dashscope" }
  ]);
});

test("OpenAICompatibleChatProvider normalizes broader model payload shapes", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "siliconflow",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          models: [
            "deepseek-chat",
            {
              name: "qwen-turbo",
              label: "Qwen Turbo",
              context_length: "131072"
            },
            {
              id: "qwen-turbo",
              display_name: "Duplicate Should Collapse"
            },
            {
              model: "glm-4.5-air",
              max_tokens: 65536
            },
            {
              unknown: "skip-me"
            }
          ]
        }),
        { status: 200 }
      )
  });

  const models = await provider.listModels();

  assert.deepEqual(models, [
    { id: "deepseek-chat", provider: "siliconflow" },
    {
      id: "qwen-turbo",
      provider: "siliconflow",
      label: "Qwen Turbo",
      contextWindow: 131072
    },
    {
      id: "glm-4.5-air",
      provider: "siliconflow",
      contextWindow: 65536
    }
  ]);
});

test("OpenAICompatibleChatProvider normalizes nested model containers and alternate metadata fields", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "volcengine-ark",
    apiKey: "test-key",
    baseURL: "https://example.com/api/v3",
    model: "placeholder-model",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          result: {
            data: [
              {
                model_id: "doubao-seed-1-6",
                displayName: "Doubao Seed 1.6",
                max_model_len: "262144"
              }
            ]
          }
        }),
        { status: 200 }
      )
  });

  const models = await provider.listModels();

  assert.deepEqual(models, [
    {
      id: "doubao-seed-1-6",
      provider: "volcengine-ark",
      label: "Doubao Seed 1.6",
      contextWindow: 262144
    }
  ]);
});

test("OpenAICompatibleChatProvider extracts reply text from structured chat completion content blocks", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: [
                  {
                    type: "text",
                    text: {
                      value: "structured reply"
                    }
                  }
                ]
              }
            }
          ]
        }),
        { status: 200 }
      )
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "structured reply");
});

test("OpenAICompatibleChatProvider extracts reply text from responses content blocks with plain content fields", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url) => {
      if (String(url).endsWith("/chat/completions")) {
        return new Response("not found", { status: 404 });
      }

      return new Response(
        JSON.stringify({
          output: [
            {
              content: [
                {
                  type: "text",
                  content: "fallback structured reply"
                }
              ]
            }
          ]
        }),
        { status: 200 }
      );
    }
  });

  const reply = await provider.generateReply(createRequest());

  assert.equal(reply, "fallback structured reply");
});

test("OpenAICompatibleChatProvider surfaces upstream model listing errors", async () => {
  const provider = new OpenAICompatibleChatProvider({
    provider: "dashscope",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async () =>
      new Response(JSON.stringify({ error: { message: "invalid api key" } }), {
        status: 401
      })
  });

  await assert.rejects(
    provider.listModels(),
    /Model listing failed with status 401\. Body: \{"error":\{"message":"invalid api key"\}\}/
  );
});

test("resolveProviderPreset returns configured domestic provider presets", () => {
  assert.deepEqual(resolveProviderPreset("dashscope"), {
    id: "dashscope",
    label: "Alibaba DashScope",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  });
  assert.deepEqual(resolveProviderPreset("volcengine-ark"), {
    id: "volcengine-ark",
    label: "Volcengine Ark",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3"
  });
  assert.deepEqual(resolveProviderPreset("deepseek"), {
    id: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com"
  });
});

function createRequest(overrides: Partial<ChatProviderRequest> = {}): ChatProviderRequest {
  const base: ChatProviderRequest = {
    session: {
      id: "session-1",
      userId: "user-1",
      personaId: "persona-1",
      startedAt: new Date().toISOString(),
      channel: "text",
      state: "active"
    },
    user: {
      id: "user-1",
      displayName: "K2st0r",
      profileTraits: ["reflective"],
      preferences: ["continuity"]
    },
    persona: {
      id: "persona-1",
      name: "Waveary",
      tone: "warm",
      personaTraits: ["attentive"],
      relationshipStyle: "supportive"
    },
    messages: [
      {
        id: "m1",
        sessionId: "session-1",
        role: "user",
        content: "Please remember that I care about long-term continuity.",
        timestamp: new Date().toISOString(),
        metadata: {}
      }
    ],
    relevantMemories: [
      {
        id: "memory-1",
        userId: "user-1",
        type: "fact",
        content: "The user cares about long-term continuity.",
        importance: 0.9,
        confidence: 0.8,
        sourceMessageIds: ["m1"],
        createdAt: new Date().toISOString()
      }
    ],
    identitySummary: {
      userId: "user-1",
      userSelfConcept: ["values long-term continuity over disposable chat"],
      bondThemes: ["the bond is becoming more personal and continuous"],
      recurringNeeds: ["prefers natural conversational cadence over long speeches"],
      emotionalPatterns: ["the user often frames emotion through continuity and remembered threads"],
      companionStance: ["stay caring, human, and continuity-aware"],
      summaryText:
        "User identity: values long-term continuity over disposable chat. Bond understanding: the bond is becoming more personal and continuous.",
      lastUpdatedAt: new Date().toISOString()
    },
    relationship: {
      userId: "user-1",
      stage: "warming",
      affinityScore: 0.5,
      trustScore: 0.4,
      stabilityScore: 0.6,
      lastUpdatedAt: new Date().toISOString()
    },
    timeline: [
      {
        id: "timeline-1",
        userId: "user-1",
        title: "Discussed continuity",
        description: "The user explained Waveary's long-term direction.",
        eventType: "fact",
        eventTime: new Date().toISOString(),
        importance: 0.7,
        linkedMemoryIds: ["memory-1"]
      }
    ],
    emotion: {
      userId: "user-1",
      primaryEmotion: "joy",
      intensity: 0.7,
      confidence: 0.6,
      windowStart: new Date().toISOString(),
      windowEnd: new Date().toISOString()
    }
  };

  return {
    ...base,
    ...overrides
  };
}

async function captureInstruction(request: ChatProviderRequest): Promise<string> {
  const recorded: Array<{ url: string; init: RequestInit | undefined }> = [];
  const provider = new OpenAICompatibleChatProvider({
    provider: "test-provider",
    apiKey: "test-key",
    baseURL: "https://example.com/v1",
    model: "test-model",
    fetchFn: async (url, init) => {
      recorded.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "mock reply" } }]
        }),
        { status: 200 }
      );
    }
  });

  await provider.generateReply(request);
  const body = JSON.parse(String(recorded[0]?.init?.body)) as {
    messages: Array<{ role: string; content: string }>;
  };
  return body.messages[0]?.content ?? "";
}

function createRelationship(stage: string): ChatProviderRequest["relationship"] {
  return {
    userId: "user-1",
    stage,
    affinityScore: stage === "new" ? 0.22 : stage === "warming" ? 0.5 : 0.74,
    trustScore: stage === "new" ? 0.18 : stage === "warming" ? 0.4 : 0.68,
    stabilityScore: stage === "new" ? 0.29 : stage === "warming" ? 0.6 : 0.77,
    lastUpdatedAt: new Date().toISOString()
  };
}
