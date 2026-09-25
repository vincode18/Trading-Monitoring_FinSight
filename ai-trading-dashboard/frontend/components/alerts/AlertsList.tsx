'use client';

import type { Alert } from '@/types/market';
import { api } from '@/lib/api';

const CONDITION_LABELS: Record<string, string> = {
  PRICE_ABOVE: 'Price above',
  PRICE_BELOW: 'Price below',
  CHANGE_PCT_ABOVE: 'Change % above',
  CHANGE_PCT_BELOW: 'Change % below',
  RSI_OVERBOUGHT: 'RSI overbought',
  RSI_OVERSOLD: 'RSI oversold',
  GOLDEN_CROSS: 'Golden Cross',
  DEATH_CROSS: 'Death Cross',
  VOLUME_SPIKE: 'Volume spike',
};

function statusClass(status: string) {
  if (status === 'TRIGGERED') return 'text-positive';
  if (status === 'DISABLED') return 'text-text-muted';
  return 'text-text-secondary';
}

export function AlertsList({
  alerts,
  onChanged,
}: {
  alerts: Alert[];
  onChanged: () => void;
}) {
  async function toggle(alert: Alert) {
    const next = alert.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await api.toggleAlert(alert.id, next);
    onChanged();
  }

  async function remove(id: string) {
    await api.deleteAlert(id);
    onChanged();
  }

  if (!alerts.length) {
    return (
      <p className="py-8 text-center text-xs text-text-muted">No alerts in this tab yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-panel text-xs text-text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Symbol</th>
            <th className="px-3 py-2 font-medium">Condition</th>
            <th className="px-3 py-2 font-medium">Threshold</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Triggered</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2 font-mono text-text-primary">{alert.symbol}</td>
              <td className="px-3 py-2 text-text-secondary">
                {CONDITION_LABELS[alert.condition] ?? alert.condition}
              </td>
              <td className="px-3 py-2 font-mono tabular-nums text-text-secondary">
                {['RSI_OVERBOUGHT', 'RSI_OVERSOLD', 'GOLDEN_CROSS', 'DEATH_CROSS'].includes(
                  alert.condition
                )
                  ? '—'
                  : alert.threshold}
              </td>
              <td className={`px-3 py-2 text-xs font-semibold ${statusClass(alert.status)}`}>
                {alert.status}
              </td>
              <td className="px-3 py-2 text-xs text-text-muted">
                {alert.triggered_at
                  ? new Date(alert.triggered_at).toLocaleString()
                  : '—'}
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex justify-end gap-2">
                  {alert.status !== 'TRIGGERED' && (
                    <button
                      type="button"
                      onClick={() => toggle(alert)}
                      className="text-xs text-text-secondary hover:text-positive"
                    >
                      {alert.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                  )}
                  {alert.status === 'TRIGGERED' && (
                    <button
                      type="button"
                      onClick={() => toggle(alert)}
                      className="text-xs text-text-secondary hover:text-positive"
                    >
                      Re-arm
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(alert.id)}
                    className="text-xs text-negative hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
