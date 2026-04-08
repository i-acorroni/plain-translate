import { describe, expect, it } from "vitest";
import { generateMockRewrite } from "@/lib/mock-rewrite";

describe("generateMockRewrite", () => {
  it("returns deterministic output and preserves legal signals in the checklist", () => {
    const source =
      "Pursuant to the policy, individuals shall submit the form as soon as possible and provide remuneration prior to Friday.";

    const first = generateMockRewrite(source);
    const second = generateMockRewrite(source);

    expect(second).toEqual(first);
    expect(first.plainText).toMatch(/under the policy/i);
    expect(first.plainText).toMatch(/people must submit the form/i);
    expect(first.ambiguityNote).toBeDefined();
    expect(first.unclearSections[0]).toContain("as soon as possible");
    expect(first.qualityChecklist.legalEffectPreserved).toBe("pass");
    expect(first.qualityChecklist.datesAndDeadlinesPreserved).toBe("pass");
  });

  it("does not add English headings when the source does not look English", () => {
    const source =
      "Debe completar el formulario antes del viernes y enviarlo al departamento correspondiente.";

    const result = generateMockRewrite(source);

    expect(result.plainText).not.toContain("Main point");
    expect(result.plainText).not.toContain("What you need to do");
  });

  it("uses document-type-aware headings in mock mode when the input looks like policy text", () => {
    const source =
      "Employees must report any suspected conflict of interest within 5 business days. They must also provide supporting records when the compliance office asks for them. They must not approve related payments until the review is complete. If they are unsure whether a conflict exists, they must contact the compliance office before taking further action.";

    const result = generateMockRewrite({
      sourceText: source,
      documentType: "policy",
    });

    expect(result.plainText).toContain("Key rules");
  });
});
