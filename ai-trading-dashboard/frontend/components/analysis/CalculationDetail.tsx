export function CalculationDetail({
  readings,
}: {
  readings: Array<{ label: string; value: string | null }>;
}) {
  if (!readings.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium text-text-primary">Calculation detail</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {readings.map((row) => (
          <div key={row.label} className="rounded border border-border-muted bg-panel px-3 py-2">
            <div className="text-[10px] uppercase text-text-muted">{row.label}</div>
            <div className="font-mono text-sm text-text-primary">{row.value ?? '—'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
