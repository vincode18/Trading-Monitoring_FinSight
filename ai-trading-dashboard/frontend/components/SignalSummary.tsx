'use client';

interface SignalSummaryProps {
  summary: string;
}

export function SignalSummary({ summary }: SignalSummaryProps) {
  return (
    <div className="rounded border border-border bg-panel px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-positive" />
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Kondisi Teknikal
        </span>
      </div>
      <p className="text-sm text-text-primary">{summary}</p>
      <p className="mt-1.5 text-xs text-text-muted">
        Ringkasan berbasis aturan matematis — bukan rekomendasi beli/jual.
      </p>
    </div>
  );
}
