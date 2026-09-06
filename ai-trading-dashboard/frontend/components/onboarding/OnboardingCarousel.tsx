'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SLIDES = [
  {
    title: 'Monitor semua pasar di satu layar',
    body: 'Pantau saham IDX, US, dan crypto dalam watchlist yang ringkas dengan update berkala.',
  },
  {
    title: 'Analisis teknikal tanpa alat ekstra',
    body: 'Candlestick, MA, RSI, MACD, dan Bollinger — disajikan padat ala terminal trading.',
  },
  {
    title: 'Konteks berita sebelum keputusan',
    body: 'Baca headline terkait simbol yang kamu pantau, lalu lanjut riset di chart & analysis.',
  },
];

export const ONBOARDING_KEY = 'trading-dashboard-onboarding-seen';

export function OnboardingCarousel() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const last = index === SLIDES.length - 1;

  function finish() {
    window.localStorage.setItem(ONBOARDING_KEY, '1');
    router.push('/signup');
  }

  function next() {
    if (last) finish();
    else setIndex((i) => i + 1);
  }

  function skip() {
    window.localStorage.setItem(ONBOARDING_KEY, '1');
    router.push('/');
  }

  const slide = SLIDES[index];

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="animate-fade-up rounded-md border border-border bg-panel p-8 shadow-panel">
        <div className="mb-6 flex h-36 items-center justify-center rounded border border-border-muted bg-canvas">
          <div className="h-16 w-40 rounded-sm bg-gradient-to-r from-positive/20 via-panel-hover to-positive/10" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-positive">
          Step {index + 1} / {SLIDES.length}
        </p>
        <h1 className="mt-2 text-h1 text-text-primary">{slide.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{slide.body}</p>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === index ? 'bg-positive' : 'bg-border'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={skip}
              className="rounded px-3 py-2 text-sm text-text-muted hover:text-text-secondary"
            >
              Skip
            </button>
            <button
              onClick={next}
              className="rounded bg-positive px-4 py-2 text-sm font-semibold text-canvas"
            >
              {last ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
