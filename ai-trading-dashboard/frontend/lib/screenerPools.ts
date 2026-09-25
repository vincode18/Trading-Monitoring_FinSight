import { MARKET_CONFIG, type MarketId } from '@/lib/marketConfig';

/** Screener universes. Separate from the dashboard's three market tabs. */
export type ScreenerPoolId =
  | 'all'
  | 'us'
  | 'indonesia'
  | 'asia'
  | 'europe'
  | 'crypto'
  | 'currencies'
  | 'commodities'
  | 'rates';

export interface ScreenerPool {
  id: ScreenerPoolId;
  label: string;
  /** Equities can run fundamental screens. Forex, crypto, commodities, and rates cannot. */
  equity: boolean;
  symbols: string[];
}

const ASIA = [
  '7203.T',
  '6758.T',
  '9984.T',
  '6861.T',
  '8306.T',
  '0700.HK',
  '9988.HK',
  '0941.HK',
  '1299.HK',
  '0005.HK',
  'D05.SI',
  'O39.SI',
  'U11.SI',
  'Z74.SI',
  '005930.KS',
  '000660.KS',
  '005380.KS',
];

const EUROPE = [
  'SHEL.L',
  'AZN.L',
  'HSBA.L',
  'ULVR.L',
  'BP.L',
  'SAP.DE',
  'SIE.DE',
  'ALV.DE',
  'BMW.DE',
  'DTE.DE',
  'MC.PA',
  'OR.PA',
  'TTE.PA',
  'AIR.PA',
  'SAN.PA',
  'ASML.AS',
  'NESN.SW',
  'NOVN.SW',
  'ROG.SW',
];

const CURRENCIES = [
  'EURUSD=X',
  'GBPUSD=X',
  'USDJPY=X',
  'USDCHF=X',
  'AUDUSD=X',
  'USDCAD=X',
  'NZDUSD=X',
  'EURGBP=X',
  'EURJPY=X',
  'GBPJPY=X',
  'EURCHF=X',
  'USDIDR=X',
  'SGDIDR=X',
];

const COMMODITIES = ['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'ZC=F', 'KC=F'];

const RATES = ['^IRX', '^FVX', '^TNX', '^TYX'];

const REGION_POOLS: ScreenerPool[] = [
  { id: 'us', label: 'US', equity: true, symbols: [...MARKET_CONFIG.us.moverPoolSymbols] },
  {
    id: 'indonesia',
    label: 'Indonesia',
    equity: true,
    symbols: [...MARKET_CONFIG.indonesia.moverPoolSymbols],
  },
  { id: 'asia', label: 'Asia (ex-Indonesia)', equity: true, symbols: ASIA },
  { id: 'europe', label: 'Europe', equity: true, symbols: EUROPE },
  { id: 'crypto', label: 'Crypto', equity: false, symbols: [...MARKET_CONFIG.crypto.moverPoolSymbols] },
  { id: 'currencies', label: 'Currencies', equity: false, symbols: CURRENCIES },
  { id: 'commodities', label: 'Commodities', equity: false, symbols: COMMODITIES },
  { id: 'rates', label: 'Rates', equity: false, symbols: RATES },
];

function unionPools(pools: ScreenerPool[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  pools.forEach((pool) => {
    pool.symbols.forEach((symbol) => {
      if (!seen.has(symbol)) {
        seen.add(symbol);
        out.push(symbol);
      }
    });
  });
  return out;
}

export const SCREENER_POOLS: ScreenerPool[] = [
  { id: 'all', label: 'All Markets', equity: true, symbols: unionPools(REGION_POOLS) },
  ...REGION_POOLS,
];

export function defaultScreenerPool(market: MarketId): ScreenerPoolId {
  if (market === 'indonesia') return 'indonesia';
  if (market === 'crypto') return 'crypto';
  return 'us';
}

export function screenerPool(id: ScreenerPoolId): ScreenerPool {
  return SCREENER_POOLS.find((pool) => pool.id === id) ?? SCREENER_POOLS[0];
}
