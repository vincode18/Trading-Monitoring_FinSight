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
};
