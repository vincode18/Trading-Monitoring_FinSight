export type MarketId = 'us' | 'indonesia' | 'crypto';

/** Mirror of backend sector baskets — used for mover pool + news symbols. */
export const SECTOR_BASKETS: Record<MarketId, Record<string, string[]>> = {
  us: {
    Technology: ['XLK', 'AAPL', 'MSFT', 'NVDA'],
    Financials: ['XLF', 'JPM', 'BAC', 'GS'],
    Healthcare: ['XLV', 'JNJ', 'UNH', 'PFE'],
    'Consumer Discretionary': ['XLY', 'AMZN', 'TSLA', 'HD'],
    'Consumer Staples': ['XLP', 'PG', 'KO', 'WMT'],
    Energy: ['XLE', 'XOM', 'CVX'],
    Industrials: ['XLI', 'CAT', 'GE', 'HON'],
    Materials: ['XLB', 'LIN', 'APD'],
    Utilities: ['XLU', 'NEE', 'DUK'],
    'Real Estate': ['XLRE', 'PLD', 'AMT'],
    'Communication Services': ['XLC', 'META', 'GOOGL', 'NFLX'],
  },
  indonesia: {
    Banking: ['BBCA.JK', 'BBRI.JK', 'BMRI.JK', 'BBNI.JK'],
    Telecom: ['TLKM.JK', 'EXCL.JK', 'ISAT.JK'],
    Consumer: ['UNVR.JK', 'ICBP.JK', 'INDF.JK'],
    Mining: ['ADRO.JK', 'PTBA.JK', 'ANTM.JK'],
    Property: ['BSDE.JK', 'CTRA.JK', 'PWON.JK'],
    Energy: ['PGAS.JK', 'MEDC.JK', 'AKRA.JK'],
    Infrastructure: ['JSMR.JK', 'TOWR.JK', 'TBIG.JK'],
    Healthcare: ['KLBF.JK', 'SIDO.JK', 'MIKA.JK'],
    'Basic Materials': ['INTP.JK', 'SMGR.JK', 'INCO.JK'],
    Technology: ['GOTO.JK', 'BUKA.JK', 'EMTK.JK'],
    Transportation: ['ASII.JK', 'GIAA.JK', 'BIRD.JK'],
    'Finance (non-bank)': ['BFIN.JK', 'ADMF.JK', 'PNLF.JK'],
  },
  crypto: {
    'Layer 1': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'AVAX-USD'],
    DeFi: ['UNI-USD', 'AAVE-USD', 'LINK-USD'],
    'Meme Coin': ['DOGE-USD', 'SHIB-USD', 'PEPE-USD'],
    Stablecoin: ['USDT-USD', 'USDC-USD'],
    'Exchange Token': ['BNB-USD', 'CRO-USD'],
    'Gaming/Metaverse': ['AXS-USD', 'SAND-USD', 'MANA-USD'],
  },
};

export function unionSectorSymbols(market: MarketId): string[] {
  const baskets = SECTOR_BASKETS[market];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const syms of Object.values(baskets)) {
    for (const s of syms) {
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  }
  return out;
}

/** Max movers in status strip after index (fuller marquee; pool is ~20–40/market). */
export const TICKER_MOVER_LIMIT = 40;
