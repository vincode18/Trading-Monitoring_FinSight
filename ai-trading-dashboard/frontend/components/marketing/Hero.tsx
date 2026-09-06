import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,230,118,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,_transparent,_#0E1117)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-16 md:grid-cols-2 md:items-center md:pt-20">
        <div className="animate-fade-up">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-positive">
            Research Terminal
          </p>
          <h1 className="text-display text-text-primary">
            Monitor Market.
            <br />
            Analyze Smarter.
            <br />
            Trade Better.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-text-secondary">
            Satu tempat untuk watchlist multi-simbol, chart candlestick dengan indikator teknikal,
            dan berita pasar — dirancang untuk riset trader ritel Indonesia.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded bg-positive px-4 py-2.5 text-sm font-semibold text-canvas hover:bg-positive/90"
            >
              Get Started Free
            </Link>
            <Link
              href="/dashboard"
              className="rounded border border-border px-4 py-2.5 text-sm text-text-primary hover:border-text-secondary"
            >
              Watch Demo
            </Link>
          </div>
        </div>

        <div className="animate-fade-up relative rounded-md border border-border bg-panel p-4 shadow-panel [animation-delay:120ms]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Live Preview
            </span>
            <span className="rounded-sm bg-positive/15 px-2 py-0.5 text-[10px] font-medium text-positive">
              Demo Mode
            </span>
          </div>
          <div className="space-y-2">
            {[
              { s: 'BBCA.JK', p: '+1.24%', up: true },
              { s: 'AAPL', p: '-0.42%', up: false },
              { s: 'BTC-USD', p: '+2.18%', up: true },
              { s: 'TLKM.JK', p: '+0.65%', up: true },
            ].map((row) => (
              <div
                key={row.s}
                className="flex items-center justify-between rounded border border-border-muted bg-canvas px-3 py-2"
              >
                <span className="font-mono text-xs text-text-primary">{row.s}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    row.up ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {row.p}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 h-24 rounded border border-border-muted bg-gradient-to-r from-panel-hover via-canvas to-panel-hover" />
        </div>
      </div>
    </section>
  );
}
