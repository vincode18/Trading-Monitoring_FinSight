import type { ScreenCondition } from '@/types/market';

export function StrategyReason({
  status,
  conditions,
}: {
  status?: string;
  conditions: ScreenCondition[];
}) {
  const met = conditions.filter((row) => row.met).map((row) => row.label);
  let text = 'None of this strategy’s conditions are active on the latest bar.';
  if (status === 'Condition met' && met.length) {
    text = `${met.join('; ')}.`;
  } else if (met.length) {
    text = `The bullish rule is not fully met. Active now: ${met.join('; ')}.`;
  }

  return (
    <section className="rounded-md border border-border bg-panel p-4">
      <h2 className="text-xs font-medium text-text-primary">Reason</h2>
      <p className="mt-2 text-xs leading-relaxed text-text-secondary">{text}</p>
    </section>
  );
}
