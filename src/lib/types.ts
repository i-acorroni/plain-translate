export const defaultAudience =
  "An informed member of the public with no specialist training";

export const qualityChecklistLabels = {
  mainPointClear: "Main point is clear",
  actionsClear: "Actions are clear",
  datesAndDeadlinesPreserved: "Dates and deadlines preserved",
  legalEffectPreserved: "Legal effect preserved",
  jargonReduced: "Jargon reduced or explained",
  audienceFit: "Fits the stated audience",
} as const;

export type QualityChecklistKey = keyof typeof qualityChecklistLabels;
export type QualityChecklistStatus = "pass" | "review_needed";
export type QualityChecklist = Record<
  QualityChecklistKey,
  QualityChecklistStatus
>;
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
  qualityChecklist: QualityChecklist;
  changeNotes: string[];
  difficultTerms: DifficultTerm[];
  unclearSections: string[];
  suggestions: string[];
  compareNotes: CompareNote[];
  ambiguityNote?: string;
  usedMock: boolean;
  model?: string;
}

export interface RewriteRequest {
  sourceText: string;
  audience?: string;
  purpose?: string;
  documentType?: string;
}

export const qualityChecklistOrder = Object.keys(
  qualityChecklistLabels,
) as QualityChecklistKey[];

export function createDefaultQualityChecklist(
  status: QualityChecklistStatus = "review_needed",
): QualityChecklist {
  return Object.fromEntries(
    qualityChecklistOrder.map((key) => [key, status]),
  ) as QualityChecklist;
}
