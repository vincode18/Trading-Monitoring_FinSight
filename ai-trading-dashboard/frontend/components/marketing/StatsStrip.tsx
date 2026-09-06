const STATS = [
  { value: '—', label: 'Pengguna Aktif', note: 'Segera Hadir' },
  { value: '150+', label: 'Pasar Tercakup' },
  { value: '—', label: 'Uptime' },
  { value: 'Email', label: 'Dukungan', note: 'Support' },
];

export function StatsStrip() {
  return (
    <section id="markets" className="border-b border-border bg-panel/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-canvas px-5 py-8 text-center">
            <div className="text-2xl font-bold text-positive">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-label text-text-muted">{s.label}</div>
            {s.note && (
              <div className="mt-1 text-[10px] text-text-muted">{s.note}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
