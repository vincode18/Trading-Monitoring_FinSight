import { unionSectorSymbols, type MarketId } from '@/lib/sectorBaskets';

export type { MarketId };

function buildMarket(
  label: string,
  mainIndex: { symbol: string; label: string },
  tickerSymbols: string[],
  forexPairs: string[],
  newsSymbols: string[],
  marketId: MarketId
) {
  const moverPoolSymbols = unionSectorSymbols(marketId);
  return {
    label,
    mainIndex,
    tickerSymbols,
    forexPairs,
    newsSymbols,
    moverPoolSymbols,
    /** @deprecated use moverPoolSymbols */
    moverUniverse: moverPoolSymbols,
  };
}

export const MARKET_CONFIG = {
  us: buildMarket(
    'US Market',
    { symbol: '^GSPC', label: 'S&P 500' },
    ['^GSPC', '^DJI', '^IXIC'],
    [],
    ['^GSPC', 'AAPL', 'MSFT', 'NVDA'],
    'us'
  ),
  indonesia: buildMarket(
    'Indonesia',
    { symbol: '^JKSE', label: 'IHSG (Composite)' },
    ['^JKSE'],
    ['USDIDR=X', 'SGDIDR=X'],
    ['^JKSE', 'BBCA.JK', 'BBRI.JK'],
    'indonesia'
  ),
  crypto: buildMarket(
    'Crypto',
    { symbol: 'BTC-USD', label: 'BTC/USD' },
    ['BTC-USD', 'ETH-USD'],
    [],
    ['BTC-USD', 'ETH-USD'],
    'crypto'
  ),
} as const;

export const MARKET_LABELS: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^DJI': 'DOW 30',
  '^IXIC': 'NASDAQ',
  '^JKSE': 'IHSG',
  'BTC-USD': 'BTCUSD',
  'ETH-USD': 'ETHUSD',
  'USDIDR=X': 'USD/IDR',
  'SGDIDR=X': 'SGD/IDR',
  'EURUSD=X': 'EUR/USD',
  'USDJPY=X': 'USD/JPY',
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'CL=F': 'Crude Oil',
  'NG=F': 'Natural Gas',
};

/** Global Search — commodities tab (PRD GlobalSearch §3.3). */
export const COMMODITY_SYMBOLS = ['GC=F', 'SI=F', 'CL=F', 'NG=F'] as const;

/** Global Search — extra indices beyond mainIndex (PRD GlobalSearch §4.2). */
export const EXTRA_INDEX_SYMBOLS = ['^DJI', '^IXIC', '^RUT'] as const;

/** Common FX pairs beyond Indonesia strip. */
export const EXTRA_FOREX_SYMBOLS = ['EURUSD=X', 'USDJPY=X'] as const;

export function searchIndexPool(): string[] {
  return [
    MARKET_CONFIG.us.mainIndex.symbol,
    MARKET_CONFIG.indonesia.mainIndex.symbol,
    MARKET_CONFIG.crypto.mainIndex.symbol,
    ...EXTRA_INDEX_SYMBOLS,
  ];
}

/** Equities have financial statements. Indexes, FX, futures, and crypto pairs do not. */
export function isEquitySymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase();
  if (!s || s.startsWith('^')) return false;
  if (s.endsWith('-USD') || s.includes('USDT')) return false;
  if (s.endsWith('=X') || s.endsWith('=F')) return false;
  return true;
}

export function searchForexPool(): string[] {
  return [
    ...MARKET_CONFIG.us.forexPairs,
    ...MARKET_CONFIG.indonesia.forexPairs,
    ...EXTRA_FOREX_SYMBOLS,
  ];
}
