'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';

export function AddHoldingModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { watchlist } = useWatchlist();
  const [symbol, setSymbol] = useState(watchlist[0] ?? '');
  const [quantity, setQuantity] = useState('');
  const [avgBuy, setAvgBuy] = useState('');
  const [buyDate, setBuyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !symbol && watchlist[0]) setSymbol(watchlist[0]);
  }, [open, symbol, watchlist]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const qty = Number(quantity);
    const price = Number(avgBuy);
    if (!symbol || !qty || !price) {
      setError('Symbol, quantity, and buy price are required.');
      return;
    }
    setSaving(true);
    try {
      await api.addHolding({
        symbol: symbol.trim().toUpperCase(),
        quantity: qty,
        avg_buy_price: price,
        buy_date: new Date(buyDate).toISOString(),
        note: note || undefined,
      });
      setQuantity('');
      setAvgBuy('');
      setNote('');
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add holding');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-md border border-border bg-panel p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Add Holding</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Symbol
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              list="holding-watchlist"
              className="rounded border border-border bg-canvas px-2 py-1.5 font-mono text-sm text-text-primary"
              placeholder="BBCA.JK"
            />
            <datalist id="holding-watchlist">
              {watchlist.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-text-secondary">
              Quantity
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded border border-border bg-canvas px-2 py-1.5 font-mono text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-secondary">
              Avg Buy Price
              <input
                type="number"
                step="any"
                value={avgBuy}
                onChange={(e) => setAvgBuy(e.target.value)}
                className="rounded border border-border bg-canvas px-2 py-1.5 font-mono text-sm"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Buy Date
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="rounded border border-border bg-canvas px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            Note (optional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded border border-border bg-canvas px-2 py-1.5 text-sm"
            />
          </label>
          {error && <p className="text-xs text-negative">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-positive px-3 py-2 text-xs font-semibold text-canvas disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add Holding'}
          </button>
        </form>
      </div>
    </div>
  );
}
