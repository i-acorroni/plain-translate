import { buildPlainLanguageSystemPrompt, buildPlainLanguageUserPrompt } from "@/lib/prompt";
import {
  extractJsonObject,
  normalizePlainLanguageResponse,
} from "@/lib/rewrite-schema";
import type { PlainLanguageResponse } from "@/lib/types";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

function extractMessageContent(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("choices" in payload) ||
    !Array.isArray(payload.choices) ||
    payload.choices.length === 0
  ) {
    throw new Error("OpenRouter returned an unexpected response shape.");
  }

  const firstChoice = payload.choices[0];

  if (
    typeof firstChoice !== "object" ||
    firstChoice === null ||
    !("message" in firstChoice)
  ) {
    throw new Error("OpenRouter did not return a message.");
  }

  const message = firstChoice.message;

  if (
    typeof message !== "object" ||
    message === null ||
    !("content" in message)
  ) {
    throw new Error("OpenRouter returned a message without content.");
  }

  const { content } = message;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          typeof part === "object" &&
          part !== null &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("\n");
  }

  throw new Error("OpenRouter returned content in an unsupported format.");
}

export function hasOpenRouterConfig() {
  return Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL);
}

export async function generateOpenRouterRewrite(
  sourceText: string,
): Promise<PlainLanguageResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;

  if (!apiKey || !model) {
    throw new Error("OpenRouter is not configured.");
  }

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_SITE_URL
        ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
        : {}),
      ...(process.env.OPENROUTER_APP_NAME
        ? { "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME }
        : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: buildPlainLanguageSystemPrompt(),
        },
        {
          role: "user",
          content: buildPlainLanguageUserPrompt(sourceText),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter request failed with ${response.status}: ${errorBody.slice(0, 300)}`,
    );
  }

  const payload = await response.json();
  const content = extractMessageContent(payload);
  const parsed = extractJsonObject(content);

  return normalizePlainLanguageResponse(parsed, {
    usedMock: false,
    model,
  });
}
