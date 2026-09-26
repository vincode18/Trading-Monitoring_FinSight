import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinSight — AI Research Terminal',
  description:
    'Monitor markets, technical analysis, and news — a research tool for retail traders.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
