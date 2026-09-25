import type { Candle } from '@/types/market';

export interface OverlayPoint {
  time: string;
  value: number;
}

export interface StrategyOverlay {
  lines: Array<{ title: string; color: string; data: OverlayPoint[] }>;
  candles?: Candle[];
  markers?: Array<{ time: string; text: string }>;
  hideDefaultMa?: boolean;
  note?: string;
  haUp?: boolean[];
}

const COLORS = ['#6EA8FE', '#F5C16C', '#C084FC', '#3DDC97', '#FF8A80', '#67E8F9'];

function day(iso: string) {
  return iso.split('T')[0];
}

function ema(values: number[], span: number): Array<number | null> {
  const alpha = 2 / (span + 1);
  const out: Array<number | null> = [];
  let prev = values[0];
  values.forEach((value, index) => {
    prev = index === 0 ? value : alpha * value + (1 - alpha) * prev;
    out.push(index + 1 >= span ? prev : null);
  });
  return out;
}

function smma(values: number[], period: number): Array<number | null> {
  const alpha = 1 / period;
  const out: Array<number | null> = [];
  let prev = values[0];
  values.forEach((value, index) => {
    prev = index === 0 ? value : alpha * value + (1 - alpha) * prev;
    out.push(index + 1 >= period ? prev : null);
  });
  return out;
}

function sma(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = [];
  let sum = 0;
  values.forEach((value, index) => {
    sum += value;
    if (index >= period) sum -= values[index - period];
    out.push(index + 1 >= period ? sum / period : null);
  });
  return out;
}

function shift(values: Array<number | null>, bars: number): Array<number | null> {
  return values.map((_, index) => (index >= bars ? values[index - bars] : null));
}

function line(dates: string[], values: Array<number | null>, title: string, color: string) {
  return {
    title,
    color,
    data: dates.flatMap((time, index) =>
      values[index] == null ? [] : [{ time, value: values[index] as number }]
    ),
  };
}

function rolling(values: number[], period: number, mode: 'max' | 'min'): Array<number | null> {
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const window = values.slice(index + 1 - period, index + 1);
    return mode === 'max' ? Math.max(...window) : Math.min(...window);
  });
}

function heikin(candles: Candle[]): Candle[] {
  const out: Candle[] = [];
  candles.forEach((candle, index) => {
    const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
    const prev = out[index - 1];
    const haOpen = prev ? (prev.open + prev.close) / 2 : (candle.open + candle.close) / 2;
    out.push({
      date: candle.date,
      open: haOpen,
      close: haClose,
      high: Math.max(candle.high, haOpen, haClose),
      low: Math.min(candle.low, haOpen, haClose),
      volume: candle.volume,
    });
  });
  return out;
}

function supertrend(candles: Candle[]): { line: Array<number | null>; up: boolean[] } {
  const atrPeriod = 10;
  const mult = 3;
  const trs: number[] = [];
  candles.forEach((candle, index) => {
    const prevClose = index ? candles[index - 1].close : candle.close;
    trs.push(Math.max(candle.high - candle.low, Math.abs(candle.high - prevClose), Math.abs(candle.low - prevClose)));
  });
  const atr = smma(trs, atrPeriod);
  const final: Array<number | null> = [];
  const dirs: number[] = [];
  candles.forEach((candle, index) => {
    const atrValue = atr[index];
    if (atrValue == null) {
      final.push(null);
      dirs.push(1);
      return;
    }
    const hl2 = (candle.high + candle.low) / 2;
    const basicUpper = hl2 + mult * atrValue;
    const basicLower = hl2 - mult * atrValue;
    const prevFinal = final[index - 1];
    const prevDir = dirs[index - 1] ?? 1;
    if (prevFinal == null) {
      final.push(basicLower);
      dirs.push(1);
      return;
    }
    const lower = prevDir === 1 ? Math.max(basicLower, prevFinal) : basicLower;
    const upper = prevDir === -1 ? Math.min(basicUpper, prevFinal) : basicUpper;
    let direction = prevDir;
    let value = lower;
    if (prevDir === 1 && candle.close < prevFinal) {
      direction = -1;
      value = upper;
    } else if (prevDir === -1 && candle.close > prevFinal) {
      direction = 1;
      value = lower;
    } else {
      value = direction === 1 ? lower : upper;
    }
    final.push(value);
    dirs.push(direction);
  });
  return { line: final, up: dirs.map((dir) => dir === 1) };
}

export function buildStrategyOverlay(candles: Candle[], slug: string): StrategyOverlay | null {
  if (!candles.length) return null;
  const dates = candles.map((candle) => day(candle.date));
  const close = candles.map((candle) => candle.close);
  const high = candles.map((candle) => candle.high);
  const low = candles.map((candle) => candle.low);
  const median = candles.map((candle) => (candle.high + candle.low) / 2);

  if (slug === 'profitunity') {
    const lips = shift(smma(median, 5), 3);
    const teeth = shift(smma(median, 8), 5);
    const jaw = shift(smma(median, 13), 8);
    const markers = dates.flatMap((time, index) => {
      if (index < 2 || index > dates.length - 3) return [];
      const window = high.slice(index - 2, index + 3);
      const isFractal = high[index] === Math.max(...window);
      const lip = lips[index];
      if (!isFractal || lip == null || close[index] <= lip) return [];
      return [{ time, text: 'FR' }];
    });
    return {
      hideDefaultMa: true,
      note: 'Jaw, Teeth, and Lips. FR marks an up fractal above the Lips line.',
      lines: [
        line(dates, jaw, 'Jaw', COLORS[0]),
        line(dates, teeth, 'Teeth', COLORS[1]),
        line(dates, lips, 'Lips', COLORS[3]),
      ],
      markers: markers.slice(-6),
    };
  }

  if (slug === 'ichimoku') {
    const tenkan = dates.map((_, index) => {
      if (index < 8) return null;
      const h = Math.max(...high.slice(index - 8, index + 1));
      const l = Math.min(...low.slice(index - 8, index + 1));
      return (h + l) / 2;
    });
    const kijun = dates.map((_, index) => {
      if (index < 25) return null;
      const h = Math.max(...high.slice(index - 25, index + 1));
      const l = Math.min(...low.slice(index - 25, index + 1));
      return (h + l) / 2;
    });
    const spanA = shift(
      tenkan.map((value, index) => (value == null || kijun[index] == null ? null : (value + (kijun[index] as number)) / 2)),
      26
    );
    const spanB = shift(
      dates.map((_, index) => {
        if (index < 51) return null;
        return (Math.max(...high.slice(index - 51, index + 1)) + Math.min(...low.slice(index - 51, index + 1))) / 2;
      }),
      26
    );
    return {
      hideDefaultMa: true,
      note: 'Tenkan, Kijun, and the two cloud lines (Senkou A and Senkou B).',
      lines: [
        line(dates, tenkan, 'Tenkan', COLORS[0]),
        line(dates, kijun, 'Kijun', COLORS[1]),
        line(dates, spanA, 'Senkou A', COLORS[3]),
        line(dates, spanB, 'Senkou B', COLORS[4]),
      ],
    };
  }

  if (slug === 'minervini') {
    return {
      hideDefaultMa: true,
      note: '50, 150, and 200-day averages used by the trend template.',
      lines: [
        line(dates, sma(close, 50), 'MA50', COLORS[1]),
        line(dates, sma(close, 150), 'MA150', COLORS[0]),
        line(dates, sma(close, 200), 'MA200', COLORS[4]),
      ],
    };
  }

  if (slug === 'guppy') {
    const short = [3, 5, 8, 10, 12, 15];
    const long = [30, 35, 40, 45, 50, 60];
    return {
      hideDefaultMa: true,
      note: 'Short EMAs in blue, long EMAs in amber.',
      lines: [
        ...short.map((period) => line(dates, ema(close, period), `EMA${period}`, '#6EA8FE')),
        ...long.map((period) => line(dates, ema(close, period), `EMA${period}`, '#F5C16C')),
      ],
    };
  }

  if (slug === 'turtle') {
    const upper = shift(rolling(high, 20, 'max'), 1);
    const lower = shift(rolling(low, 10, 'min'), 1);
    return {
      hideDefaultMa: true,
      note: 'Prior 20-day high and prior 10-day low.',
      lines: [
        line(dates, upper, 'Upper 20', COLORS[3]),
        line(dates, lower, 'Lower 10', COLORS[4]),
      ],
    };
  }

  if (slug === 'supertrend') {
    const trend = supertrend(candles);
    const up = trend.line.map((value, index) => (trend.up[index] ? value : null));
    const down = trend.line.map((value, index) => (trend.up[index] ? null : value));
    return {
      hideDefaultMa: true,
      note: 'SuperTrend line. Green while the rule is up, red while it is down.',
      lines: [
        line(dates, up, 'SuperTrend up', COLORS[3]),
        line(dates, down, 'SuperTrend down', COLORS[4]),
      ],
    };
  }

  if (slug === 'heiken-ashi') {
    const synthetic = heikin(candles);
    return {
      hideDefaultMa: true,
      note: 'Price candles are replaced with Heikin Ashi candles, with the 20-day EMA on the close.',
      candles: synthetic,
      lines: [line(dates, ema(close, 20), 'EMA20', COLORS[1])],
      haUp: synthetic.map((candle) => candle.close >= candle.open).slice(-24),
    };
  }

  return null;
}
