'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';

const CONDITIONS_WITHOUT_THRESHOLD = new Set([
  'RSI_OVERBOUGHT',
  'RSI_OVERSOLD',
  'GOLDEN_CROSS',
  'DEATH_CROSS',
]);

const CONDITION_LABELS: Record<string, string> = {
  PRICE_ABOVE: 'Price rises above',
  PRICE_BELOW: 'Price falls below',
  CHANGE_PCT_ABOVE: 'Daily change % rises above',
  CHANGE_PCT_BELOW: 'Daily change % falls below',
  RSI_OVERBOUGHT: 'RSI turns overbought (>70)',
  RSI_OVERSOLD: 'RSI turns oversold (<30)',
  GOLDEN_CROSS: 'MA20 crosses above MA50 (Golden Cross)',
  DEATH_CROSS: 'MA20 crosses below MA50 (Death Cross)',
  VOLUME_SPIKE: 'Volume ratio exceeds',
};

export function AlertForm({ onCreated }: { onCreated: () => void }) {
  const { watchlist } = useWatchlist();
  const [symbol, setSymbol] = useState(watchlist[0] ?? '');
  const [condition, setCondition] = useState('PRICE_ABOVE');
  const [threshold, setThreshold] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const needsThreshold = !CONDITIONS_WITHOUT_THRESHOLD.has(condition);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!symbol) {
      setError('Select a symbol first.');
      return;
    }
    if (needsThreshold && threshold === '') {
      setError('Threshold is required for this condition.');
      return;
    }
    setSaving(true);
    try {
      await api.createAlert({
        symbol,
        condition,
        threshold: needsThreshold ? Number(threshold) : undefined,
      });
      setThreshold('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-md border border-border bg-panel p-4"
    >
      <h2 className="text-sm font-semibold text-text-primary">Create New Alert</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-text-secondary">
          Symbol
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded border border-border bg-canvas px-2 py-1.5 font-mono text-sm text-text-primary"
          >
            {!watchlist.length && <option value="">— empty —</option>}
            {watchlist.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-secondary sm:col-span-2">
          Condition
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded border border-border bg-canvas px-2 py-1.5 text-sm text-text-primary"
          >
            {Object.entries(CONDITION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {needsThreshold && (
        <label className="flex max-w-xs flex-col gap-1 text-xs text-text-secondary">
          Threshold
          <input
            type="number"
            step="any"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder={
              condition === 'VOLUME_SPIKE' ? 'e.g. 2.0 (= 2x average)' : 'Threshold value'
            }
            className="rounded border border-border bg-canvas px-2 py-1.5 font-mono text-sm text-text-primary"
          />
        </label>
      )}
      {error && <p className="text-xs text-negative">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded bg-positive px-3 py-2 text-xs font-semibold text-canvas disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Create Alert'}
      </button>
    </form>
  );
}
