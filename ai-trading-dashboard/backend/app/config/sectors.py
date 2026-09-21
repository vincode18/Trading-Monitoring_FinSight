"""Basket simbol representatif per sektor — Dashboard v1.1 (IDX-IC / GICS / crypto categories)."""
from __future__ import annotations

SECTOR_BASKETS: dict[str, dict[str, list[str]]] = {
    "us": {
        "Technology": ["XLK", "AAPL", "MSFT", "NVDA"],
        "Financials": ["XLF", "JPM", "BAC", "GS"],
        "Healthcare": ["XLV", "JNJ", "UNH", "PFE"],
        "Consumer Discretionary": ["XLY", "AMZN", "TSLA", "HD"],
        "Consumer Staples": ["XLP", "PG", "KO", "WMT"],
        "Energy": ["XLE", "XOM", "CVX"],
        "Industrials": ["XLI", "CAT", "GE", "HON"],
        "Materials": ["XLB", "LIN", "APD"],
        "Utilities": ["XLU", "NEE", "DUK"],
        "Real Estate": ["XLRE", "PLD", "AMT"],
        "Communication Services": ["XLC", "META", "GOOGL", "NFLX"],
    },
    "indonesia": {
        "Banking": ["BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK"],
        "Telecom": ["TLKM.JK", "EXCL.JK", "ISAT.JK"],
        "Consumer": ["UNVR.JK", "ICBP.JK", "INDF.JK"],
        "Mining": ["ADRO.JK", "PTBA.JK", "ANTM.JK"],
        "Property": ["BSDE.JK", "CTRA.JK", "PWON.JK"],
        "Energy": ["PGAS.JK", "MEDC.JK", "AKRA.JK"],
        "Infrastructure": ["JSMR.JK", "TOWR.JK", "TBIG.JK"],
        "Healthcare": ["KLBF.JK", "SIDO.JK", "MIKA.JK"],
        "Basic Materials": ["INTP.JK", "SMGR.JK", "INCO.JK"],
        "Technology": ["GOTO.JK", "BUKA.JK", "EMTK.JK"],
        "Transportation": ["ASII.JK", "GIAA.JK", "BIRD.JK"],
        "Finance (non-bank)": ["BFIN.JK", "ADMF.JK", "PNLF.JK"],
    },
    "crypto": {
        "Layer 1": ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "AVAX-USD"],
        "DeFi": ["UNI-USD", "AAVE-USD", "LINK-USD"],
        "Meme Coin": ["DOGE-USD", "SHIB-USD", "PEPE-USD"],
        "Stablecoin": ["USDT-USD", "USDC-USD"],
        "Exchange Token": ["BNB-USD", "CRO-USD"],
        "Gaming/Metaverse": ["AXS-USD", "SAND-USD", "MANA-USD"],
    },
}


def mover_pool_for(market: str) -> list[str]:
    baskets = SECTOR_BASKETS.get(market.lower(), {})
    seen: set[str] = set()
    out: list[str] = []
    for syms in baskets.values():
        for s in syms:
            if s not in seen:
                seen.add(s)
                out.append(s)
    return out
