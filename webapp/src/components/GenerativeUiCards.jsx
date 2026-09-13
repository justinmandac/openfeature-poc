import React, { useState } from 'react';
import {
  PieChart,
  Calculator,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Percent
} from 'lucide-react';

/**
 * Portfolio Breakdown Card Widget
 */
export function PortfolioCard({ data, title }) {
  return (
    <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2 font-semibold text-slate-900">
          <PieChart className="w-4 h-4 text-blue-600" />
          <span>{title || 'Asset Allocation'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            Wealth BU
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Generative UI Widget
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {data.map((item) => (
          <div key={item.asset} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span>{item.asset}</span>
              <span className="font-bold text-slate-900">{item.percent}%</span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
              ${item.value.toLocaleString()}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.percent}%`, backgroundColor: item.color || '#2563EB' }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Instant Loan Simulator Widget
 */
export function LoanCalculatorCard({ data, title }) {
  const [amount, setAmount] = useState(data.principal || 50000);
  const [tenure, setTenure] = useState(data.tenureMonths || 36);
  const rate = data.ratePercent || 3.88;

  // Monthly loan payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyRate = (rate / 100) / 12;
  const calculatedMonthly = Math.round(
    (amount * (monthlyRate * Math.pow(1 + monthlyRate, tenure))) /
    (Math.pow(1 + monthlyRate, tenure) - 1)
  );

  return (
    <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2 font-semibold text-slate-900">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>{title || 'Loan Simulator'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
            Retail BU
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Interactive Generative UI
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[11px] text-slate-600 mb-1">
            <span>Loan Amount:</span>
            <span className="font-bold text-slate-900 font-mono">${amount.toLocaleString()} {data.currency}</span>
          </div>
          <input
            type="range"
            min={10000}
            max={200000}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-600 mb-1">
            <span>Tenure:</span>
            <span className="font-bold text-slate-900">{tenure} Months ({Math.round(tenure/12)} Yrs)</span>
          </div>
          <input
            type="range"
            min={12}
            max={60}
            step={12}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-800 font-semibold">Estimated Monthly</div>
            <div className="text-base font-extrabold text-slate-900 font-mono">${calculatedMonthly.toLocaleString()} / mo</div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm transition-colors">
            Request Term Sheet
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * AI Wealth Projection Widget (Tied to feature.advanced-financial-insights)
 */
export function WealthInsightsCard({ data, title }) {
  return (
    <div className="mt-3 p-4 rounded-xl bg-white border border-indigo-200 shadow-sm text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
        <div className="flex items-center space-x-2 font-semibold text-indigo-900">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>{title || 'AI Wealth Projection'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            Wealth BU
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
            Premier Tier Unlocked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-[10px] text-slate-500 font-medium">Current Net Worth</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">${data.currentNetWorth.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200">
          <div className="text-[10px] text-indigo-700 font-medium">5-Yr Target Value</div>
          <div className="text-sm font-bold text-indigo-900 mt-0.5 font-mono">${data.projected5Yr.toLocaleString()} ({data.compoundAnnualGrowthRate})</div>
        </div>
      </div>

      {data.recommendations && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-slate-700">Recommended Allocation Adjustments:</div>
          {data.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start space-x-2 text-[11px] text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * FX Rates Card Widget
 */
export function FxRatesCard({ data, title }) {
  return (
    <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2 font-semibold text-slate-900">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span>{title || 'Interbank FX Rates'}</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          Live Market Feed
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {data.map((pair) => (
          <div key={pair.pair} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
            <div>
              <div className="font-mono font-bold text-slate-900 text-xs">{pair.pair}</div>
              <div className="text-slate-500 font-mono text-[11px]">{pair.rate}</div>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
              pair.change.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {pair.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
