'use client';

import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-6">
      <div>
        <h1 className="text-h1 text-text-primary">Disclaimer On — Terms &amp; Condition</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Privacy, Terms &amp; Condition, and disclaimer letter for FinSight.
        </p>
      </div>

      <section className="space-y-2 rounded-md border border-border bg-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">1. Disclaimer</h2>
        <p className="text-xs leading-relaxed text-text-secondary">
          All content, scores, indicators, and strategies in FinSight are provided for information
          and research purposes only. FinSight is not an investment adviser and does not recommend
          buying or selling any securities. Investment decisions are solely the user's
          responsibility.
        </p>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">2. Terms &amp; Condition</h2>
        <p className="text-xs leading-relaxed text-text-secondary">
          By using this application, you agree that market data may be delayed or incomplete,
          third-party market data providers may change at any time, and the service may be
          modified or discontinued without notice. Use for illegal purposes is prohibited.
        </p>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">3. Privacy</h2>
        <p className="text-xs leading-relaxed text-text-secondary">
          We process account data (email, name, preferences) for authentication and personalization.
          Data is not sold to third parties for advertising. HttpOnly session cookies are used for login.
          For account deletion requests, use Settings or contact support.
        </p>
      </section>

      <p className="text-[11px] text-text-muted">
        This document is an operational summary. The final legal version may be updated as
        billing and paid features launch.
      </p>

      <Link href="/dashboard" className="inline-block text-xs text-positive hover:underline">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
