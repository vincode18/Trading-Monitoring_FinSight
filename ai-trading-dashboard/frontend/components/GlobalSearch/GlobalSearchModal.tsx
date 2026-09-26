'use client';

import { useEffect, useRef } from 'react';
import { SearchTabs } from './SearchTabs';
import { SearchResultGroup } from './SearchResultGroup';
import { useGlobalSearch } from './useGlobalSearch';

export function GlobalSearchModal({
  open,
  onClose,
  watchlist,
  onSelectSymbol,
}: {
  open: boolean;
  onClose: () => void;
  watchlist: string[];
  onSelectSymbol: (symbol: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    cycleTab,
    groupedResults,
    flatResults,
    quotes,
    loading,
    activeIndex,
    setActiveIndex,
  } = useGlobalSearch(watchlist, open);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(flatResults.length - 1, 0)));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const hit = flatResults[activeIndex];
        if (hit) {
          onSelectSymbol(hit.symbol);
          onClose();
        }
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        cycleTab(e.shiftKey ? -1 : 1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    open,
    onClose,
    onSelectSymbol,
    flatResults,
    activeIndex,
    setActiveIndex,
    cycleTab,
  ]);

  if (!open) return null;

  const emptyHint =
    query.trim().length < 2 && activeTab === 'all'
      ? 'Type at least 2 characters, or pick a market tab to browse the pool.'
      : loading
        ? 'Searching...'
        : 'No results.';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-canvas/80 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global Search"
        className="relative z-10 flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-border bg-panel shadow-panel"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="shrink-0 text-text-muted"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a symbol, company name, or index..."
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
            Esc
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-panel-hover hover:text-text-primary"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <SearchTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto">
          {loading && query.trim().length >= 2 && (
            <p className="px-3 py-6 text-center text-xs text-text-muted">Searching...</p>
          )}
          {!loading && flatResults.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-text-muted">{emptyHint}</p>
          )}
          <SearchResultGroup
            title="Watchlist Saya"
            items={groupedResults.inWatchlist}
            quotes={quotes}
            flatOffset={0}
            activeIndex={activeIndex}
            onSelect={(symbol) => {
              onSelectSymbol(symbol);
              onClose();
            }}
            onHoverIndex={setActiveIndex}
          />
          <SearchResultGroup
            title="Hasil Lainnya"
            items={groupedResults.others}
            quotes={quotes}
            flatOffset={groupedResults.inWatchlist.length}
            activeIndex={activeIndex}
            onSelect={(symbol) => {
              onSelectSymbol(symbol);
              onClose();
            }}
            onHoverIndex={setActiveIndex}
          />
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border px-3 py-2 text-[10px] text-text-muted">
          <span>↑↓ navigasi</span>
          <span>↵ open chart</span>
          <span>Tab ganti filter</span>
          <span>Esc close</span>
          <span className="ml-auto font-mono">Ctrl/⌘ K</span>
        </div>
      </div>
    </div>
  );
}
