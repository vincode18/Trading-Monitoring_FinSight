'use client';

import { Suspense } from 'react';
import { AnalysisOverview } from '@/components/analysis/AnalysisOverview';

export default function AnalysisOverviewPage() {
  return (
    <Suspense fallback={<p className="px-6 py-8 text-xs text-text-muted">Loading overview...</p>}>
      <AnalysisOverview />
    </Suspense>
  );
}
