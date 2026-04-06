import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { TranslatorApp } from "@/components/translator/translator-app";
import { draftStorageKey } from "@/lib/storage";
import type { PlainLanguageResponse } from "@/lib/types";

const sampleResponse: PlainLanguageResponse = {
  plainText:
    "Main point\n\nPeople must complete the form before Friday.\n\nDetails\n\nSend it to the department by email.",
  qualityChecks: {
    mainMessageClear: "pass",
    structureImproved: "pass",
    jargonReduced: "pass",
    longSentencesSimplified: "pass",
    actionPointsEasyToIdentify: "pass",
    importantMeaningPreserved: "review_needed",
  },
  whatChanged: ["Simplified the wording and clarified the deadline."],
  difficultTerms: [
    {
      original: "prior to",
      replacement: "before",
      explanation: "Uses a more familiar time reference.",
    },
  ],
  unclearParts: [],
  suggestions: ["Add a contact name if readers may need help."],
  compareNotes: [
    {
      label: "Change 1",
      before: "Individuals shall complete the form prior to Friday.",
      after: "People must complete the form before Friday.",
    },
  ],
  usedMock: true,
  model: "mock-rewrite",
};

describe("TranslatorApp", () => {
  beforeEach(() => {
    window.localStorage.clear();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sampleResponse,
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("submits text, renders the result, and switches to compare mode", async () => {
    const user = userEvent.setup();
    render(<TranslatorApp />);

    await user.type(
      screen.getByLabelText(/original text/i),
      "Individuals shall complete the form prior to Friday.",
    );
    await user.click(
      screen.getByRole("button", { name: /convert to plain language/i }),
    );

    expect(
      await screen.findByDisplayValue(/People must complete the form before Friday/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mock mode/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /compare/i }));

    expect(await screen.findByText("Change 1")).toBeInTheDocument();
    expect(
      screen.getByText("Plain language", { selector: "p" }),
    ).toBeInTheDocument();
  });

  it("clears the draft and result state", async () => {
    const user = userEvent.setup();
    render(<TranslatorApp />);

    const input = screen.getByLabelText(/original text/i);
    await user.type(input, "Prior to payment, complete the form.");

    await waitFor(() => {
      expect(window.localStorage.getItem(draftStorageKey)).toContain(
        "Prior to payment",
      );
    });

    await user.click(
      screen.getByRole("button", { name: /convert to plain language/i }),
    );
    await screen.findByDisplayValue(/People must complete/i);

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.getByLabelText(/original text/i)).toHaveValue("");
    expect(window.localStorage.getItem(draftStorageKey)).toBeNull();
  });
});
