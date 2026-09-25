'use client';

import { useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { FundamentalFitCheck } from '@/components/analysis/FundamentalFitCheck';
import { ShareholderAnalysisPanel } from '@/components/analysis/ShareholderAnalysisPanel';
import { CategoryChart, FUND_COLORS, type ChartSeries } from '@/components/analysis/fundamental/charts';
import { fmt, fmtBig, fmtPct, periodLabel } from '@/components/analysis/fundamental/format';
import { api } from '@/lib/api';
import { isEquitySymbol } from '@/lib/marketConfig';
import type { FundamentalCharts, FundamentalFreq } from '@/types/market';

type FundTab =
  | 'earnings'
  | 'margins'
  | 'balance'
  | 'cash'
  | 'valuation'
  | 'dividends'
  | 'trend'
  | 'shareholders'
  | 'fit';

const TABS: { id: FundTab; label: string }[] = [
  { id: 'earnings', label: 'Earnings' },
  { id: 'margins', label: 'Margins' },
  { id: 'balance', label: 'Balance Sheet' },
  { id: 'cash', label: 'Cash Flow' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'dividends', label: 'Dividends' },
  { id: 'trend', label: 'Trend' },
  { id: 'shareholders', label: 'Shareholders' },
  { id: 'fit', label: 'Fit Check' },
];

const FREQS: { id: FundamentalFreq; label: string }[] = [
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Annually' },
  { id: 'trailing', label: 'TTM' },
];

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-sm text-text-primary">{value}</div>
      {hint && <div className="mt-1 text-[10px] text-text-muted">{hint}</div>}
    </div>
  );
}

function ChartCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-panel p-4">
      <h3 className="text-xs font-medium text-text-primary">{title}</h3>
      {caption && <p className="mt-1 text-[10px] leading-relaxed text-text-muted">{caption}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function labelsOf(periods: string[], freq: string) {
  return periods.map((period) => periodLabel(period, freq));
}

function series(name: string, color: string, values: Array<number | null>, axis?: 'left' | 'right'): ChartSeries {
  return { name, color, values, axis };
}

export function FundamentalAnalysisPanel({ symbol }: { symbol: string }) {
  const [tab, setTab] = useState<FundTab>('earnings');
  const [freq, setFreq] = useState<FundamentalFreq>('quarterly');
  const equity = isEquitySymbol(symbol);
  const showFreq = tab !== 'dividends' && tab !== 'shareholders' && tab !== 'fit';
  const needsCharts = tab !== 'shareholders' && tab !== 'fit';

  const { data, error, isLoading } = useSWR(
    equity && needsCharts ? ['fundamental-charts', symbol, freq] : null,
    () => api.getFundamentalCharts(symbol, freq),
    { keepPreviousData: true }
  );

  if (!equity) {
    return (
      <p className="text-xs text-text-muted">
        Fundamental statements apply to equities. This symbol is an index, FX pair, commodity, or crypto pair.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                tab === item.id
                  ? 'border-positive/50 bg-positive/10 text-positive'
                  : 'border-border text-text-secondary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {showFreq && (
          <div className="flex gap-1">
            {FREQS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFreq(item.id)}
                className={`rounded border px-2 py-1 text-[10px] ${
                  freq === item.id
                    ? 'border-positive/50 bg-positive/10 text-positive'
                    : 'border-border text-text-secondary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && !data && tab !== 'shareholders' && tab !== 'fit' && (
        <p className="text-xs text-text-muted">Loading fundamentals...</p>
      )}
      {error && tab !== 'shareholders' && tab !== 'fit' && (
        <p className="text-xs text-negative">Fundamental data could not be loaded for this symbol.</p>
      )}

      {data && showFreq && (tab === 'valuation' || freq === 'trailing') &&
        data.notes.map((note) => (
          <p key={note} className="text-[10px] leading-relaxed text-text-muted">
            {note}
          </p>
        ))}

      {data && tab === 'earnings' && <EarningsTab data={data} freq={freq} />}
      {data && tab === 'margins' && <MarginsTab data={data} freq={freq} />}
      {data && tab === 'balance' && <BalanceTab data={data} freq={freq} />}
      {data && tab === 'cash' && <CashTab data={data} freq={freq} />}
      {data && tab === 'valuation' && <ValuationTab data={data} freq={freq} />}
      {data && tab === 'dividends' && <DividendsTab data={data} />}
      {data && tab === 'trend' && <TrendTab data={data} freq={freq} />}
      {tab === 'shareholders' && <ShareholderAnalysisPanel symbol={symbol} />}
      {tab === 'fit' && <FundamentalFitCheck symbol={symbol} />}

      {data?.disclaimer && tab !== 'shareholders' && tab !== 'fit' && (
        <p className="text-[10px] leading-relaxed text-text-muted">{data.disclaimer}</p>
      )}
    </div>
  );
}

function lastTwo<T>(rows: T[]): [T | undefined, T | undefined] {
  return [rows[rows.length - 1], rows[rows.length - 2]];
}

function EarningsTab({ data, freq }: { data: FundamentalCharts; freq: string }) {
  const [latest, prior] = lastTwo(data.earnings);
  const cats = labelsOf(data.earnings.map((row) => row.period), freq);
  const yoyCats: string[] = [];
  const current: Array<number | null> = [];
  const previous: Array<number | null> = [];
  data.earnings.forEach((row, index) => {
    if (row.net_income_prior == null && row.net_income == null) return;
    if (row.net_income_prior == null) return;
    yoyCats.push(cats[index]);
    current.push(row.net_income);
    previous.push(row.net_income_prior);
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Revenue" value={fmtBig(latest?.revenue)} hint={prior ? `Prior ${fmtBig(prior.revenue)}` : undefined} />
        <Metric label="Gross profit" value={fmtBig(latest?.gross_profit)} />
        <Metric label="Operating income" value={fmtBig(latest?.operating_income)} />
        <Metric label="Net income" value={fmtBig(latest?.net_income)} hint={prior ? `Prior ${fmtBig(prior.net_income)}` : undefined} />
        <Metric label="EPS" value={fmt(latest?.eps, 2)} />
      </div>
      <ChartCard title="Income statement" caption="Revenue, gross profit, operating income, and net income for each period.">
        <CategoryChart
          mode="grouped"
          ariaLabel="Income statement bars"
          categories={cats}
          formatTick={fmtBig}
          series={[
            series('Revenue', FUND_COLORS.revenue, data.earnings.map((row) => row.revenue)),
            series('Gross profit', FUND_COLORS.gross, data.earnings.map((row) => row.gross_profit)),
            series('Operating income', FUND_COLORS.operating, data.earnings.map((row) => row.operating_income)),
            series('Net income', FUND_COLORS.net, data.earnings.map((row) => row.net_income)),
          ]}
        />
      </ChartCard>
      {yoyCats.length > 0 && (
        <ChartCard title="Net income versus the year-ago period" caption="This period beside the same period one year earlier.">
          <CategoryChart
            mode="grouped"
            ariaLabel="Year over year net income"
            categories={yoyCats}
            formatTick={fmtBig}
            series={[
              series('This period', FUND_COLORS.net, current),
              series('Year ago', FUND_COLORS.prior, previous),
            ]}
          />
        </ChartCard>
      )}
      <ChartCard title="Earnings per share">
        <CategoryChart
          mode="grouped"
          ariaLabel="Earnings per share"
          categories={cats}
          formatTick={(n) => fmt(n, 2)}
          series={[series('EPS', FUND_COLORS.eps, data.earnings.map((row) => row.eps))]}
        />
      </ChartCard>
    </div>
  );
}

function MarginsTab({ data, freq }: { data: FundamentalCharts; freq: string }) {
  const latest = data.margins[data.margins.length - 1];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Gross margin" value={fmtPct(latest?.gross_margin ?? data.ratios.gross_margin)} />
        <Metric label="Operating margin" value={fmtPct(latest?.operating_margin ?? data.ratios.operating_margin)} />
        <Metric label="Net margin" value={fmtPct(latest?.net_margin ?? data.ratios.net_margin)} />
      </div>
      <ChartCard title="Margin trend" caption="Gross profit, operating income, and net income as a percent of revenue.">
        <CategoryChart
          mode="line"
          ariaLabel="Margin trend"
          categories={labelsOf(data.margins.map((row) => row.period), freq)}
          formatTick={(n) => `${n.toFixed(0)}%`}
          series={[
            series('Gross margin', FUND_COLORS.gross, data.margins.map((row) => row.gross_margin)),
            series('Operating margin', FUND_COLORS.operating, data.margins.map((row) => row.operating_margin)),
            series('Net margin', FUND_COLORS.net, data.margins.map((row) => row.net_margin)),
          ]}
        />
      </ChartCard>
    </div>
  );
}

function BalanceTab({ data, freq }: { data: FundamentalCharts; freq: string }) {
  const latest = data.balance[data.balance.length - 1];
  const split = data.balance.some((row) => row.short_debt != null || row.long_debt != null);
  const labelFreq = freq === 'trailing' ? data.balance_freq : freq;
  const debtSeries = split
    ? [
        series('Short-term debt', FUND_COLORS.shortDebt, data.balance.map((row) => row.short_debt)),
        series('Long-term debt', FUND_COLORS.longDebt, data.balance.map((row) => row.long_debt)),
      ]
    : [series('Debt', FUND_COLORS.debt, data.balance.map((row) => row.total_debt))];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total assets" value={fmtBig(latest?.total_assets)} />
        <Metric label="Equity" value={fmtBig(latest?.total_equity)} />
        <Metric label="Debt / equity" value={fmt(latest?.der ?? data.ratios.der, 2)} />
        <Metric label="Debt / capital" value={fmt(latest?.dtcr ?? data.ratios.dtcr, 2)} />
      </div>
      <ChartCard
        title="Capital structure"
        caption="Equity stacked with interest-bearing debt. Other liabilities, such as payables, are not in the stack."
      >
        <CategoryChart
          mode="stacked"
          ariaLabel="Capital structure"
          categories={labelsOf(data.balance.map((row) => row.period), labelFreq)}
          formatTick={fmtBig}
          series={[series('Equity', FUND_COLORS.equity, data.balance.map((row) => row.total_equity)), ...debtSeries]}
        />
      </ChartCard>
      <ChartCard title="Leverage" caption="Debt / equity and debt / capital over time.">
        <CategoryChart
          mode="line"
          ariaLabel="Leverage ratios"
          categories={labelsOf(data.balance.map((row) => row.period), labelFreq)}
          formatTick={(n) => n.toFixed(2)}
          series={[
            series('Debt / equity', FUND_COLORS.longDebt, data.balance.map((row) => row.der)),
            series('Debt / capital', FUND_COLORS.operating, data.balance.map((row) => row.dtcr)),
          ]}
        />
      </ChartCard>
    </div>
  );
}

function CashTab({ data, freq }: { data: FundamentalCharts; freq: string }) {
  const latest = data.cashflow[data.cashflow.length - 1];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Operating cash flow" value={fmtBig(latest?.operating_cash_flow)} />
        <Metric label="Free cash flow" value={fmtBig(latest?.free_cash_flow)} />
        <Metric label="Capex" value={fmtBig(latest?.capex)} />
      </div>
      <ChartCard title="Cash flow history" caption="Operating cash flow, free cash flow, and capital expenditure. Capex is usually reported as a negative number.">
        <CategoryChart
          mode="grouped"
          ariaLabel="Cash flow history"
          categories={labelsOf(data.cashflow.map((row) => row.period), freq)}
          formatTick={fmtBig}
          series={[
            series('Operating cash flow', FUND_COLORS.ocf, data.cashflow.map((row) => row.operating_cash_flow)),
            series('Free cash flow', FUND_COLORS.fcf, data.cashflow.map((row) => row.free_cash_flow)),
            series('Capex', FUND_COLORS.capex, data.cashflow.map((row) => row.capex)),
          ]}
        />
      </ChartCard>
    </div>
  );
}

function ValuationTab({ data, freq }: { data: FundamentalCharts; freq: string }) {
  const ratios = data.ratios;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="P/E" value={fmt(ratios.per)} />
        <Metric label="P/B" value={fmt(ratios.pbv)} />
        <Metric label="EV/EBITDA" value={fmt(ratios.ev_ebitda)} />
        <Metric label="Book value / share" value={fmt(ratios.bvps, 2)} />
        <Metric label="ROE" value={fmtPct(ratios.roe)} />
        <Metric label="ROA" value={fmtPct(ratios.roa)} />
      </div>
      <ChartCard title="Valuation multiples" caption="P/E, P/B, and EV/EBITDA against this symbol's own history.">
        <CategoryChart
          mode="line"
          ariaLabel="Valuation multiples"
          categories={labelsOf(data.valuation.map((row) => row.period), freq)}
          formatTick={(n) => n.toFixed(1)}
          series={[
            series('P/E', FUND_COLORS.per, data.valuation.map((row) => row.per)),
            series('P/B', FUND_COLORS.pbv, data.valuation.map((row) => row.pbv)),
            series('EV/EBITDA', FUND_COLORS.ev, data.valuation.map((row) => row.ev_ebitda)),
          ]}
        />
      </ChartCard>
      <ChartCard title="Book value per share">
        <CategoryChart
          mode="line"
          ariaLabel="Book value per share"
          categories={labelsOf(data.valuation.map((row) => row.period), freq)}
          formatTick={(n) => fmt(n, 2)}
          series={[series('BVPS', FUND_COLORS.bvps, data.valuation.map((row) => row.bvps))]}
        />
      </ChartCard>
    </div>
  );
}

function DividendsTab({ data }: { data: FundamentalCharts }) {
  return (
    <div className="space-y-3">
      <ChartCard title="Dividends by year" caption="Cash dividends summed for each calendar year.">
        <CategoryChart
          mode="grouped"
          ariaLabel="Annual dividends"
          categories={(data.dividend_years ?? []).map((row) => row.date ?? '')}
          formatTick={(n) => fmt(n, 2)}
          series={[series('Dividend', FUND_COLORS.gross, (data.dividend_years ?? []).map((row) => row.amount))]}
        />
      </ChartCard>
      <div className="space-y-1">
        {(data.dividend_payments ?? []).map((row, index) => (
          <div key={`${row.date}-${index}`} className="flex justify-between rounded border border-border-muted px-3 py-2 text-xs">
            <span className="font-mono text-text-secondary">{row.date ?? '—'}</span>
            <span className="font-mono text-text-primary">{fmt(row.amount, 4)}</span>
          </div>
        ))}
        {!data.dividend_payments?.length && <p className="text-xs text-text-muted">No dividend history.</p>}
      </div>
    </div>
  );
}

function TrendTab({ data, freq }: { data: FundamentalCharts; freq: string }) {
  return (
    <div className="space-y-3">
      <ChartCard title="Revenue and net income" caption="Revenue on the left axis, net income on the right.">
        <CategoryChart
          mode="line"
          ariaLabel="Revenue and net income trend"
          categories={labelsOf(data.earnings.map((row) => row.period), freq)}
          formatTick={fmtBig}
          series={[
            series('Revenue', FUND_COLORS.revenue, data.earnings.map((row) => row.revenue), 'left'),
            series('Net income', FUND_COLORS.net, data.earnings.map((row) => row.net_income), 'right'),
          ]}
        />
      </ChartCard>
      <div className="overflow-auto rounded-md border border-border">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-panel text-[10px] uppercase text-text-muted">
            <tr>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Revenue</th>
              <th className="px-3 py-2">Net income</th>
            </tr>
          </thead>
          <tbody>
            {[...data.earnings].reverse().map((row) => (
              <tr key={row.period} className="border-t border-border-muted">
                <td className="px-3 py-1.5 font-mono">{row.period}</td>
                <td className="px-3 py-1.5 font-mono">{fmtBig(row.revenue)}</td>
                <td className="px-3 py-1.5 font-mono">{fmtBig(row.net_income)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
