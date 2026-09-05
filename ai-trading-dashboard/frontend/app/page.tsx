'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Sidebar } from '@/components/Sidebar';
import { WatchlistTable } from '@/components/WatchlistTable';
import { SymbolHeader } from '@/components/SymbolHeader';
import { ChartControls } from '@/components/ChartControls';
import { CandlestickChart } from '@/components/CandlestickChart';
import { SignalSummary } from '@/components/SignalSummary';
import { NewsPanel } from '@/components/NewsPanel';
import { Tabs } from '@/components/Tabs';
import { api } from '@/lib/api';

const DEFAULT_WATCHLIST = ['BBCA.JK', 'BBRI.JK', 'TLKM.JK', 'AAPL', 'MSFT', 'BTC-USD'];
const WATCHLIST_STORAGE_KEY = 'trading-dashboard-watchlist';
const QUOTE_REFRESH_MS = 30_000; // polling harga tiap 30 detik

export default function DashboardPage() {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [period, setPeriod] = useState('6mo');
  const [interval, setInterval] = useState('1d');
  const [showBollinger, setShowBollinger] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  // Muat watchlist dari localStorage saat pertama kali render di browser
  useEffect(() => {
    const saved = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWatchlist(parsed);
          setSelectedSymbol(parsed[0]);
          return;
        }
      } catch {
        // abaikan, pakai default
      }
    }
    setSelectedSymbol(DEFAULT_WATCHLIST[0]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const { data: quotes, isLoading: quotesLoading } = useSWR(
    watchlist.length > 0 ? ['watchlist-quotes', watchlist] : null,
    () => api.getWatchlistQuotes(watchlist),
    { refreshInterval: QUOTE_REFRESH_MS }
  );

  const { data: chartData, isLoading: chartLoading } = useSWR(
    selectedSymbol ? ['chart', selectedSymbol, period, interval] : null,
    () => api.getChart(selectedSymbol as string, period, interval),
    { refreshInterval: QUOTE_REFRESH_MS }
  );

  const { data: news, isLoading: newsLoading } = useSWR(
    selectedSymbol ? ['news', selectedSymbol] : null,
    () => api.getNews(selectedSymbol as string)
  );

  const selectedQuote = quotes?.find((q) => q.symbol === selectedSymbol) ?? null;

  function handleAddSymbol(symbol: string) {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
    setSelectedSymbol(symbol);
  }

  function handleRemoveSymbol(symbol: string) {
    const next = watchlist.filter((s) => s !== symbol);
    setWatchlist(next);
    if (selectedSymbol === symbol) {
      setSelectedSymbol(next[0] ?? null);
    }
  }

  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar
        watchlist={watchlist}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        onAddSymbol={handleAddSymbol}
        onRemoveSymbol={handleRemoveSymbol}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              Watchlist
            </h2>
            <WatchlistTable
              quotes={quotes ?? []}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              loading={quotesLoading}
            />
          </section>

          {selectedSymbol && (
            <section>
              <SymbolHeader quote={selectedQuote} loading={quotesLoading} />

              <Tabs
                tabs={[
                  { id: 'chart', label: 'Grafik & Indikator' },
                  { id: 'news', label: 'Berita' },
                ]}
                active={activeTab}
                onChange={setActiveTab}
              />

              <div className="pt-4">
                {activeTab === 'chart' && (
                  <div className="flex flex-col gap-3">
                    <ChartControls
                      period={period}
                      interval={interval}
                      showBollinger={showBollinger}
                      onPeriodChange={setPeriod}
                      onIntervalChange={setInterval}
                      onBollingerToggle={setShowBollinger}
                    />
                    {chartLoading && !chartData && (
                      <div className="flex h-64 items-center justify-center text-sm text-text-muted">
                        Memuat grafik...
                      </div>
                    )}
                    {chartData && (
                      <>
                        <CandlestickChart data={chartData} showBollinger={showBollinger} />
                        <SignalSummary summary={chartData.signal_summary} />
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'news' && (
                  <NewsPanel news={news ?? []} loading={newsLoading} />
                )}
              </div>
            </section>
          )}

          <footer className="mt-8 border-t border-border-muted py-4">
            <p className="text-xs text-text-muted">
              Disclaimer: Dashboard ini adalah alat bantu riset, bukan nasihat keuangan.
              Keputusan trading sepenuhnya tanggung jawab pengguna.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
