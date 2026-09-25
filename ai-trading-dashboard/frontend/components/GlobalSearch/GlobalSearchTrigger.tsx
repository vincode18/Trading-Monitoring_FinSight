'use client';

import { useGlobalSearchUi } from './GlobalSearchProvider';

function SearchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GlobalSearchTrigger({
  className = '',
  variant = 'button',
}: {
  className?: string;
  /** `wide` = full search-bar look (Chart page). `button` = compact control. */
  variant?: 'button' | 'wide';
}) {
  const { openSearch } = useGlobalSearchUi();
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const shortcut = isMac ? '⌘K' : 'Ctrl+K';

  if (variant === 'wide') {
    return (
      <button
        type="button"
        onClick={openSearch}
        className={`flex w-full max-w-3xl items-center gap-3 rounded-md border border-border bg-panel px-3 py-2.5 text-left transition-colors hover:border-positive/40 ${className}`}
        title={`Global Search (${shortcut})`}
        aria-label="Open Global Search"
      >
        <span className="shrink-0 text-text-muted">
          <SearchIcon size={16} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-text-muted">
          Search symbols, companies, or indices...
        </span>
        <kbd className="shrink-0 rounded border border-border-muted bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
          {shortcut}
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className={`inline-flex items-center gap-2 rounded border border-border bg-panel px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-positive/40 hover:text-text-primary ${className}`}
      title={`Global Search (${shortcut})`}
      aria-label="Open Global Search"
    >
      <SearchIcon />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden rounded border border-border-muted px-1 font-mono text-[10px] text-text-muted md:inline">
        {shortcut}
      </kbd>
    </button>
  );
}
