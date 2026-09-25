import type { TradePlan } from '@/types/market';

export function EntryPointRecommendation({ plan }: { plan: TradePlan }) {
  return (
    <section className="rounded-md border border-border bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-medium text-text-primary">Entry point recommendation</h2>
        <span className="text-[11px] text-text-secondary">{plan.status}</span>
      </div>
      <p className="mt-1 text-[10px] text-text-muted">
        This restates the strategy’s own entry rule. It is not an instruction to buy or sell.
      </p>
      <dl className="mt-3 space-y-2 text-xs">
        <div>
          <dt className="text-[10px] uppercase text-text-muted">Entry reference</dt>
          <dd className="mt-0.5 text-text-primary">{plan.entry_reference || '—'}</dd>
        </div>
        {plan.stop_reference && (
          <div>
            <dt className="text-[10px] uppercase text-text-muted">Stop reference</dt>
            <dd className="mt-0.5 text-text-primary">{plan.stop_reference}</dd>
          </div>
        )}
        {plan.target_reference && (
          <div>
            <dt className="text-[10px] uppercase text-text-muted">Target reference</dt>
            <dd className="mt-0.5 text-text-primary">{plan.target_reference}</dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-[10px] leading-relaxed text-text-muted">{plan.disclaimer}</p>
    </section>
  );
}
