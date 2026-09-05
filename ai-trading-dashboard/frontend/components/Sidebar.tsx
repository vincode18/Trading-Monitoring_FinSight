'use client';

import { useState } from 'react';
import { SymbolSearchResult } from '@/types/market';
import { api } from '@/lib/api';

interface SidebarProps {
  watchlist: string[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

export function Sidebar({
  watchlist,
  selectedSymbol,
  onSelectSymbol,
  onAddSymbol,
  onRemoveSymbol,
}: SidebarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.searchSymbol(value);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function handleAdd(symbol: string) {
    onAddSymbol(symbol.toUpperCase());
    setQuery('');
    setResults([]);
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-panel">
      <div className="border-b border-border px-4 py-4">
        <h1 className="text-sm font-semibold tracking-tight text-text-primary">
          AI Trading Dashboard
        </h1>
        <p className="mt-0.5 text-xs text-text-muted">Riset pasar real-time</p>
      </div>

      <div className="border-b border-border-muted px-4 py-3">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari simbol atau nama..."
            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-positive focus:outline-none"
          />
        </div>

        {query.length >= 2 && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-sm border border-border bg-canvas">
            {searching && (
              <div className="px-3 py-2 text-xs text-text-muted">Mencari...</div>
            )}
            {!searching && results.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-muted">Tidak ada hasil</div>
            )}
            {results.map((r) => (
              <button
                key={r.symbol}
                onClick={() => handleAdd(r.symbol)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-panel-hover"
              >
                <span className="font-mono text-xs font-medium text-text-primary">
                  {r.symbol}
                </span>
                <span className="truncate text-xs text-text-secondary">
                  {r.name} {r.exchange ? `· ${r.exchange}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
          Watchlist ({watchlist.length})
        </div>
        {watchlist.length === 0 && (
          <p className="px-2 py-3 text-xs text-text-muted">
            Belum ada simbol. Cari dan tambahkan di atas.
          </p>
        )}
        <div className="flex flex-col gap-0.5">
          {watchlist.map((symbol) => (
            <div
              key={symbol}
              className={`group flex items-center justify-between rounded-sm px-2 py-1.5 text-sm ${
                selectedSymbol === symbol
                  ? 'bg-panel-hover text-text-primary'
                  : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
              }`}
            >
              <button
                onClick={() => onSelectSymbol(symbol)}
                className="flex-1 text-left font-mono text-xs"
              >
                {symbol}
              </button>
              <button
                onClick={() => onRemoveSymbol(symbol)}
                className="hidden text-text-muted hover:text-negative group-hover:block"
                aria-label={`Hapus ${symbol}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="text-xs leading-relaxed text-text-muted">
          Data via Yahoo Finance — bukan nasihat keuangan.
        </p>
      </div>
    </aside>
  );
}
