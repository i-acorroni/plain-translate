import {
  createDefaultQualityChecklist,
  type CompareNote,
  type DifficultTerm,
  type PlainLanguageResponse,
  type QualityChecklist,
  type QualityChecklistKey,
  type RewriteRequest,
  qualityChecklistOrder,
} from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function parseOptionalInput(
  value: unknown,
  label: string,
  maxLength: number,
) {
  const parsed = toOptionalString(value);

  if (!parsed) {
    return { ok: true as const, value: undefined };
  }

  if (parsed.length > maxLength) {
    return {
      ok: false as const,
      error: `${label} is too long for this version of the tool.`,
    };
  }

  return { ok: true as const, value: parsed };
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

const qualityChecklistAliases: Record<QualityChecklistKey, string[]> = {
  mainPointClear: ["mainPointClear", "mainMessageClear"],
  actionsClear: ["actionsClear", "actionPointsEasyToIdentify"],
  datesAndDeadlinesPreserved: ["datesAndDeadlinesPreserved"],
  legalEffectPreserved: ["legalEffectPreserved", "importantMeaningPreserved"],
  jargonReduced: ["jargonReduced"],
  audienceFit: ["audienceFit"],
};

function toQualityChecklist(value: unknown): QualityChecklist {
  const record = isRecord(value) ? value : {};
  const checklist = createDefaultQualityChecklist();

  for (const key of qualityChecklistOrder) {
    const matchedKey = qualityChecklistAliases[key].find(
      (alias) => record[alias] === "pass" || record[alias] === "review_needed",
    );

    if (!matchedKey) {
      continue;
    }

    checklist[key] = record[matchedKey] === "pass" ? "pass" : "review_needed";
  }

  return checklist;
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

  const audience = parseOptionalInput(value.audience, "Audience", 240);
  if (!audience.ok) {
    return audience;
  }

  const purpose = parseOptionalInput(value.purpose, "Purpose", 240);
  if (!purpose.ok) {
    return purpose;
  }

  const documentType = parseOptionalInput(value.documentType, "Document type", 120);
  if (!documentType.ok) {
    return documentType;
  }

  return {
    ok: true,
    value: {
      sourceText,
      audience: audience.value,
      purpose: purpose.value,
      documentType: documentType.value,
    },
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
    qualityChecklist: toQualityChecklist(value.qualityChecklist ?? value.qualityChecks),
    changeNotes: toStringArray(value.changeNotes ?? value.whatChanged),
    difficultTerms: toDifficultTerms(value.difficultTerms),
    unclearSections: toStringArray(value.unclearSections ?? value.unclearParts),
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
