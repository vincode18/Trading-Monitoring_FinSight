'use client';

import Link from 'next/link';
import { useState } from 'react';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#markets', label: 'Markets' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#about', label: 'About' },
];

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="text-sm font-bold tracking-tight text-text-primary">
          Trading Monitor
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-text-secondary transition hover:text-text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded border border-border px-3 py-1.5 text-sm text-text-primary hover:border-text-secondary"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded bg-action-primary px-3 py-1.5 text-sm font-medium text-canvas hover:bg-white/90"
          >
            Get Started
          </Link>
        </div>
        <button
          className="rounded border border-border px-2 py-1 text-xs text-text-secondary md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>
      {open && (
        <div className="border-t border-border px-5 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-text-secondary">
                {l.label}
              </a>
            ))}
            <Link href="/login" className="text-sm text-text-primary">
              Log In
            </Link>
            <Link href="/signup" className="text-sm text-positive">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
