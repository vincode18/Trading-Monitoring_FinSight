import type { ScreenCondition, TradePlan } from '@/types/market';

export function StrategyBrief({
  name,
  explanation,
  conditions,
  tradePlan,
}: {
  name?: string;
  explanation?: string;
  conditions: ScreenCondition[];
  tradePlan?: TradePlan | null;
}) {
  return (
    <div className="space-y-3">
      {explanation && (
        <section className="rounded-md border border-border bg-panel p-4">
          <h2 className="text-xs font-medium text-text-primary">{name || 'Strategy'}</h2>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">{explanation}</p>
        </section>
      )}
      {conditions.length > 0 && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-panel text-[10px] uppercase text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Condition</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((row) => (
                <tr key={row.code} className="border-t border-border-muted">
                  <td className="px-3 py-2 font-mono text-text-secondary">{row.code}</td>
                  <td className="px-3 py-2 text-text-primary">{row.label}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${
                        row.met ? 'bg-positive/15 text-positive' : 'bg-border-muted text-text-muted'
                      }`}
                    >
                      {row.met ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tradePlan && (
        <section className="rounded-md border border-border bg-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-medium text-text-primary">Rule reference</h2>
            <span className="text-[11px] text-text-secondary">{tradePlan.status}</span>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="text-[10px] uppercase text-text-muted">Entry reference</dt>
              <dd className="mt-0.5 text-text-primary">{tradePlan.entry_reference || '—'}</dd>
            </div>
            {tradePlan.stop_reference && (
              <div>
                <dt className="text-[10px] uppercase text-text-muted">Stop reference</dt>
                <dd className="mt-0.5 text-text-primary">{tradePlan.stop_reference}</dd>
              </div>
            )}
            {tradePlan.target_reference && (
              <div>
                <dt className="text-[10px] uppercase text-text-muted">Target reference</dt>
                <dd className="mt-0.5 text-text-primary">{tradePlan.target_reference}</dd>
              </div>
            )}
          </dl>
          <p className="mt-3 text-[10px] leading-relaxed text-text-muted">{tradePlan.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
