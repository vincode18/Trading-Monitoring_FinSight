'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const LINKS = [
  { href: '#features', label: 'Fitur' },
  { href: '#markets', label: 'Pasar' },
  { href: '#pricing', label: 'Harga' },
  { href: '#about', label: 'Tentang' },
];

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://placehold.co/32x32/00E676/0E1117?text=FS"
            alt="FinSight"
            width={32}
            height={32}
            className="rounded"
            unoptimized
          />
          <span className="text-sm font-bold tracking-tight text-text-primary">FinSight</span>
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
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:border-text-secondary"
          >
            Masuk
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-action-primary px-3 py-1.5 text-sm font-medium text-canvas hover:bg-white/90"
          >
            Daftar Gratis
          </Link>
        </div>
        <button
          type="button"
          className="rounded-md border border-border px-2 py-1 text-xs text-text-secondary md:hidden"
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
              Masuk
            </Link>
            <Link href="/signup" className="text-sm text-positive">
              Daftar Gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
