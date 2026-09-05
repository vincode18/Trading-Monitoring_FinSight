'use client';

interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-3 py-2 text-sm ${
            active === tab.id
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-positive" />
          )}
        </button>
      ))}
    </div>
  );
}
