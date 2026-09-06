const STATS = [
  { value: '50K+', label: 'Active Users' },
  { value: '150+', label: 'Markets' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

export function StatsStrip() {
  return (
    <section id="markets" className="border-b border-border bg-panel/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-canvas px-5 py-8 text-center">
            <div className="text-2xl font-bold text-positive">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-6xl px-5 py-3 text-center text-[10px] text-text-muted">
        Angka di atas adalah placeholder marketing — ganti dengan data riil sebelum go-live.
      </p>
    </section>
  );
}
