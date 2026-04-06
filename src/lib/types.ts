export const qualityCheckLabels = {
  mainMessageClear: "Main message is clear",
  structureImproved: "Structure improved",
  jargonReduced: "Jargon reduced or explained",
  longSentencesSimplified: "Long sentences simplified",
  actionPointsEasyToIdentify: "Action points are easy to identify",
  importantMeaningPreserved: "Important meaning preserved",
} as const;

export type QualityCheckKey = keyof typeof qualityCheckLabels;
export type QualityCheckStatus = "pass" | "review_needed";
export type QualityChecks = Record<QualityCheckKey, QualityCheckStatus>;
export type DetailTab = "quality" | "changes" | "unclear";

export interface CompareNote {
  label: string;
  before?: string;
  after: string;
}

export interface DifficultTerm {
  original: string;
  replacement: string;
  explanation?: string;
}

export interface PlainLanguageResponse {
  plainText: string;
  qualityChecks: QualityChecks;
  whatChanged: string[];
  difficultTerms: DifficultTerm[];
  unclearParts: string[];
  suggestions: string[];
  compareNotes: CompareNote[];
  ambiguityNote?: string;
  usedMock: boolean;
  model?: string;
}

export interface RewriteRequest {
  sourceText: string;
}

export const qualityCheckOrder = Object.keys(
  qualityCheckLabels,
) as QualityCheckKey[];

export function createDefaultQualityChecks(
  status: QualityCheckStatus = "review_needed",
): QualityChecks {
  return Object.fromEntries(
    qualityCheckOrder.map((key) => [key, status]),
  ) as QualityChecks;
}
