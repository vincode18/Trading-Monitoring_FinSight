import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trading Monitor — AI Research Terminal',
  description:
    'Monitor market, analyze smarter. Watchlist, candlestick charts, technical indicators, and news.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
