import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,230,118,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,_transparent,_#0E1117)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-16 md:grid-cols-2 md:items-center md:pt-20">
        <div className="animate-fade-up">
          <p className="mb-3 text-xs font-semibold uppercase tracking-label text-positive">
            Research Terminal
          </p>
          <h1 className="text-display text-text-primary">
            Pantau Pasar.
            <br />
            Analisis Lebih Cerdas.
            <br />
            Putuskan Lebih Baik.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-text-secondary">
            Satu tempat untuk watchlist multi-simbol, chart candlestick dengan indikator teknikal,
            dan berita pasar — dirancang untuk riset trader ritel Indonesia.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-positive px-4 py-2.5 text-sm font-semibold text-canvas hover:bg-positive/90"
            >
              Mulai Gratis
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-border px-4 py-2.5 text-sm text-text-primary hover:border-text-secondary"
            >
              Lihat Demo
            </Link>
          </div>
        </div>

        <div className="animate-fade-up overflow-hidden rounded-panel border border-border-card bg-panel shadow-panel [animation-delay:120ms]">
          <Image
            src="https://placehold.co/960x640/161B22/5C6673?text=Dashboard+Preview"
            alt="Preview dashboard FinSight"
            width={960}
            height={640}
            className="h-auto w-full"
            unoptimized
            priority
          />
        </div>
      </div>
    </section>
  );
}
