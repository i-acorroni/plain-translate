import type { PlainLanguageResponse } from "@/lib/types";

type CompareViewProps = {
  result: PlainLanguageResponse;
};

export function CompareView({ result }: CompareViewProps) {
  if (result.compareNotes.length === 0) {
    return (
      <div className="flex h-full min-h-[14rem] items-center justify-center p-2 text-center sm:min-h-[18rem]">
        <div className="max-w-sm space-y-2">
          <p className="display-copy text-2xl">No comparison notes yet</p>
          <p className="muted-copy text-sm leading-6">
            The current rewrite did not return sentence-level comparison notes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-soft h-full space-y-4 overflow-auto pr-1">
      {result.ambiguityNote ? (
        <div className="status-review rounded-2xl px-4 py-3 text-sm leading-6">
          {result.ambiguityNote}
        </div>
      ) : null}
      {result.compareNotes.map((note) => (
        <article key={`${note.label}-${note.after}`} className="surface-subtle rounded-[24px] p-4">
          <p className="muted-copy text-xs font-semibold uppercase tracking-[0.22em]">
            {note.label}
          </p>
          <div className="mt-3 space-y-3">
            {note.before ? (
              <div className="panel-card rounded-2xl px-4 py-3">
                <p className="muted-copy text-xs font-semibold uppercase tracking-[0.18em]">
                  Before
                </p>
                <p className="mt-2 text-sm leading-6">{note.before}</p>
              </div>
            ) : null}
            <div className="accent-card rounded-2xl px-4 py-3">
              <p className="accent-copy text-xs font-semibold uppercase tracking-[0.18em]">
                Plain language
              </p>
              <p className="mt-2 text-sm leading-6">{note.after}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
