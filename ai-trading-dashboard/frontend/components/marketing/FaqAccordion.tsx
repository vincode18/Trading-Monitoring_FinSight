'use client';

import { useState } from 'react';

const FAQ = [
  {
    q: 'Does FinSight give buy/sell advice?',
    a: 'No. FinSight is a market research tool, not licensed financial advice. All investment/trading decisions are solely the user\'s responsibility.',
  },
  {
    q: 'Where does price data come from?',
    a: 'Prices and news are supplied by third-party market data providers via our backend. Suitable for research, not high-speed order execution.',
  },
  {
    q: 'Is the watchlist synced across devices?',
    a: 'Currently the watchlist is stored on this device (browser). Account sync will follow once full account features are live.',
  },
  {
    q: 'Is there a subscription fee?',
    a: 'A freemium model follows the product roadmap. Billing and paid plans are planned for a later stage.',
  },
  {
    q: 'What about trading risk?',
    a: 'Trading involves risk of loss. Use FinSight only as a supporting research tool, not as the sole basis for decisions.',
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="text-center text-h1 text-text-primary">Frequently Asked Questions</h2>
      <p className="mx-auto mt-2 max-w-lg text-center text-sm text-text-secondary">
        Short and honest — including risk disclaimers.
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
