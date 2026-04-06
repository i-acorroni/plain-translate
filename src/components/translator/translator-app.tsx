"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CompareView } from "@/components/translator/compare-view";
import { DetailTabs } from "@/components/translator/detail-tabs";
import { ThemeToggle } from "@/components/translator/theme-toggle";
import { useLocalDraft } from "@/hooks/use-local-draft";
import type { DetailTab, PlainLanguageResponse } from "@/lib/types";

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
          <p className="muted-copy text-xs font-semibold uppercase tracking-[0.28em]">
            Plain Language Translator
          </p>
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
        <div className="surface-subtle sticky top-4 z-10 mb-4 rounded-[28px] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleConvert}
              disabled={!sourceText.trim() || isLoading}
              className="primary-button rounded-full px-5 py-3 text-sm font-semibold"
            >
              {isLoading ? "Converting..." : "Convert to plain language"}
            </button>
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
              onClick={handleCopy}
              disabled={!result?.plainText}
              className="ghost-button rounded-full px-4 py-3 text-sm font-medium"
            >
              {copyState === "copied"
                ? "Copied"
                : copyState === "failed"
                  ? "Copy failed"
                  : "Copy result"}
            </button>
            <button
              type="button"
              onClick={() => setCompareMode((current) => !current)}
              disabled={!result}
              aria-pressed={compareMode}
              className="ghost-button rounded-full px-4 py-3 text-sm font-medium"
            >
              {compareMode ? "Back to result" : "Compare"}
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="muted-copy text-sm leading-6" aria-live="polite" role="status">
              {getStatusText(result, isLoading, errorMessage)}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="pill inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                Autosaved locally
              </span>
              {result ? (
                <span className="pill inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  {result.usedMock ? "Mock mode" : "OpenRouter"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)]">
          <section className="surface-subtle rounded-[30px] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="muted-copy text-xs font-semibold uppercase tracking-[0.24em]">
                  Original text
                </p>
                <p className="mt-1 text-sm">
                  Paste or type the source material.
                </p>
              </div>
              <span className="pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {formatCount(sourceText.length)} chars
              </span>
            </div>
            <div className="editor-frame rounded-[28px] p-4 sm:p-5">
              <textarea
                aria-label="Original text"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder="Paste legal, public, academic, business, or healthcare text here."
                className="scroll-soft min-h-[24rem] w-full resize-none bg-transparent text-base leading-7 outline-none sm:min-h-[32rem]"
              />
            </div>
          </section>

          <div className="hidden items-center justify-center lg:flex">
            <div className="pill flex h-12 w-12 items-center justify-center rounded-full text-xl">
              ⇄
            </div>
          </div>

          <section className="surface-subtle rounded-[30px] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="muted-copy text-xs font-semibold uppercase tracking-[0.24em]">
                  Plain language version
                </p>
                <p className="mt-1 text-sm">
                  Clearer wording with the original meaning intact.
                </p>
              </div>
              <span className="pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {formatCount(outputCharacters)} chars
              </span>
            </div>

            {compareMode && result ? (
              <CompareView result={result} />
            ) : (
              <div className="editor-frame rounded-[28px] p-4 sm:p-5">
                {isLoading ? (
                  <div className="flex min-h-[24rem] flex-col justify-center gap-3 sm:min-h-[32rem]">
                    <div className="skeleton-bar h-4 w-3/4 animate-pulse rounded-full" />
                    <div className="skeleton-bar h-4 w-full animate-pulse rounded-full" />
                    <div className="skeleton-bar h-4 w-5/6 animate-pulse rounded-full" />
                    <div className="skeleton-bar h-4 w-2/3 animate-pulse rounded-full" />
                  </div>
                ) : errorMessage ? (
                  <div className="flex min-h-[24rem] items-center justify-center sm:min-h-[32rem]">
                    <div className="status-review max-w-md rounded-[24px] px-5 py-4 text-sm leading-6">
                      {errorMessage}
                    </div>
                  </div>
                ) : result ? (
                  <textarea
                    aria-label="Plain language version"
                    readOnly
                    value={result.plainText}
                    className="scroll-soft min-h-[24rem] w-full resize-none bg-transparent text-base leading-7 outline-none sm:min-h-[32rem]"
                  />
                ) : (
                  <div className="flex min-h-[24rem] items-center justify-center sm:min-h-[32rem]">
                    <div className="max-w-md text-center">
                      <p className="display-copy text-3xl">Ready to translate</p>
                      <p className="muted-copy mt-3 text-sm leading-7">
                        The result will appear here with a quality check, change
                        notes, and any unclear source sections that still need
                        review.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {result && !compareMode ? (
              <DetailTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                result={result}
              />
            ) : null}
          </section>
        </div>
      </section>

      <footer className="muted-copy px-1 py-5 text-sm leading-6">
        This tool rewrites text for clarity. It does not verify legal, medical,
        or factual accuracy.
      </footer>
    </main>
  );
}
