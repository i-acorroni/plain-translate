import {
  createDefaultQualityChecks,
  type DifficultTerm,
  type PlainLanguageResponse,
} from "@/lib/types";

type ReplacementRule = {
  original: string;
  replacement: string;
  explanation: string;
};

type SentenceRewrite = {
  original: string;
  rewritten: string;
  changed: boolean;
  instruction: boolean;
};

const replacementRules: ReplacementRule[] = [
  {
    original: "pursuant to",
    replacement: "under",
    explanation: "Uses a more familiar legal phrase.",
  },
  {
    original: "prior to",
    replacement: "before",
    explanation: "Uses a more common time reference.",
  },
  {
    original: "subsequent to",
    replacement: "after",
    explanation: "Uses a simpler sequence word.",
  },
  {
    original: "in order to",
    replacement: "to",
    explanation: "Removes unnecessary extra words.",
  },
  {
    original: "utilize",
    replacement: "use",
    explanation: "Uses everyday wording.",
  },
  {
    original: "facilitate",
    replacement: "help",
    explanation: "Uses a more direct verb.",
  },
  {
    original: "commence",
    replacement: "start",
    explanation: "Uses a more familiar verb.",
  },
  {
    original: "terminate",
    replacement: "end",
    explanation: "Uses simpler wording while keeping the effect.",
  },
  {
    original: "approximately",
    replacement: "about",
    explanation: "Uses shorter everyday language.",
  },
  {
    original: "obtain",
    replacement: "get",
    explanation: "Uses a more familiar verb.",
  },
  {
    original: "individuals",
    replacement: "people",
    explanation: "Uses a more familiar noun.",
  },
  {
    original: "remuneration",
    replacement: "payment",
    explanation: "Uses clearer business language.",
  },
  {
    original: "shall",
    replacement: "must",
    explanation: "Keeps the obligation but makes it clearer.",
  },
  {
    original: "including but not limited to",
    replacement: "including",
    explanation: "Removes legal padding while preserving the open list.",
  },
  {
    original: "at this point in time",
    replacement: "now",
    explanation: "Uses direct wording.",
  },
  {
    original: "endeavour",
    replacement: "try",
    explanation: "Uses a more familiar verb.",
  },
];

const ambiguousPhrases = [
  "as soon as possible",
  "where appropriate",
  "reasonable",
  "from time to time",
  "as necessary",
  "if applicable",
  "without undue delay",
  "promptly",
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function preserveMatchCase(match: string, replacement: string) {
  if (match.toUpperCase() === match) {
    return replacement.toUpperCase();
  }

  if (match[0] && match[0] === match[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

function ensureSentenceEnding(value: string) {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function splitIntoSentences(value: string) {
  const normalized = normalizeSpaces(value);

  if (!normalized) {
    return [];
  }

  const matches = normalized.match(/[^.!?]+(?:[.!?]+|$)/g);
  return matches
    ? matches.map((item) => item.trim()).filter(Boolean)
    : [normalized];
}

function splitLongSentence(value: string) {
  const normalized = normalizeSpaces(value);

  if (normalized.length < 165 && !/[;:]/.test(normalized)) {
    return [normalized];
  }

  const strategies = [
    /;\s+/,
    /:\s+/,
    /,\s+(?=(?:and|but|or|so|because|which|who|that)\b)/i,
  ];

  for (const strategy of strategies) {
    const parts = normalized
      .split(strategy)
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      return parts.map((item) => ensureSentenceEnding(item));
    }
  }

  return [normalized];
}

function isInstructionSentence(value: string) {
  return /\b(must|need to|should|please|submit|send|complete|pay|contact|call|provide|sign|return|attach|apply)\b/i.test(
    value,
  );
}

function dedupeDifficultTerms(terms: DifficultTerm[]) {
  const seen = new Set<string>();

  return terms.filter((term) => {
    const key = `${term.original}:${term.replacement}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function rewriteSentence(sentence: string) {
  const original = normalizeSpaces(sentence);
  let rewritten = original;
  const difficultTerms: DifficultTerm[] = [];
  let changed = false;

  for (const rule of replacementRules) {
    const pattern = new RegExp(`\\b${escapeRegExp(rule.original)}\\b`, "gi");
    let matched = false;

    rewritten = rewritten.replace(pattern, (match) => {
      matched = true;
      changed = true;
      return preserveMatchCase(match, rule.replacement);
    });

    if (matched) {
      difficultTerms.push({
        original: rule.original,
        replacement: rule.replacement,
        explanation: rule.explanation,
      });
    }
  }

  rewritten = rewritten
    .replace(/\bPlease be advised that\b/gi, "Please note that")
    .replace(/\bfor the purpose of\b/gi, "to")
    .replace(/\bwith regard to\b/gi, "about")
    .replace(/\bin the event that\b/gi, "if");

  const splitParts = splitLongSentence(rewritten);
  if (splitParts.length > 1) {
    changed = true;
    rewritten = splitParts.join(" ");
  }

  rewritten = normalizeSpaces(rewritten);

  return {
    result: {
      original,
      rewritten,
      changed: changed || rewritten !== original,
      instruction: isInstructionSentence(rewritten),
    } satisfies SentenceRewrite,
    difficultTerms,
  };
}

function rewriteParagraph(paragraph: string) {
  const lines = paragraph.split("\n");
  const sentenceRewrites: SentenceRewrite[] = [];
  const difficultTerms: DifficultTerm[] = [];

  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return "";
    }

    const listMatch = trimmed.match(/^([-*•]|\d+\.)\s+(.*)$/);
    const prefix = listMatch?.[1];
    const content = listMatch?.[2] ?? trimmed;
    const rewrittenSentences = splitIntoSentences(content).map((sentence) => {
      const rewritten = rewriteSentence(sentence);
      sentenceRewrites.push(rewritten.result);
      difficultTerms.push(...rewritten.difficultTerms);
      return rewritten.result.rewritten;
    });

    const lineText = rewrittenSentences.join(" ");
    return prefix ? `${prefix} ${lineText}` : lineText;
  });

  return {
    text: rewrittenLines.join("\n").trim(),
    sentenceRewrites,
    difficultTerms,
  };
}

function chunkSentences(sentences: string[], size: number) {
  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += size) {
    chunks.push(sentences.slice(index, index + size).join(" "));
  }

  return chunks;
}

function looksLikeEnglish(value: string) {
  const lowered = ` ${value.toLowerCase()} `;
  const markers = [
    " the ",
    " and ",
    " to ",
    " of ",
    " for ",
    " with ",
    " if ",
    " must ",
  ];

  return markers.filter((marker) => lowered.includes(marker)).length >= 3;
}

function buildPlainText(
  sourceText: string,
  rewrittenParagraphs: string[],
  rewrites: SentenceRewrite[],
) {
  const hasListFormatting = /^\s*(?:[-*•]|\d+\.)\s+/m.test(sourceText);
  const canAddEnglishHeadings = looksLikeEnglish(sourceText);
  const instructionRewrites = rewrites.filter((item) => item.instruction);
  const detailSentences = rewrites
    .filter((item) => !item.instruction)
    .map((item) => item.rewritten);

  if (
    canAddEnglishHeadings &&
    !hasListFormatting &&
    instructionRewrites.length >= 2 &&
    sourceText.length > 260
  ) {
    const introSentences = detailSentences.slice(0, 2);
    const remainingDetails = detailSentences.slice(2);
    const sections: string[] = [];

    if (introSentences.length > 0) {
      sections.push(`Main point\n\n${introSentences.join(" ")}`);
    }

    sections.push(
      `What you need to do\n\n${instructionRewrites
        .map((item) => `- ${item.rewritten.replace(/^[-*•]\s*/, "")}`)
        .join("\n")}`,
    );

    if (remainingDetails.length > 0) {
      sections.push(
        `Important details\n\n${chunkSentences(remainingDetails, 2).join("\n\n")}`,
      );
    }

    return sections.join("\n\n");
  }

  if (
    canAddEnglishHeadings &&
    !hasListFormatting &&
    (rewrittenParagraphs.length > 1 || sourceText.length > 480)
  ) {
    const [firstParagraph, ...rest] = rewrittenParagraphs;
    const sections = [`Main point\n\n${firstParagraph}`];

    if (rest.length > 0) {
      sections.push(`Details\n\n${rest.join("\n\n")}`);
    }

    return sections.join("\n\n");
  }

  return rewrittenParagraphs.join("\n\n");
}

function buildUnclearParts(sourceText: string) {
  const lowered = sourceText.toLowerCase();

  return ambiguousPhrases
    .filter((phrase) => lowered.includes(phrase))
    .map((phrase) => `The phrase "${phrase}" may need a more specific meaning.`);
}

function buildWhatChanged(
  difficultTerms: DifficultTerm[],
  longSentenceCount: number,
  plainText: string,
  instructionCount: number,
) {
  const changes: string[] = [];

  if (difficultTerms.length > 0) {
    changes.push("Replaced formal or technical wording with more familiar terms.");
  }

  if (longSentenceCount > 0) {
    changes.push("Split long sentences into shorter parts to improve readability.");
  }

  if (instructionCount >= 2 && plainText.includes("What you need to do")) {
    changes.push("Grouped key actions into a clearer step-by-step section.");
  }

  if (plainText.includes("Main point")) {
    changes.push("Added headings to make the main points easier to scan.");
  }

  if (changes.length === 0) {
    changes.push("Kept the meaning and details while smoothing the wording.");
  }

  return changes;
}

function buildSuggestions(sourceText: string, unclearParts: string[]) {
  const suggestions: string[] = [];

  if (unclearParts.length > 0) {
    suggestions.push("Replace vague timing or conditions with specific dates, deadlines, or thresholds.");
  }

  if (sourceText.length > 900) {
    suggestions.push("Break the original into shorter sections with one topic per paragraph.");
  }

  if (!/\n{2,}/.test(sourceText) && sourceText.length > 320) {
    suggestions.push("Use short headings to separate the main point, actions, and detail.");
  }

  return suggestions;
}

function buildCompareNotes(rewrites: SentenceRewrite[]) {
  return rewrites
    .filter((item) => item.changed)
    .slice(0, 4)
    .map((item, index) => ({
      label: `Change ${index + 1}`,
      before: item.original,
      after: item.rewritten,
    }));
}

export function generateMockRewrite(sourceText: string): PlainLanguageResponse {
  const normalizedSource = sourceText.replace(/\r\n/g, "\n").trim();
  const paragraphs = normalizedSource
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const rewrittenParagraphs: string[] = [];
  const sentenceRewrites: SentenceRewrite[] = [];
  const difficultTerms: DifficultTerm[] = [];

  for (const paragraph of paragraphs) {
    const rewrittenParagraph = rewriteParagraph(paragraph);
    rewrittenParagraphs.push(rewrittenParagraph.text);
    sentenceRewrites.push(...rewrittenParagraph.sentenceRewrites);
    difficultTerms.push(...rewrittenParagraph.difficultTerms);
  }

  const uniqueTerms = dedupeDifficultTerms(difficultTerms);
  const unclearParts = buildUnclearParts(normalizedSource);
  const longSentenceCount = splitIntoSentences(normalizedSource).filter(
    (sentence) => sentence.length > 165,
  ).length;
  const plainText = buildPlainText(normalizedSource, rewrittenParagraphs, sentenceRewrites);
  const qualityChecks = createDefaultQualityChecks("review_needed");

  qualityChecks.mainMessageClear = plainText.length > 0 ? "pass" : "review_needed";
  qualityChecks.structureImproved =
    plainText.includes("Main point") ||
    plainText.includes("What you need to do") ||
    rewrittenParagraphs.length > 1
      ? "pass"
      : "review_needed";
  qualityChecks.jargonReduced =
    uniqueTerms.length > 0 || replacementRules.every((rule) => !normalizedSource.toLowerCase().includes(rule.original))
      ? "pass"
      : "review_needed";
  qualityChecks.longSentencesSimplified =
    longSentenceCount === 0 || sentenceRewrites.some((item) => item.changed)
      ? "pass"
      : "review_needed";
  qualityChecks.actionPointsEasyToIdentify =
    sentenceRewrites.some((item) => item.instruction)
      ? plainText.includes("What you need to do")
        ? "pass"
        : "review_needed"
      : "pass";

  return {
    plainText,
    qualityChecks,
    whatChanged: buildWhatChanged(
      uniqueTerms,
      longSentenceCount,
      plainText,
      sentenceRewrites.filter((item) => item.instruction).length,
    ),
    difficultTerms: uniqueTerms,
    unclearParts,
    suggestions: buildSuggestions(normalizedSource, unclearParts),
    compareNotes: buildCompareNotes(sentenceRewrites),
    ambiguityNote:
      unclearParts.length > 0
        ? "This section may still be unclear because the original text is ambiguous."
        : undefined,
    usedMock: true,
    model: "mock-rewrite",
  };
}
