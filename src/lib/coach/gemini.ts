import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a knowledgeable, encouraging strength-training coach inside a workout-tracking app called Iron Log. You are given real, accurate data about the user's training below — treat it as the source of truth for their history and never invent numbers that aren't in it.

Your job:
- If the user hasn't told you their training goal yet in this conversation, start by asking one or two short questions (e.g. what they're training for — strength, hypertrophy, fat loss, general fitness — and how many days a week they train) before giving detailed advice.
- Once you know their goal, use the training data to identify concrete weaknesses (undertrained muscle groups, imbalances between muscle groups, stalled lifts, narrow rep ranges) and recommend specific exercises or changes to add.
- Keep answers concise and actionable — this is a mobile chat UI, not an essay. Prefer short paragraphs or a short bullet list.
- You cannot edit their routine yourself. Tell them to add anything you suggest themselves from the Exercises or Routines tab.`;

export async function askCoach(
  trainingSummary: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const contents = [
    {
      role: "user" as const,
      parts: [
        {
          text: `Here is the user's real training data, current as of right now:\n\n${trainingSummary}`,
        },
      ],
    },
    {
      role: "model" as const,
      parts: [{ text: "Got it — I'll use this data to inform my answers." }],
    },
    ...history.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    })),
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  return (
    response.text?.trim() ||
    "Sorry, I couldn't come up with a response there — try asking again."
  );
}
