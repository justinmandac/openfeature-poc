import React from 'react';
import { useBooleanFlagValue } from '@openfeature/react-sdk';
import {
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  CreditCard,
  Building,
  Sparkles,
  Download,
  Send,
  Plus,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

const TRANSACTIONS = [
  {
    id: 'tx-101',
    merchant: 'AWS Cloud Infrastructure',
    date: 'Today, 2:45 PM',
    category: 'Cloud & Tech',
    amount: -1420.50,
    status: 'Settled',
    account: 'Premier Checking (...4920)'
  },
  {
    id: 'tx-102',
    merchant: 'Inbound Treasury Wire - Apex SG',
    date: 'Yesterday, 11:20 AM',
    category: 'Wire Transfer',
    amount: 18500.00,
    status: 'Settled',
    account: 'Treasury Savings (...8102)'
  },
  {
    id: 'tx-103',
    merchant: 'Bloomberg Professional Subscription',
    date: 'Sep 10, 2026',
    category: 'Financial Services',
    amount: -2200.00,
    status: 'Settled',
    account: 'Premier Checking (...4920)'
  },
  {
    id: 'tx-104',
    merchant: 'Singapore Airlines - First Suite',
    date: 'Sep 08, 2026',
    category: 'Travel & Mobility',
    amount: -4890.00,
    status: 'Settled',
    account: 'Premier Checking (...4920)'
  },
  {
    id: 'tx-105',
    merchant: 'Quarterly Investment Dividend - Tech ETF',
    date: 'Sep 05, 2026',
    category: 'Dividend',
    amount: 3450.70,
    status: 'Settled',
    account: 'Treasury Savings (...8102)'
  }
];

export default function DashboardOverview({ currentContext, onOpenAssistant }) {
  // Evaluates advanced insights flag via OpenFeature React SDK
  const advancedInsightsFlag = useBooleanFlagValue('feature.advanced-financial-insights', false);
  const chatbotGeminiUi = useBooleanFlagValue('feature.chatbot-gemini-ui', false);

  const isPremier = currentContext.userTier === 'PREMIUM';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Net Worth Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Executive Account Summary
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {currentContext.country} Entity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global liquidity overview, verified under institutional custody.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors">
            <Send className="w-3.5 h-3.5" />
            <span>Send Transfer</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition-colors">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Statements</span>
          </button>
          {chatbotGeminiUi && onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Apex Copilot</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Balance Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Premier Checking */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Premier Checking
            </span>
            <span className="text-[11px] font-mono text-slate-400">...4920</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            $24,850.20
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center text-emerald-600 font-medium">
              <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" />
              +$3,250.00 this week
            </span>
            <span className="text-slate-400">
              {currentContext.country === 'SG'
                ? 'SGD Linked'
                : currentContext.country === 'HK'
                ? 'HKD Linked'
                : currentContext.country === 'AE'
                ? 'AED Linked'
                : 'INR Linked'}
            </span>
          </div>
        </div>

        {/* High-Yield Treasury Savings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Treasury High-Yield
            </span>
            <span className="text-[11px] font-mono text-slate-400">...8102</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            $118,420.00
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="text-blue-600 font-medium font-mono">
              4.85% APY Fixed
            </span>
            <span className="text-slate-400">Daily Accrual</span>
          </div>
        </div>

        {/* Total Net Liquidity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Net Worth
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-blue-300 border border-slate-700">
              AUDITED
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            $143,270.20
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span className="text-emerald-400 font-medium flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +8.4% YTD Performance
            </span>
            <span className="text-slate-400">Tier 1 Capital</span>
          </div>
        </div>
      </div>

      {/* Conditionally Flagged AI Wealth Insights Banner (feature.advanced-financial-insights) */}
      {advancedInsightsFlag && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI Wealth Projection & Advisory (Premier Tier)</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
              Flag: feature.advanced-financial-insights = ACTIVE
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
              <div className="text-slate-500 text-[11px]">5-Year Target Value</div>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">$248,500.00</div>
              <div className="text-emerald-600 text-[10px] mt-0.5 font-medium">+12.4% Annualized CAGR</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
              <div className="text-slate-500 text-[11px]">Recommended Asset Shift</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">Short-Duration Bonds</div>
              <div className="text-blue-600 text-[10px] mt-0.5 font-medium">Rebalance risk buffer</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
              <div className="text-slate-500 text-[11px]">Portfolio Health Score</div>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">94 / 100</div>
              <div className="text-slate-500 text-[10px] mt-0.5">Optimal asset diversification</div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Feed Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Real-time ledger updates across verified accounts</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">5 items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-2.5 px-5">Merchant / Counterparty</th>
                <th className="py-2.5 px-4">Account</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TRANSACTIONS.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-slate-900">
                      {tx.merchant}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {tx.account}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {tx.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-3.5 px-5 text-right font-mono font-semibold ${
                      isPositive ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {isPositive ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
