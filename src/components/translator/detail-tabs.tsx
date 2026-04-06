import {
  type DetailTab,
  type PlainLanguageResponse,
  qualityCheckLabels,
  qualityCheckOrder,
} from "@/lib/types";

type DetailTabsProps = {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  result: PlainLanguageResponse;
};

const tabs: Array<{ key: DetailTab; label: string }> = [
  { key: "quality", label: "Quality check" },
  { key: "changes", label: "What changed" },
  { key: "unclear", label: "Unclear parts" },
];

export function DetailTabs({
  activeTab,
  onTabChange,
  result,
}: DetailTabsProps) {
  return (
    <section className="surface-subtle mt-4 rounded-[28px] p-4 sm:p-5">
      <div
        role="tablist"
        aria-label="Rewrite details"
        className="flex flex-wrap gap-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`${tab.key}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`${tab.key}-panel`}
            data-active={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
            className="tab-button rounded-full px-3.5 py-2 text-sm font-medium"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
        {activeTab === "quality" ? <QualityChecks result={result} /> : null}
        {activeTab === "changes" ? <WhatChanged result={result} /> : null}
        {activeTab === "unclear" ? <UnclearParts result={result} /> : null}
      </div>
    </section>
  );
}

function QualityChecks({ result }: { result: PlainLanguageResponse }) {
  return (
    <div className="space-y-3">
      {qualityCheckOrder.map((key) => {
        const passed = result.qualityChecks[key] === "pass";

        return (
          <div
            key={key}
            className="panel-card flex flex-col gap-2 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm leading-6">{qualityCheckLabels[key]}</p>
            <span
              className={`${
                passed ? "status-pass" : "status-review"
              } inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]`}
            >
              {passed ? "Pass" : "Review needed"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WhatChanged({ result }: { result: PlainLanguageResponse }) {
  const hasContent =
    result.whatChanged.length > 0 ||
    result.difficultTerms.length > 0 ||
    result.suggestions.length > 0;

  if (!hasContent) {
    return (
      <p className="muted-copy text-sm leading-6">
        No additional rewrite notes were returned for this result.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {result.whatChanged.length > 0 ? (
        <div>
          <p className="muted-copy text-xs font-semibold uppercase tracking-[0.2em]">
            What changed
          </p>
          <ul className="mt-3 space-y-2">
            {result.whatChanged.map((item) => (
              <li
                key={item}
                className="panel-card rounded-2xl px-4 py-3 text-sm leading-6"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.difficultTerms.length > 0 ? (
        <div>
          <p className="muted-copy text-xs font-semibold uppercase tracking-[0.2em]">
            Difficult terms replaced
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {result.difficultTerms.map((term) => (
              <article
                key={`${term.original}-${term.replacement}`}
                className="panel-card rounded-2xl px-4 py-3"
              >
                <p className="text-sm font-semibold">{term.original}</p>
                <p className="accent-copy mt-1 text-sm leading-6">
                  {term.replacement}
                </p>
                {term.explanation ? (
                  <p className="muted-copy mt-2 text-sm leading-6">{term.explanation}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {result.suggestions.length > 0 ? (
        <div>
          <p className="muted-copy text-xs font-semibold uppercase tracking-[0.2em]">
            Suggestions for even clearer writing
          </p>
          <ul className="mt-3 space-y-2">
            {result.suggestions.map((item) => (
              <li
                key={item}
                className="panel-card rounded-2xl px-4 py-3 text-sm leading-6"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function UnclearParts({ result }: { result: PlainLanguageResponse }) {
  if (result.unclearParts.length === 0 && !result.ambiguityNote) {
    return (
      <p className="muted-copy text-sm leading-6">
        No obvious unclear sections were flagged in the original text.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {result.ambiguityNote ? (
        <div className="status-review rounded-2xl px-4 py-3 text-sm leading-6">
          {result.ambiguityNote}
        </div>
      ) : null}
      {result.unclearParts.map((item) => (
        <div
          key={item}
          className="panel-card rounded-2xl px-4 py-3 text-sm leading-6"
        >
          {item}
        </div>
      ))}
    </div>
  );
}
