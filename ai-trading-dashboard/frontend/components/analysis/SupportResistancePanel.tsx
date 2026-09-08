'use client';

import { formatPrice } from '@/lib/format';

interface SupportResistancePanelProps {
  support: (number | null)[];
  resistance: (number | null)[];
}

export function SupportResistancePanel({ support, resistance }: SupportResistancePanelProps) {
  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <h3 className="text-h2 text-text-primary">Support & Resistance</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-text-muted">
            Support
          </div>
          {support.map((v, i) => (
            <div key={i} className="flex justify-between py-1 text-xs">
              <span className="text-text-secondary">S{i + 1}</span>
              <span className="font-mono text-positive">{formatPrice(v)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-text-muted">
            Resistance
          </div>
          {resistance.map((v, i) => (
            <div key={i} className="flex justify-between py-1 text-xs">
              <span className="text-text-secondary">R{i + 1}</span>
              <span className="font-mono text-negative">{formatPrice(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
