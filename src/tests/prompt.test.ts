import { describe, expect, it } from "vitest";
import {
  buildPlainLanguageSystemPrompt,
  buildPlainLanguageUserPrompt,
} from "@/lib/prompt";
import { defaultAudience } from "@/lib/types";

describe("prompt builders", () => {
  it("uses a legal-policy-focused system prompt with the canonical output schema", () => {
    const prompt = buildPlainLanguageSystemPrompt();

    expect(prompt).toContain("You are a plain-language rewriting assistant.");
    expect(prompt).toContain("You are not a summarizer.");
    expect(prompt).toContain("Preserve duties, rights, permissions, prohibitions");
    expect(prompt).toContain('"qualityChecklist"');
    expect(prompt).toContain('"datesAndDeadlinesPreserved"');
    expect(prompt).toContain("Return JSON only.");
  });

  it("fills the user prompt context with defaults when optional values are missing", () => {
    const prompt = buildPlainLanguageUserPrompt({
      sourceText: "The applicant shall file the notice before Friday.",
    });

    expect(prompt).toContain(`Audience: ${defaultAudience}`);
    expect(prompt).toContain(
      "Purpose: Help the reader find what matters, understand it, and use the text correctly.",
    );
    expect(prompt).toContain(
      "Document type: Not provided. Infer only if the source makes it obvious.",
    );
    expect(prompt).toContain("<source_text>");
  });
});
