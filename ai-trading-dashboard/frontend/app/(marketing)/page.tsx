'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hero } from '@/components/marketing/Hero';
import { StatsStrip } from '@/components/marketing/StatsStrip';
import { ONBOARDING_KEY } from '@/components/onboarding/OnboardingCarousel';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (!window.localStorage.getItem(ONBOARDING_KEY)) {
      router.replace('/onboarding');
    }
  }, [router]);

  return (
    <>
      <Hero />
      <StatsStrip />
      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-h1 text-text-primary">Built for research density</h2>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          Dark analytical UI, live-ish quotes, multi-panel charts, and signal summaries — without
          the clutter of consumer dashboards.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              t: 'Watchlist',
              d: 'Multi-symbol tables with category tabs for tech, crypto, and forex.',
            },
            {
              t: 'Chart Terminal',
              d: 'TradingView Lightweight Charts with MA, RSI, MACD, and Bollinger.',
            },
            {
              t: 'Analysis',
              d: 'Score gauge, radar profile, and support/resistance — with clear disclaimers.',
            },
          ].map((f) => (
            <div key={f.t} className="rounded-md border border-border bg-panel p-5">
              <h3 className="text-h2 text-positive">{f.t}</h3>
              <p className="mt-2 text-sm text-text-secondary">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="pricing" className="border-t border-border bg-panel/30 py-16">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="text-h1 text-text-primary">Start free. Upgrade later.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Freemium model follows Documentation-Business — billing wiring comes in Stage 3.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded bg-action-primary px-5 py-2.5 text-sm font-semibold text-canvas"
          >
            Create Free Account
          </Link>
        </div>
      </section>
      <footer id="about" className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-5 text-xs text-text-muted">
          © {new Date().getFullYear()} Trading Monitor. Alat bantu riset — bukan nasihat keuangan.
        </div>
      </footer>
    </>
  );
}
