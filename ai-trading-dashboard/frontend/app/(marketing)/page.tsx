import Image from 'next/image';
import Link from 'next/link';
import { Hero } from '@/components/marketing/Hero';
import { StatsStrip } from '@/components/marketing/StatsStrip';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { LandingGate } from '@/components/marketing/LandingGate';

const FEATURES = [
  {
    title: 'Watchlist',
    desc: 'Pantau banyak simbol saham, kripto, dan indeks dalam satu tabel ringkas.',
    icon: 'https://placehold.co/64x64/161B22/00E676?text=1',
  },
  {
    title: 'Analisis Teknikal',
    desc: 'MA, RSI, MACD, dan Bollinger Bands terhitung otomatis di setiap simbol.',
    icon: 'https://placehold.co/64x64/161B22/00E676?text=2',
  },
  {
    title: 'Berita Real-Time',
    desc: 'Headline relevan per simbol — tanpa buka banyak tab berita.',
    icon: 'https://placehold.co/64x64/161B22/00E676?text=3',
  },
];

export default function LandingPage() {
  return (
    <>
      <LandingGate />
      <Hero />
      <StatsStrip />

      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-h1 text-text-primary">Fitur Utama</h2>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          Dirancang untuk riset padat — bukan dashboard konsumen yang ramai.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-panel border border-border-card bg-panel p-5"
            >
              <Image src={f.icon} alt="" width={64} height={64} className="rounded-md" unoptimized />
              <h3 className="mt-4 text-h2 text-positive">{f.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-panel/20 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <div className="overflow-hidden rounded-panel border border-border-card">
            <Image
              src="https://placehold.co/800x500/161B22/5C6673?text=Chart+%26+Analysis+Preview"
              alt="Preview chart dan analisis"
              width={800}
              height={500}
              className="h-auto w-full"
              unoptimized
            />
          </div>
          <div>
            <h2 className="text-h1 text-text-primary">Chart & analisis dalam satu alur</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Dari watchlist ke chart timeframe, indikator, hingga skor analisis — tanpa pindah
              aplikasi. Selalu dilengkapi disclaimer: alat riset, bukan rekomendasi finansial.
            </p>
          </div>
        </div>
      </section>

      <FaqAccordion />

      <section id="pricing" className="border-t border-border bg-panel/30 py-16">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="text-h1 text-text-primary">Siap memantau pasar dengan lebih rapi?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Buat akun gratis dan mulai riset dari satu terminal.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-md bg-positive px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-positive/90"
          >
            Mulai Sekarang
          </Link>
        </div>
      </section>

      <footer id="about" className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="https://placehold.co/32x32/00E676/0E1117?text=FS"
              alt="FinSight"
              width={32}
              height={32}
              className="rounded"
              unoptimized
            />
            <span className="text-sm font-bold text-text-primary">FinSight</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
            <a href="#about" className="hover:text-text-primary">
              Tentang
            </a>
            <span className="text-text-muted">Syarat & Ketentuan</span>
            <span className="text-text-muted">Privasi</span>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-6xl space-y-2 px-5 text-xs leading-relaxed text-text-muted">
          <p>
            FinSight adalah alat bantu riset pasar, bukan nasihat keuangan berlisensi. Semua
            keputusan investasi/trading sepenuhnya tanggung jawab pengguna.
          </p>
          <p>© {new Date().getFullYear()} FinSight. Data via Yahoo Finance.</p>
        </div>
      </footer>
    </>
  );
}
