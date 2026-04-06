import {
  createDefaultQualityChecks,
  type CompareNote,
  type DifficultTerm,
  type PlainLanguageResponse,
  type RewriteRequest,
  qualityCheckOrder,
} from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDifficultTerms(value: unknown): DifficultTerm[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const terms: DifficultTerm[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const original = toOptionalString(item.original);
    const replacement = toOptionalString(item.replacement);

    if (!original || !replacement) {
      continue;
    }

    terms.push({
      original,
      replacement,
      explanation: toOptionalString(item.explanation),
    });
  }

  return terms;
}

function toCompareNotes(value: unknown): CompareNote[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const notes: CompareNote[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const label = toOptionalString(item.label);
    const after = toOptionalString(item.after);

    if (!label || !after) {
      continue;
    }

    notes.push({
      label,
      after,
      before: toOptionalString(item.before),
    });
  }

  return notes;
}

function toQualityChecks(value: unknown) {
  const record = isRecord(value) ? value : {};
  const checks = createDefaultQualityChecks();

  for (const key of qualityCheckOrder) {
    checks[key] = record[key] === "pass" ? "pass" : "review_needed";
  }

  return checks;
}

export function parseRewriteRequest(
  value: unknown,
): { ok: true; value: RewriteRequest } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: "The request body must be a JSON object.",
    };
  }

  const sourceText = toOptionalString(value.sourceText);

  if (!sourceText) {
    return {
      ok: false,
      error: "Enter the original text before converting it.",
    };
  }

  if (sourceText.length > 18000) {
    return {
      ok: false,
      error: "The text is too long for this version of the tool.",
    };
  }

  return {
    ok: true,
    value: { sourceText },
  };
}

export function normalizePlainLanguageResponse(
  value: unknown,
  meta: Pick<PlainLanguageResponse, "usedMock" | "model">,
): PlainLanguageResponse {
  if (!isRecord(value)) {
    throw new Error("The model response was not a JSON object.");
  }

  const plainText = toOptionalString(value.plainText);

  if (!plainText) {
    throw new Error("The model response did not include plainText.");
  }

  return {
    plainText,
    qualityChecks: toQualityChecks(value.qualityChecks),
    whatChanged: toStringArray(value.whatChanged),
    difficultTerms: toDifficultTerms(value.difficultTerms),
    unclearParts: toStringArray(value.unclearParts),
    suggestions: toStringArray(value.suggestions),
    compareNotes: toCompareNotes(value.compareNotes),
    ambiguityNote: toOptionalString(value.ambiguityNote),
    usedMock: meta.usedMock,
    model: meta.model,
  };
}

export function extractJsonObject(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("The model did not return valid JSON.");
    }

    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  }
}
