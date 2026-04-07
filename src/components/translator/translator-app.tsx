"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CompareView } from "@/components/translator/compare-view";
import { DetailTabs } from "@/components/translator/detail-tabs";
import { TranslatorLogo } from "@/components/translator/translator-logo";
import { ThemeToggle } from "@/components/translator/theme-toggle";
import { useLocalDraft } from "@/hooks/use-local-draft";
import type { DetailTab, PlainLanguageResponse } from "@/lib/types";

const editorHeightClass = "min-h-[16.5rem] sm:min-h-[20rem] lg:min-h-[22rem]";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getStatusText(
  result: PlainLanguageResponse | null,
  isLoading: boolean,
  errorMessage: string,
) {
  if (isLoading) {
    return "Rewriting for clarity...";
  }

  if (errorMessage) {
    return errorMessage;
  }

  if (result) {
    return result.usedMock
      ? "Mock rewrite ready. Add OpenRouter keys for live AI output."
      : "Plain-language version ready.";
  }

  return "Paste difficult text on the left and convert it when you are ready.";
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function TranslatorApp() {
  const { value: sourceText, setValue: setSourceText, clear } = useLocalDraft("");
  const [result, setResult] = useState<PlainLanguageResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [activeTab, setActiveTab] = useState<DetailTab>("quality");
  const [compareMode, setCompareMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const isLoading = isSubmitting || isPending;
  const outputCharacters = result?.plainText.length ?? 0;
  const outputFooterNote =
    copyState === "copied"
      ? "Copied"
      : copyState === "failed"
        ? "Copy failed"
        : result?.usedMock
          ? "Mock mode"
          : "";

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  async function handleConvert() {
    if (!sourceText.trim()) {
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setErrorMessage("");
    setCopyState("idle");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceText }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as PlainLanguageResponse | { error?: string };

      if (!response.ok) {
        throw new Error(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "The rewrite could not be generated.",
        );
      }

      startTransition(() => {
        setResult(payload as PlainLanguageResponse);
        setActiveTab(
          (payload as PlainLanguageResponse).unclearParts.length > 0
            ? "unclear"
            : "quality",
        );
        setCompareMode(false);
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The rewrite could not be generated.",
      );
    } finally {
      setIsSubmitting(false);
      abortRef.current = null;
    }
  }

  function handleClear() {
    abortRef.current?.abort();
    clear();
    setResult(null);
    setErrorMessage("");
    setCopyState("idle");
    setActiveTab("quality");
    setCompareMode(false);
  }

  async function handleCopy() {
    if (!result?.plainText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.plainText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[92rem] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <TranslatorLogo />
          <h1 className="display-copy mt-3 text-4xl leading-tight sm:text-5xl">
            Turn complex writing into plain language.
          </h1>
          <p className="muted-copy mt-4 max-w-2xl text-base leading-7 sm:text-lg">
            Rewrite dense text so people can find what they need, understand it,
            and use it with more confidence.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="surface-panel rounded-[34px] p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)]">
          <section className="surface-subtle rounded-[30px] p-4 sm:p-5">
            <div className="mb-4">
              <div>
                <p className="muted-copy text-xs font-semibold uppercase tracking-[0.24em]">
                  Original text
                </p>
                <p className="mt-1 text-sm">
                  Paste or type the source material.
                </p>
              </div>
            </div>
            <div
              className={`editor-frame flex ${editorHeightClass} flex-col rounded-[28px] p-4 sm:p-5`}
            >
              <textarea
                aria-label="Original text"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder="Paste legal, public, academic, business, or healthcare text here."
                className="scroll-soft min-h-0 flex-1 resize-none bg-transparent text-base leading-7 outline-none"
              />
              <div className="editor-meta-row mt-4 flex items-center justify-end pt-3">
                <span className="editor-meta">{formatCount(sourceText.length)} chars</span>
              </div>
            </div>
          </section>

          <div className="hidden items-center justify-center lg:flex">
            <div className="pill flex h-12 w-12 items-center justify-center rounded-full text-xl">
              ⇄
            </div>
          </div>

          <section className="surface-subtle rounded-[30px] p-4 sm:p-5">
            <div className="mb-4">
              <div>
                <p className="muted-copy text-xs font-semibold uppercase tracking-[0.24em]">
                  Plain language version
                </p>
                <p className="mt-1 text-sm">
                  Clearer wording with the original meaning intact.
                </p>
              </div>
            </div>
            <div
              className={`editor-frame flex ${editorHeightClass} flex-col rounded-[28px] p-4 sm:p-5`}
            >
              <div className="min-h-0 flex-1">
                {compareMode && result ? (
                  <CompareView result={result} />
                ) : (
                  <>
                    {isLoading ? (
                      <div className="flex h-full min-h-[14rem] flex-col justify-center gap-3 sm:min-h-[18rem]">
                        <div className="skeleton-bar h-4 w-3/4 animate-pulse rounded-full" />
                        <div className="skeleton-bar h-4 w-full animate-pulse rounded-full" />
                        <div className="skeleton-bar h-4 w-5/6 animate-pulse rounded-full" />
                        <div className="skeleton-bar h-4 w-2/3 animate-pulse rounded-full" />
                      </div>
                    ) : errorMessage ? (
                      <div className="flex h-full min-h-[14rem] items-center justify-center sm:min-h-[18rem]">
                        <div className="status-review max-w-md rounded-[24px] px-5 py-4 text-sm leading-6">
                          {errorMessage}
                        </div>
                      </div>
                    ) : result ? (
                      <textarea
                        aria-label="Plain language version"
                        readOnly
                        value={result.plainText}
                        className="scroll-soft min-h-0 h-full w-full resize-none bg-transparent text-base leading-7 outline-none"
                      />
                    ) : (
                      <div className="flex h-full min-h-[14rem] items-center justify-center sm:min-h-[18rem]">
                        <div className="max-w-md text-center">
                          <p className="display-copy text-3xl">Ready to translate</p>
                          <p className="muted-copy mt-3 text-sm leading-7">
                            {getStatusText(result, isLoading, errorMessage)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="editor-meta-row mt-4 flex flex-wrap items-center justify-end gap-2 pt-3">
                {outputFooterNote ? (
                  <span
                    className="editor-meta mr-auto"
                    aria-live="polite"
                    role="status"
                  >
                    {outputFooterNote}
                  </span>
                ) : null}
                {result ? (
                  <button
                    type="button"
                    onClick={() => setCompareMode((current) => !current)}
                    aria-pressed={compareMode}
                    className="inline-action-button"
                  >
                    {compareMode ? "Back to result" : "Compare"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!result?.plainText}
                  className="icon-action-button"
                  aria-label={
                    copyState === "copied"
                      ? "Result copied"
                      : "Copy plain language result"
                  }
                  title={
                    copyState === "copied"
                      ? "Result copied"
                      : "Copy plain language result"
                  }
                >
                  <CopyIcon />
                </button>
                <span className="editor-meta">{formatCount(outputCharacters)} chars</span>
              </div>
            </div>

            {result && !compareMode ? (
              <DetailTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                result={result}
              />
            ) : null}
          </section>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            onClick={handleClear}
            disabled={!sourceText && !result}
            className="ghost-button rounded-full px-4 py-3 text-sm font-medium"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleConvert}
            disabled={!sourceText.trim() || isLoading}
            className="primary-button rounded-full px-5 py-3 text-sm font-semibold"
          >
            {isLoading ? "Converting..." : "Convert to plain language"}
          </button>
        </div>
      </section>

      <footer className="muted-copy px-1 py-5 text-sm leading-6">
        This tool rewrites text for clarity. It does not verify legal, medical,
        or factual accuracy.
      </footer>
    </main>
  );
}
