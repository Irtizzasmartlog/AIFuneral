import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

export type GeminiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Call Gemini chat API with system prompt and message history.
 * Converts user/assistant messages to Gemini Content format (user -> "user", assistant -> "model").
 * Reads GEMINI_API_KEY from env. Uses GEMINI_MODEL or falls back to gemini-1.5-flash.
 */
export async function callGeminiChat({
  systemPrompt,
  messages,
}: {
  systemPrompt: string;
  messages: GeminiChatMessage[];
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 2048,
    },
  });

  const toContent = (m: GeminiChatMessage): Content => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  });

  if (messages.length === 0) {
    const chat = model.startChat();
    const result = await chat.sendMessage("Begin the funeral intake. Ask the first question.");
    return result.response.text() ?? "";
  }

  let history: Content[] = messages.slice(0, -1).map(toContent);
  const lastMsg = messages[messages.length - 1]!;

  if (history.length > 0 && history[0]!.role === "model") {
    history = [{ role: "user", parts: [{ text: "Begin the funeral intake questionnaire." }] }, ...history];
  }

  const chat = model.startChat({
    history: history.length > 0 ? history : undefined,
  });
  const result = await chat.sendMessage(lastMsg.content);
  return result.response.text() ?? "";
}
