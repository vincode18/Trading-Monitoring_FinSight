'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { SymbolSearchResult } from '@/types/market';

export function AddSymbolModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (symbol: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  if (!open) return null;

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await api.searchSymbol(value));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24">
      <div className="w-full max-w-md rounded-md border border-border bg-panel p-4 shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Add Symbol</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            ×
          </button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Cari simbol atau nama..."
          className="w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
        />
        <div className="mt-2 max-h-64 overflow-y-auto">
          {searching && <p className="px-2 py-2 text-xs text-text-muted">Mencari...</p>}
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => {
                onAdd(r.symbol);
                onClose();
                setQuery('');
                setResults([]);
              }}
              className="flex w-full flex-col items-start rounded px-2 py-2 text-left hover:bg-panel-hover"
            >
              <span className="font-mono text-xs text-text-primary">{r.symbol}</span>
              <span className="text-[10px] text-text-muted">{r.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
