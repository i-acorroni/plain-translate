import { describe, expect, it } from "vitest";
import {
  normalizePlainLanguageResponse,
  parseRewriteRequest,
} from "@/lib/rewrite-schema";

describe("rewrite schema", () => {
  it("parses optional prompt context fields", () => {
    const result = parseRewriteRequest({
      sourceText: "Please submit the form before 5 May 2026.",
      audience: " Residents ",
      purpose: " Complete the application correctly ",
      documentType: " Notice ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        sourceText: "Please submit the form before 5 May 2026.",
        audience: "Residents",
        purpose: "Complete the application correctly",
        documentType: "Notice",
      },
    });
  });

  it("normalizes the canonical model response shape", () => {
    const result = normalizePlainLanguageResponse(
      {
        plainText: "People must submit the form before Friday.",
        qualityChecklist: {
          mainPointClear: "pass",
          actionsClear: "pass",
          datesAndDeadlinesPreserved: "pass",
          legalEffectPreserved: "pass",
          jargonReduced: "pass",
          audienceFit: "review_needed",
        },
        changeNotes: ["Clarified the deadline."],
        unclearSections: ["'Promptly' is still vague in the source."],
        difficultTerms: [
          {
            original: "shall",
            replacement: "must",
            explanation: "Makes the duty clearer without changing it.",
          },
        ],
        compareNotes: [
          {
            label: "Change 1",
            before: "The applicant shall submit the form prior to Friday.",
            after: "People must submit the form before Friday.",
          },
        ],
      },
      { usedMock: false, model: "test-model" },
    );

    expect(result.qualityChecklist.legalEffectPreserved).toBe("pass");
    expect(result.changeNotes).toEqual(["Clarified the deadline."]);
    expect(result.unclearSections).toEqual([
      "'Promptly' is still vague in the source.",
    ]);
    expect(result.model).toBe("test-model");
  });

  it("accepts older alias fields when normalizing model output", () => {
    const result = normalizePlainLanguageResponse(
      {
        plainText: "People must submit the form before Friday.",
        qualityChecks: {
          mainMessageClear: "pass",
          actionPointsEasyToIdentify: "pass",
          importantMeaningPreserved: "pass",
          jargonReduced: "review_needed",
        },
        whatChanged: ["Simplified the wording."],
        unclearParts: ["'As soon as possible' is vague."],
      },
      { usedMock: true, model: "mock-rewrite" },
    );

    expect(result.qualityChecklist.mainPointClear).toBe("pass");
    expect(result.qualityChecklist.actionsClear).toBe("pass");
    expect(result.qualityChecklist.legalEffectPreserved).toBe("pass");
    expect(result.qualityChecklist.datesAndDeadlinesPreserved).toBe(
      "review_needed",
    );
    expect(result.changeNotes).toEqual(["Simplified the wording."]);
    expect(result.unclearSections).toEqual(["'As soon as possible' is vague."]);
  });
});
