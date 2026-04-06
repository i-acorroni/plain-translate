import { describe, expect, it } from "vitest";
import { generateMockRewrite } from "@/lib/mock-rewrite";

describe("generateMockRewrite", () => {
  it("returns deterministic output and flags ambiguous wording", () => {
    const source =
      "Pursuant to the policy, individuals shall submit the form as soon as possible and provide remuneration prior to Friday.";

    const first = generateMockRewrite(source);
    const second = generateMockRewrite(source);

    expect(second).toEqual(first);
    expect(first.plainText).toMatch(/under the policy/i);
    expect(first.plainText).toMatch(/people must submit the form/i);
    expect(first.ambiguityNote).toBeDefined();
    expect(first.unclearParts[0]).toContain("as soon as possible");
    expect(first.qualityChecks.importantMeaningPreserved).toBe("review_needed");
  });

  it("does not add English headings when the source does not look English", () => {
    const source =
      "Debe completar el formulario antes del viernes y enviarlo al departamento correspondiente.";

    const result = generateMockRewrite(source);

    expect(result.plainText).not.toContain("Main point");
    expect(result.plainText).not.toContain("What you need to do");
  });
});
