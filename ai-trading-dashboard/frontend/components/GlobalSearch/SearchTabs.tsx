'use client';

import type { SearchTab } from './useGlobalSearch';
import { SEARCH_TABS } from './useGlobalSearch';

export function SearchTabs({
  activeTab,
  onChange,
}: {
  activeTab: SearchTab;
  onChange: (tab: SearchTab) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 scrollbar-thin">
      {SEARCH_TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded px-2.5 py-1 text-[11px] transition-colors ${
              active
                ? 'bg-positive/15 font-medium text-positive'
                : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
