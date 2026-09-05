// Helper formatting untuk angka finansial — dipusatkan supaya konsisten
// di seluruh komponen (tabel watchlist, chart tooltip, dll).

export function formatPrice(value: number | null, currency?: string | null): string {
  if (value === null || value === undefined) return '—';
  const decimals = value < 10 ? 4 : 2;
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return currency ? `${formatted}` : formatted;
}

export function formatChange(value: number | null): string {
  if (value === null || value === undefined) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function isPositive(value: number | null): boolean {
  return (value ?? 0) >= 0;
}
