'use client';

import { useState } from 'react';

const FAQ = [
  {
    q: 'Apakah FinSight memberikan saran jual-beli?',
    a: 'Tidak. FinSight adalah alat bantu riset pasar, bukan nasihat keuangan berlisensi. Semua keputusan investasi/trading sepenuhnya tanggung jawab pengguna.',
  },
  {
    q: 'Dari mana data harga diambil?',
    a: 'Data harga dan berita saat ini bersumber dari Yahoo Finance (via backend). Ini cocok untuk riset, bukan eksekusi order berkecepatan tinggi.',
  },
  {
    q: 'Apakah watchlist tersimpan antar perangkat?',
    a: 'Saat ini watchlist disimpan di perangkat (browser). Sinkronisasi per akun menyusul setelah fitur akun penuh aktif.',
  },
  {
    q: 'Apakah ada biaya berlangganan?',
    a: 'Model freemium mengikuti roadmap produk. Billing & paket berbayar direncanakan di tahap berikutnya.',
  },
  {
    q: 'Bagaimana dengan risiko trading?',
    a: 'Trading mengandung risiko kerugian. Gunakan FinSight hanya sebagai alat riset pendukung, bukan sebagai satu-satunya dasar keputusan.',
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="text-center text-h1 text-text-primary">Pertanyaan Umum</h2>
      <p className="mx-auto mt-2 max-w-lg text-center text-sm text-text-secondary">
        Ringkas dan jujur — termasuk disclaimer risiko.
      </p>
      <div className="mt-8 space-y-2">
        {FAQ.map((item, i) => {
          const active = open === i;
          return (
            <div key={item.q} className="rounded-panel border border-border-card bg-panel">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text-primary"
                onClick={() => setOpen(active ? null : i)}
                aria-expanded={active}
              >
                {item.q}
                <span className="ml-3 text-text-muted">{active ? '−' : '+'}</span>
              </button>
              {active && (
                <p className="border-t border-border px-4 py-3 text-sm leading-relaxed text-text-secondary">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
