'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SLIDES = [
  {
    title: 'Pantau Pasar, Real-Time.',
    body: 'Saham, kripto, dan indeks — satu dashboard, tanpa buka banyak tab.',
    image: 'https://placehold.co/480x360/161B22/5C6673?text=Watchlist+Preview',
    alt: 'Preview watchlist',
  },
  {
    title: 'Baca Sinyal Teknikal, Instan.',
    body: 'MA, RSI, MACD, Bollinger Bands — semua terhitung otomatis di setiap simbol yang Anda pantau.',
    image: 'https://placehold.co/480x360/161B22/5C6673?text=Chart+Preview',
    alt: 'Preview chart',
  },
  {
    title: 'Berita yang Relevan, Bukan Berisik.',
    body: 'Kabar penting per simbol, langsung terhubung ke watchlist Anda.',
    image: 'https://placehold.co/480x360/161B22/5C6673?text=News+Preview',
    alt: 'Preview berita',
  },
];

/** Key resmi per Enhancement-design_OnboardingLoginPage.md §4.4 */
export const ONBOARDING_KEY = 'onboarding-completed';
/** Key lama — tetap dicek agar user yang sudah skip tidak melihat ulang */
export const ONBOARDING_KEY_LEGACY = 'trading-dashboard-onboarding-seen';

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.localStorage.getItem(ONBOARDING_KEY) ||
      window.localStorage.getItem(ONBOARDING_KEY_LEGACY)
  );
}

export function markOnboardingComplete() {
  window.localStorage.setItem(ONBOARDING_KEY, '1');
}

export function OnboardingCarousel() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  function goLanding() {
    markOnboardingComplete();
    router.push('/');
  }

  function next() {
    if (last) goLanding();
    else setIndex((i) => i + 1);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas px-6 pb-8 pt-6">
      <Link href="/" className="text-sm font-bold tracking-tight text-text-primary">
        FinSight
      </Link>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-10">
        <div className="animate-fade-up w-full text-center">
          <div className="mx-auto overflow-hidden rounded-panel border border-border-card bg-panel">
            <Image
              src={slide.image}
              alt={slide.alt}
              width={480}
              height={360}
              className="h-auto w-full"
              unoptimized
              priority
            />
          </div>
          <h1 className="mt-8 text-h1 text-text-primary md:text-[1.75rem]">{slide.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
            {slide.body}
          </p>

          <div className="mt-8 flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === index ? 'bg-positive' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
        {!last ? (
          <button
            type="button"
            onClick={goLanding}
            className="rounded-md px-3 py-2.5 text-sm text-text-muted hover:text-text-secondary"
          >
            Lewati
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={next}
          className="rounded-md bg-positive px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-positive/90"
        >
          {last ? 'Mulai Sekarang' : 'Lanjut'}
        </button>
      </div>
    </div>
  );
}
