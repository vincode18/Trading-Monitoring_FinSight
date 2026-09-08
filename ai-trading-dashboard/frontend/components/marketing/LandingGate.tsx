'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasCompletedOnboarding } from '@/components/onboarding/OnboardingCarousel';

/** Redirect ke /onboarding jika flag belum ada (sekali per device). */
export function LandingGate() {
  const router = useRouter();

  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      router.replace('/onboarding');
    }
  }, [router]);

  return null;
}
